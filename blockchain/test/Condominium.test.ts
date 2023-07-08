import { time, loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { ethers } from "hardhat";
import { Condominium } from "../typechain-types";

describe("Condominium", function () {

  enum Options {
    EMPTY = 0,
    YES = 1,
    NO = 2,
    ABSTENTION = 3
  }

  enum Status {
    IDLE = 0,
    VOTING = 1,
    APPROVED = 2,
    DENIED = 3,
    SPENT = 4
  }

  enum Category {
    DECISION = 0,
    SPENT = 1,
    CHANGE_QUOTA = 2,
    CHANGE_MANAGER = 3
  }

  async function addResidents(contract: Condominium, count: number, accounts: SignerWithAddress[]) {
    for (let i = 1; i <= count; i++) {
      const residenceId = (1000 * Math.ceil(i / 25)) + (100 * Math.ceil(i / 5)) + (i - (5 * Math.floor((i - 1) / 5)));
      await contract.addResident(accounts[i - 1].address, residenceId); // 1 101

      const instance = contract.connect(accounts[i-1]);
      await instance.payQuota(residenceId, {value: ethers.utils.parseEther("0.01")});      
    }
  }
  
  async function addVotes(contract: Condominium, count: number, accounts: SignerWithAddress[], shouldApprove: boolean = true) {
    for (let i = 1; i <= count; i++) {
      const instance = contract.connect(accounts[i -1]);
      await instance.vote("topic 1", shouldApprove ? Options.YES : Options.NO);
    }
  }

  async function deployFixture() {

    const accounts = await ethers.getSigners();
    const manager = accounts[0];
    const res = accounts[1];

    const Condominium = await ethers.getContractFactory("Condominium");
    const cc = await Condominium.deploy();

    return { cc, manager, res, accounts };
  }

  it("Should be residence", async function () {
    const { cc, manager, res, accounts } = await loadFixture(deployFixture);
    expect(await cc.residenceExists(2102)).to.equal(true);
  });

  it("Should add resident", async function () {
    const { cc, manager, res, accounts } = await loadFixture(deployFixture);
    await cc.addResident(res.address, 2102);
    expect(await cc.isResident(res.address)).to.equal(true);
  });

  it("Should NOT add resident (address)", async function () {
    const { cc, manager, res, accounts } = await loadFixture(deployFixture);
    await expect(cc.addResident("0x0000000000000000000000000000000000000000", 2102)).to.be.revertedWith("Invalid address");
  });

  it("Should NOT add resident (not council or manager)", async function () {
    const { cc, manager, res, accounts } = await loadFixture(deployFixture);
    const instance = cc.connect(res);
    await expect(instance.addResident(res.address, 2102)).to.be.revertedWith("Only the manager or the council can do this");
  });

  it("Should NOT add resident (residence does not exists)", async function () {
    const { cc, manager, res, accounts } = await loadFixture(deployFixture);
    await expect(cc.addResident(res.address, 21020)).to.be.revertedWith("This residence does not exists");
  });

  it("Should remove resident (latest)", async function () {
    const { cc, manager, res, accounts } = await loadFixture(deployFixture);
    await cc.addResident(res.address, 2102);
    expect(await cc.isResident(res.address)).to.equal(true);
    await cc.removeResident(res.address);
    expect(await cc.isResident(res.address)).to.equal(false);
  });

  it("Should remove resident (first)", async function () {
    const { cc, manager, res, accounts } = await loadFixture(deployFixture);
    
    await cc.addResident(res.address, 2102);
    expect(await cc.isResident(res.address)).to.equal(true);

    await cc.addResident(accounts[2].address, 2103);

    // Tornado counselor para cobrir o else do _isCounselor
    await cc.setCounselor(accounts[2].address, true);

    await cc.removeResident(res.address);
    expect(await cc.isResident(res.address)).to.equal(false);
  });

  it("Should NOT remove resident (permission)", async function () {
    const { cc, manager, res, accounts } = await loadFixture(deployFixture);
    await cc.addResident(res.address, 2102);
    const instance = cc.connect(res);
    await expect(instance.removeResident(res.address)).to.be.revertedWith("Only the manager can do this");
  });

  it("Should NOT remove resident (counselor)", async function () {
    const { cc, manager, res, accounts } = await loadFixture(deployFixture);
    await cc.addResident(res.address, 2102);
    await cc.setCounselor(res.address,true);
    await expect(cc.removeResident(res.address)).to.be.revertedWith("A counselor cannot be removed");
  });

  it("Should add counselor", async function () {
    const { cc, manager, res, accounts } = await loadFixture(deployFixture);
    
    await cc.addResident(res.address, 2102);
    await cc.setCounselor(res.address,true);
    
    const resident = await cc.getResident(res.address)
    expect(resident.isCounselor).to.equal(true);
    
    // Teste extra, para passar pelas linhas antes não cobertas e aumentar a cobertura dos testes
    // Verificar se um counselor pode adicionar um resident
    const instance = cc.connect(res);
    await instance.addResident(accounts[2].address, 1302);
    expect(await cc.isResident(accounts[2].address)).to.equal(true);
  });

  it("Should remove counselor (latest)", async function () {
    const { cc, manager, res, accounts } = await loadFixture(deployFixture);
    await cc.addResident(res.address, 2102);

    await cc.setCounselor(res.address,true);
    const residentBefore = await cc.getResident(res.address)
    expect(residentBefore.isCounselor).to.equal(true);

    await cc.setCounselor(res.address,false);
    const residentAfter = await cc.getResident(res.address)
    expect(residentAfter.isCounselor).to.equal(false);
  });

  it("Should remove counselor (first)", async function () {
    const { cc, manager, res, accounts } = await loadFixture(deployFixture);
    await cc.addResident(res.address, 2102);
    await cc.addResident(accounts[2].address, 2103);

    await cc.setCounselor(res.address,true);
    await cc.setCounselor(accounts[2].address,true);

    const residentBefore = await cc.getResident(res.address)
    expect(residentBefore.isCounselor).to.equal(true);

    await cc.setCounselor(res.address,false);
    const residentAfter = await cc.getResident(res.address)
    expect(residentAfter.isCounselor).to.equal(false);
  });

  it("Should NOT remove counselor (address)", async function () {
    const { cc, manager, res, accounts } = await loadFixture(deployFixture);
    await expect(cc.setCounselor("0x0000000000000000000000000000000000000000", false)).to.be.revertedWith("Invalid address");
  });  

  it("Should NOT add counselor (permission)", async function () {
    const { cc, manager, res, accounts } = await loadFixture(deployFixture);
    await cc.addResident(res.address, 2102);
    const instance = cc.connect(res);
    await expect(instance.setCounselor(res.address,true)).to.be.revertedWith("Only the manager can do this");
  });

  it("Should NOT remove counselor (permission)", async function () {
    const { cc, manager, res, accounts } = await loadFixture(deployFixture);
    await cc.addResident(res.address, 2102);
    await cc.setCounselor(res.address, true);
    const instance = cc.connect(res);
    await expect(instance.setCounselor(res.address,false)).to.be.revertedWith("Only the manager can do this");
  });

  it("Should NOT remove counselor (not exists)", async function () {
    const { cc, manager, res, accounts } = await loadFixture(deployFixture);
    await expect(cc.setCounselor(res.address,false)).to.be.revertedWith("Counselor not found");
  });

  it("Should NOT remove counselor (exists another counselor)", async function () {
    const { cc, manager, res, accounts } = await loadFixture(deployFixture);
    await cc.addResident(res.address, 2102);
    await cc.setCounselor(res.address, true);

    await expect(cc.setCounselor(accounts[2].address,false)).to.be.revertedWith("Counselor not found");
  });

  it("Should NOT add counselor (address)", async function () {
    const { cc, manager, res, accounts } = await loadFixture(deployFixture);
    await expect(cc.setCounselor("0x0000000000000000000000000000000000000000", true)).to.be.revertedWith("Invalid address");
  });

  it("Should NOT add counselor (not resident)", async function () {
    const { cc, manager, res, accounts } = await loadFixture(deployFixture);
    await expect(cc.setCounselor(res.address,true)).to.be.revertedWith("The counselor must be a resident");
  });

  it("Should change manager", async function () {
    const { cc, manager, res, accounts } = await loadFixture(deployFixture);

    await addResidents(cc, 15, accounts);
    await cc.addTopic("topic 1", "description 1", Category.CHANGE_MANAGER, 0, res.address);
    await cc.openVoting("topic 1");
    await addVotes(cc, 15, accounts);
    await cc.closeVoting("topic 1");
    
    expect(await cc.manager()).to.equal(res.address);
  });

  it("Should change quota", async function () {
    const { cc, manager, res, accounts } = await loadFixture(deployFixture);
    const newQuotaValue = ethers.utils.parseEther("0.02");

    await addResidents(cc, 20, accounts);
    await cc.addTopic("topic 1", "description 1", Category.CHANGE_QUOTA, newQuotaValue, manager.address);
    await cc.openVoting("topic 1");
    await addVotes(cc, 20, accounts);
    await cc.closeVoting("topic 1");
    
    expect(await cc.monthlyQuota()).to.equal(newQuotaValue);
  });

  it("Should get topic", async function () {
    const { cc, manager, res, accounts } = await loadFixture(deployFixture);
    await cc.addTopic("Topic 01", "Description topic 01.", Category.DECISION, 0, manager.address);
    await cc.addTopic("Topic 02", "Description topic 02.", Category.DECISION, 0, manager.address);
    
    const topic = await cc.getTopic("Topic 02");

    expect(topic.title).to.equal("Topic 02");
  });

  it("Should add topic (manager)", async function () {
    const { cc, manager, res, accounts } = await loadFixture(deployFixture);
    await cc.addTopic("Topic 01", "Description topic 01.", Category.DECISION, 0, manager.address);
    expect(await cc.topicExists("Topic 01")).to.equal(true);
  });

  it("Should NOT add topic (amount)", async function () {
    const { cc, manager, res, accounts } = await loadFixture(deployFixture);
    await expect(cc.addTopic("Topic 01", "Description topic 01.", Category.DECISION, 10, manager.address))
                .to.be.revertedWith("Wrong category");
  });

  it("Should add topic (resident)", async function () {
    const { cc, manager, res, accounts } = await loadFixture(deployFixture);
    await addResidents(cc, 1, [res]);
    const instance = cc.connect(res);
    await instance.addTopic("Topic 01", "Description topic 01.", Category.DECISION, 0, manager.address);
    expect(await cc.topicExists("Topic 01")).to.equal(true);
  });
  
  it("Should NOT add topic (permission)", async function () {
    const { cc, manager, res, accounts } = await loadFixture(deployFixture);
    const instance = cc.connect(res);
    await expect(instance.addTopic("Topic 01", "Description topic 01.", Category.DECISION, 0, manager.address))
          .to.be.revertedWith("Only the manager or the residents can do this");
  });

  it("Should NOT add topic (duplicated)", async function () {
    const { cc, manager, res, accounts } = await loadFixture(deployFixture);
    await cc.addTopic("Topic 01", "Description topic 01.", Category.DECISION, 0, manager.address);
    await expect(cc.addTopic("Topic 01", "Description topic 01.", Category.DECISION, 0, manager.address))
          .to.be.revertedWith("This topic already exists");
  });  

  it("Should edit topic (manager)", async function () {
    const { cc, manager, res, accounts } = await loadFixture(deployFixture);
    await cc.addTopic("Topic 01", "Description topic 01.", Category.SPENT, 1, manager.address);
    await cc.editTopic("Topic 01", "new description", 2, manager.address);
    
    const topic = await cc.getTopic("Topic 01");
    expect(topic.description).to.equal("new description");
  });

  it("Should edit topic (nothing)", async function () {
    const { cc, manager, res, accounts } = await loadFixture(deployFixture);
    await cc.addTopic("Topic 01", "Description topic 01.", Category.SPENT, 1, manager.address);
    await cc.editTopic("Topic 01", "", 0, "0x0000000000000000000000000000000000000000");
    
    const topic = await cc.getTopic("Topic 01");
    expect(topic.description).to.equal("Description topic 01.");
  });

  it("Should NOT edit topic (permission)", async function () {
    const { cc, manager, res, accounts } = await loadFixture(deployFixture);
    await cc.addTopic("Topic 01", "Description topic 01.", Category.SPENT, 1, manager.address);
    const instance = cc.connect(res);
    await expect(instance.editTopic("Topic 01", "new description", 2, manager.address)).to.be.revertedWith("Only the manager can do this");
  });
  
  it("Should NOT edit topic (not exists)", async function () {
    const { cc, manager, res, accounts } = await loadFixture(deployFixture);
    await expect(cc.editTopic("Topic 01", "new description", 2, manager.address)).to.be.revertedWith("This topic does not exists");
  });
  
  it("Should NOT edit topic (status)", async function () {
    const { cc, manager, res, accounts } = await loadFixture(deployFixture);
    await cc.addTopic("Topic 01", "Description topic 01.", Category.SPENT, 1, manager.address);
    await cc.openVoting("Topic 01");
    await expect(cc.editTopic("Topic 01", "new description", 2, manager.address)).to.be.revertedWith("Only IDLE topics can be edited");
  });

  it("Should remove topic (latest)", async function () {
    const { cc, manager, res, accounts } = await loadFixture(deployFixture);
    await cc.addTopic("Topic 01", "Description topic 01.", Category.DECISION, 0, manager.address);
    expect(await cc.topicExists("Topic 01")).to.equal(true);
    await cc.removeTopic("Topic 01");
    expect(await cc.topicExists("Topic 01")).to.equal(false);
  });

  it("Should remove topic (first)", async function () {
    const { cc, manager, res, accounts } = await loadFixture(deployFixture);
    await cc.addTopic("Topic 01", "Description topic 01.", Category.DECISION, 0, manager.address);
    await cc.addTopic("Topic 02", "Description topic 02.", Category.DECISION, 0, manager.address);
    expect(await cc.topicExists("Topic 01")).to.equal(true);
    await cc.removeTopic("Topic 01");
    expect(await cc.topicExists("Topic 01")).to.equal(false);
  });

  it("Should NOT remove topic (permission)", async function () {
    const { cc, manager, res, accounts } = await loadFixture(deployFixture);
    await cc.addTopic("Topic 01", "Description topic 01.", Category.DECISION, 0, manager.address);
    const instance = cc.connect(res);
    await expect(instance.removeTopic("Topic 01")).to.be.revertedWith("Only the manager can do this");
  });

  it("Should NOT remove topic (it does not exists)", async function () {
    const { cc, manager, res, accounts } = await loadFixture(deployFixture);
    await expect(cc.removeTopic("Topic 01")).to.be.revertedWith("The topic does not exists");
  });

  it("Should NOT remove topic (status)", async function () {
    const { cc, manager, res, accounts } = await loadFixture(deployFixture);

    await cc.addTopic("topic 1", "description 1", Category.DECISION, 0, manager.address);

    await cc.openVoting("topic 1");

    await expect(cc.removeTopic("topic 1")).to.be.revertedWith("Only IDLE topics can be removed");
  });

  it("Should vote", async function () {
    const { cc, manager, res, accounts } = await loadFixture(deployFixture);

    await addResidents(cc, 1, [res]);
    await cc.addTopic("topic 1", "description 1", Category.DECISION, 0, manager.address);
    await cc.openVoting("topic 1");

    const instance = cc.connect(res);
    await instance.vote("topic 1", Options.ABSTENTION);

    expect(await instance.numberOfVotes("topic 1")).to.equal(1);
  });

  it("Should NOT vote (duplicated)", async function () {
    const { cc, manager, res, accounts } = await loadFixture(deployFixture);

    await addResidents(cc, 1, [res]);
    await cc.addTopic("topic 1", "description 1", Category.DECISION, 0, manager.address);
    await cc.openVoting("topic 1");

    const instance = cc.connect(res);
    await instance.vote("topic 1", Options.YES);

    await expect(instance.vote("topic 1", Options.YES)).to.be.revertedWith("A residence should vote only once");
  });

  it("Should NOT vote (defaulter)", async function () {
    const { cc, manager, res, accounts } = await loadFixture(deployFixture);

    await cc.addResident(res.address, 2102);
    await cc.addTopic("topic 1", "description 1", Category.DECISION, 0, manager.address);
    await cc.openVoting("topic 1");

    const instance = cc.connect(res);
    await expect(instance.vote("topic 1", Options.YES)).to.be.revertedWith("The resident must not be defaulter");
  });

  it("Should NOT vote (status)", async function () {
    const { cc, manager, res, accounts } = await loadFixture(deployFixture);

    await addResidents(cc, 1, [res]);
    await cc.addTopic("topic 1", "description 1", Category.DECISION, 0, manager.address);

    const instance = cc.connect(res);

    await expect(instance.vote("topic 1", Options.YES)).to.be.revertedWith("Only VOTING topics can be voted");
  });

  it("Should NOT vote (exists)", async function () {
    const { cc, manager, res, accounts } = await loadFixture(deployFixture);

    await addResidents(cc, 1, [res]);
    const instance = cc.connect(res);

    await expect(instance.vote("topic 1", Options.YES)).to.be.revertedWith("The topic does not exists");
  });

  it("Should NOT vote (permission)", async function () {
    const { cc, manager, res, accounts } = await loadFixture(deployFixture);

    await cc.addTopic("topic 1", "description 1", Category.DECISION, 0, manager.address);
    await cc.openVoting("topic 1");

    const instance = cc.connect(res);

    await expect(instance.vote("topic 1", Options.YES)).to.be.revertedWith("Only the manager or the residents can do this");
  });

  it("Should NOT vote (empty)", async function () {
    const { cc, manager, res, accounts } = await loadFixture(deployFixture);

    await addResidents(cc, 1, [res]);
    await cc.addTopic("topic 1", "description 1", Category.DECISION, 0, manager.address);
    await cc.openVoting("topic 1");

    const instance = cc.connect(res);

    await expect(instance.vote("topic 1", Options.EMPTY)).to.be.revertedWith("The option cannot be EMPTY");
  });

  it("Should close voting", async function () {
    const { cc, manager, res, accounts } = await loadFixture(deployFixture);

    await addResidents(cc, 6, accounts);
    await cc.addTopic("topic 1", "description 1", Category.DECISION, 0, manager.address);
    await cc.openVoting("topic 1");

    await addVotes(cc, 5, accounts, false);

    // vota abstenção to increment test lines
    const instance = cc.connect(accounts[5]);
    await instance.vote("topic 1", Options.ABSTENTION);

    await cc.closeVoting("topic 1");
    const topic = await cc.getTopic("topic 1");
    expect(topic.status).to.equal(Status.DENIED);
    expect(await cc.numberOfVotes("topic 1")).to.equal(6);
  });

  it("Should NOT close voting (minimum votes)", async function () {
    const { cc, manager, res, accounts } = await loadFixture(deployFixture);

    await addResidents(cc, 5, accounts);
    await cc.addTopic("topic 1", "description 1", Category.DECISION, 0, manager.address);
    await cc.openVoting("topic 1");

    await expect(cc.closeVoting("topic 1")).to.be.revertedWith("You cannot finish a voting without the minimum votes");
  });

  it("Should NOT close voting (permission)", async function () {
    const { cc, manager, res, accounts } = await loadFixture(deployFixture);

    await cc.addResident(res.address, 2102);
    await cc.addTopic("topic 1", "description 1", Category.DECISION, 0, manager.address);
    await cc.openVoting("topic 1");

    const instance = cc.connect(res);
    await expect(instance.closeVoting("topic 1")).to.be.revertedWith("Only the manager can do this");
  });

  it("Should NOT close voting (exists)", async function () {
    const { cc, manager, res, accounts } = await loadFixture(deployFixture);
    await expect(cc.closeVoting("topic 1")).to.be.revertedWith("The topic does not exists");
  });

  it("Should NOT close voting (status)", async function () {
    const { cc, manager, res, accounts } = await loadFixture(deployFixture);

    await cc.addTopic("topic 1", "description 1", Category.DECISION, 0, manager.address);
    await expect(cc.closeVoting("topic 1")).to.be.revertedWith("Only VOTING topics can be closed");
  });

  it("Should NOT open voting (permission)", async function () {
    const { cc, manager, res, accounts } = await loadFixture(deployFixture);

    await cc.addResident(res.address, 2102);
    await cc.addTopic("topic 1", "description 1", Category.DECISION, 0, manager.address);

    const instance = cc.connect(res);
    await expect(instance.openVoting("topic 1")).to.be.revertedWith("Only the manager can do this");
  });

  it("Should NOT open voting (status)", async function () {
    const { cc, manager, res, accounts } = await loadFixture(deployFixture);
    await cc.addTopic("topic 1", "description 1", Category.DECISION, 0, manager.address);
    await cc.openVoting("topic 1");
    await expect(cc.openVoting("topic 1")).to.be.revertedWith("Only IDLE topics can be opened for voting");
  });

  it("Should NOT open voting (not exists)", async function () {
    const { cc, manager, res, accounts } = await loadFixture(deployFixture);
    await expect(cc.openVoting("topic 1")).to.be.revertedWith("The topic does not exists");
  });

  it("Should NOT pay quota (residence does not exists)", async function () {
    const { cc, manager, res, accounts } = await loadFixture(deployFixture);
    await expect(cc.payQuota(1, {value: ethers.utils.parseEther("0.01")}))
              .to.be.revertedWith("The residence does not exists");
  });

  it("Should NOT pay quota (wrong value)", async function () {
    const { cc, manager, res, accounts } = await loadFixture(deployFixture);
    await expect(cc.payQuota(1102, {value: ethers.utils.parseEther("0.001")}))
              .to.be.revertedWith("Wrong value");
  });

  it("Should NOT pay quota (duplicated)", async function () {
    const { cc, manager, res, accounts } = await loadFixture(deployFixture);
    await cc.payQuota(1102, {value: ethers.utils.parseEther("0.01")})
    await expect(cc.payQuota(1102, {value: ethers.utils.parseEther("0.01")}))
              .to.be.revertedWith("You cannot pay twice a month");
  });

  it("Should NOT transfer (manager)", async function () {
    const { cc, manager, res, accounts } = await loadFixture(deployFixture);
    const instance = cc.connect(res);
    await expect(instance.transfer("topic 1", 100)).to.be.revertedWith("Only the manager can do this");
  });

  it("Should NOT transfer (funds)", async function () {
    const { cc, manager, res, accounts } = await loadFixture(deployFixture);
    await expect(cc.transfer("topic 1", 100)).to.be.revertedWith("Insufficient funds");
  });

  it("Should NOT transfer (topic)", async function () {
    const { cc, manager, res, accounts } = await loadFixture(deployFixture);
    await addResidents(cc, 1, accounts);
    await expect(cc.transfer("topic 1", 100)).to.be.revertedWith("Only APPROVED SPENT topics can be used for transfers");
  });

  it("Should NOT transfer (amount)", async function () {
    const { cc, manager, res, accounts } = await loadFixture(deployFixture);

    await addResidents(cc, 10, accounts);
    await cc.addTopic("topic 1","description 1", Category.SPENT, 100, res.address);
    await cc.openVoting("topic 1");
    await addVotes(cc, 10, accounts);
    await cc.closeVoting("topic 1");

    await expect(cc.transfer("topic 1", 101)).to.be.revertedWith("The amount must be less or equal the APPROVED topic");
  });

  it("Should pay quota", async function () {
    const { cc, manager, res, accounts } = await loadFixture(deployFixture);

    await cc.addResident(res.address, 2101);

    const instance = cc.connect(res);
    await instance.payQuota(2101, {value: ethers.utils.parseEther("0.01")});
    const resident = await cc.getResident(res.address);
    
    // Pagar de novo, 31 dias após
    // timestamp JS: em milissegundos / timestamp ETH: segundos (por isso dividir por 1000)
    await time.setNextBlockTimestamp(parseInt(`${(Date.now() / 1000) + (31 * 24 * 60 * 60)}`));
    await instance.payQuota(2101, {value: ethers.utils.parseEther("0.01")});
    const residentAfter = await cc.getResident(res.address);

    expect(residentAfter.nextPayment).to.equal(resident.nextPayment.add(30 * 24 * 60 * 60));    
  });

});
