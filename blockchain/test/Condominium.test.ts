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
    DENIED = 3
  }

  enum Category {
    DECISION = 0,       //0
    SPENT = 1,          //1
    CHANGE_QUOTA = 2,   //2
    CHANGE_MANAGER = 3  //3
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

  it("Should remove resident", async function () {
    const { cc, manager, res, accounts } = await loadFixture(deployFixture);
    await cc.addResident(res.address, 2102);
    expect(await cc.isResident(res.address)).to.equal(true);
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

  it("Should set conselor (true)", async function () {
    const { cc, manager, res, accounts } = await loadFixture(deployFixture);
    await cc.addResident(res.address, 2102);
    await cc.setCounselor(res.address,true);

    const instance = cc.connect(res);
    await instance.addResident(accounts[2].address,1302);

    expect(await cc.counselors(res.address)).to.equal(true);
    expect(await cc.isResident(accounts[2].address)).to.equal(true);
  });

  it("Should set conselor (false)", async function () {
    const { cc, manager, res, accounts } = await loadFixture(deployFixture);
    await cc.addResident(res.address, 2102);

    await cc.setCounselor(res.address,true);
    expect(await cc.counselors(res.address)).to.equal(true);

    await cc.setCounselor(res.address,false);
    expect(await cc.counselors(res.address)).to.equal(false);
  });

  it("Should NOT set conselor (permission)", async function () {
    const { cc, manager, res, accounts } = await loadFixture(deployFixture);
    await cc.addResident(res.address, 2102);
    const instance = cc.connect(res);
    await expect(instance.setCounselor(res.address,true)).to.be.revertedWith("Only the manager can do this");
  });

  it("Should NOT set conselor (address)", async function () {
    const { cc, manager, res, accounts } = await loadFixture(deployFixture);
    await expect(cc.setCounselor("0x0000000000000000000000000000000000000000", true)).to.be.revertedWith("Invalid address");
  });

  it("Should NOT set conselor (not resident)", async function () {
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

  it("Should remove topic", async function () {
    const { cc, manager, res, accounts } = await loadFixture(deployFixture);
    await cc.addTopic("Topic 01", "Description topic 01.", Category.DECISION, 0, manager.address);
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

});

