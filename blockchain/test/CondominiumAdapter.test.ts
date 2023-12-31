import { time, loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { ethers } from "hardhat";
import { CondominiumAdapter } from "../typechain-types";

describe("CondominiumAdapter", function () {

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
    DELETED = 4,
    SPENT = 5
  }

  enum Category {
    DECISION = 0,       //0
    SPENT = 1,          //1
    CHANGE_QUOTA = 2,   //2
    CHANGE_MANAGER = 3  //3
  }

  async function addResidents(adapter: CondominiumAdapter, count: number, accounts: SignerWithAddress[]) {
    // Skip adicionado para cobrir os testes quando o manager não é resident
    const skip = count < 20 ? 0 : 1;

    for (let i = 1; i <= count; i++) {
      const residenceId = (1000 * Math.ceil(i / 25)) + (100 * Math.ceil(i / 5)) + (i - (5 * Math.floor((i - 1) / 5)));
      await adapter.addResident(accounts[i - skip].address, residenceId); // 1 101

      const instance = adapter.connect(accounts[i - skip]);
      await instance.payQuota(residenceId, {value: ethers.utils.parseEther("0.01")});
    }
  }
  
  async function addVotes(adapter: CondominiumAdapter, count: number, accounts: SignerWithAddress[], deny: boolean = false) {
    // Skip adicionado para cobrir os testes quando o manager não é resident
    const skip = count < 20 ? 0 : 1;
    
    for (let i = 1; i <= count; i++) {
      const instance = adapter.connect(accounts[i - skip]);
      await instance.vote("topic 1", deny ? Options.NO : Options.YES);
    }
  }

  async function deployAdapterFixture() {

    // Contracts are deployed using the first signer/account by default
    const accounts = await ethers.getSigners();
    const manager = accounts[0];
    const res = accounts[1];

    const CondominiumAdapter = await ethers.getContractFactory("CondominiumAdapter");
    const ca = await CondominiumAdapter.deploy();

    return { ca, manager, res, accounts };
  }

  async function deployImplementationFixture() {

    const Condominium = await ethers.getContractFactory("Condominium");
    const cc = await Condominium.deploy();

    return { cc };
  }

  it("Should upgrade", async function () {
    const { ca, manager, res, accounts } = await loadFixture(deployAdapterFixture);
    const { cc } = await loadFixture(deployImplementationFixture);

    await ca.upgrade(cc.address);
    const address = await ca.getAddress();

    expect(address).to.equal(cc.address);
  });

  it("Should NOT upgrade (permission)", async function () {
    const { ca, manager, res, accounts } = await loadFixture(deployAdapterFixture);
    const { cc } = await loadFixture(deployImplementationFixture);

    const instance = ca.connect(res);

    await expect(instance.upgrade(cc.address)).to.be.revertedWith("You do not have permission");
  });

  it("Should NOT upgrade (address)", async function () {
    const { ca, manager, res, accounts } = await loadFixture(deployAdapterFixture);
    await expect(ca.upgrade("0x0000000000000000000000000000000000000000")).to.be.revertedWith("Invalid address");
  });

  it("Should get manager", async function () {
      const { ca, manager, res } = await loadFixture(deployAdapterFixture);
      const { cc } = await loadFixture(deployImplementationFixture);
      
      await ca.upgrade(cc.address);
    
      const managerAddress = await ca.getManager();
      expect(managerAddress).to.equal(manager.address);
  });

  it("Should NOT get manager (upgrade)", async function () {
    const { ca, manager, res, accounts } = await loadFixture(deployAdapterFixture);
    await expect(ca.getManager()).to.be.revertedWith("You must upgrade first");
  });

  it("Should get quota", async function () {
      const { ca, manager, res } = await loadFixture(deployAdapterFixture);
      const { cc } = await loadFixture(deployImplementationFixture);
      
      await ca.upgrade(cc.address);
    
      const quota = await ca.getQuota();
      expect(quota).to.equal(ethers.utils.parseEther("0.01"));
  });

  it("Should NOT get quota (upgrade)", async function () {
    const { ca, manager, res, accounts } = await loadFixture(deployAdapterFixture);
    await expect(ca.getQuota()).to.be.revertedWith("You must upgrade first");
  });

  it("Should get residents", async function () {
      const { ca, manager, res } = await loadFixture(deployAdapterFixture);
      const { cc } = await loadFixture(deployImplementationFixture);
      
      await ca.upgrade(cc.address);
      await ca.addResident(res.address, 1301);
    
      const result = await ca.getResidents(1, 10);
      expect(result.residents[0].wallet).to.equal(res.address);
  });

  it("Should NOT get residents (upgrade)", async function () {
    const { ca, manager, res, accounts } = await loadFixture(deployAdapterFixture);
    await expect(ca.getResidents(1, 10)).to.be.revertedWith("You must upgrade first");
  });

  it("Should NOT get resident (upgrade)", async function () {
    const { ca, manager, res, accounts } = await loadFixture(deployAdapterFixture);
    await expect(ca.getResident(res.address)).to.be.revertedWith("You must upgrade first");
  });
  
  it("Should add resident", async function () {
    const { ca, manager, res, accounts } = await loadFixture(deployAdapterFixture);
    const { cc } = await loadFixture(deployImplementationFixture);

    await ca.upgrade(cc.address);
    await ca.addResident(res.address, 1301);

    expect(await cc.isResident(res.address)).to.equal(true);
  });

  it("Should NOT add resident (upgrade)", async function () {
    const { ca, manager, res, accounts } = await loadFixture(deployAdapterFixture);
    await expect(ca.addResident(res.address, 1301)).to.be.revertedWith("You must upgrade first");
  });

  it("Should remove resident", async function () {
    const { ca, manager, res, accounts } = await loadFixture(deployAdapterFixture);
    const { cc } = await loadFixture(deployImplementationFixture);

    await ca.upgrade(cc.address);
    
    await ca.addResident(res.address, 1301);
    expect(await cc.isResident(res.address)).to.equal(true);

    await ca.removeResident(res.address);
    expect(await cc.isResident(res.address)).to.equal(false);
  });

  it("Should NOT remove resident (upgrade)", async function () {
    const { ca, manager, res, accounts } = await loadFixture(deployAdapterFixture);
    await expect(ca.removeResident(res.address)).to.be.revertedWith("You must upgrade first");
  });

  it("Should set counselor", async function () {
    const { ca, manager, res, accounts } = await loadFixture(deployAdapterFixture);
    const { cc } = await loadFixture(deployImplementationFixture);

    await ca.upgrade(cc.address);
    await ca.addResident(res.address, 1301);
    await ca.setCounselor(res.address, true);

    const resident = await ca.getResident(res.address);

    expect(resident.isCounselor).to.equal(true);
  });

  it("Should NOT set counselor (upgrade)", async function () {
    const { ca, manager, res, accounts } = await loadFixture(deployAdapterFixture);
    await expect(ca.setCounselor(res.address, true)).to.be.revertedWith("You must upgrade first");
  });

  it("Should get topic", async function () {
    const { ca, manager, res } = await loadFixture(deployAdapterFixture);
    const { cc } = await loadFixture(deployImplementationFixture);
    
    await ca.upgrade(cc.address);
    await ca.addTopic("topic 1","description 1", Category.DECISION, 0, manager.address);
  
    const topic = await ca.getTopic("topic 1");
    expect(topic.title).to.equal("topic 1");
  });

  it("Should NOT get topic (upgrade)", async function () {
    const { ca, manager, res, accounts } = await loadFixture(deployAdapterFixture);
    await expect(ca.getTopic("topic 1")).to.be.revertedWith("You must upgrade first");
  });  

  it("Should get topics", async function () {
    const { ca, manager, res } = await loadFixture(deployAdapterFixture);
    const { cc } = await loadFixture(deployImplementationFixture);
    
    await ca.upgrade(cc.address);
    await ca.addTopic("topic 1","description 1", Category.DECISION, 0, manager.address);
  
    const result = await ca.getTopics(1, 10);
    expect(result.topics[0].title).to.equal("topic 1");
  });

  it("Should get topics (empty)", async function () {
    const { ca, manager, res } = await loadFixture(deployAdapterFixture);
    const { cc } = await loadFixture(deployImplementationFixture);
    
    await ca.upgrade(cc.address);
  
    const result = await ca.getTopics(1, 10);
    // Retorna 10 elementos vazios
    expect(result.topics.length).to.equal(10);
  });

  it("Should NOT get topics (upgrade)", async function () {
    const { ca, manager, res } = await loadFixture(deployAdapterFixture);
    await expect(ca.getTopics(1, 10)).to.be.revertedWith("You must upgrade first");
  });

  it("Should add topic", async function () {
    const { ca, manager, res, accounts } = await loadFixture(deployAdapterFixture);
    const { cc } = await loadFixture(deployImplementationFixture);

    await ca.upgrade(cc.address);
    await ca.addTopic("topic 1","description 1", Category.DECISION, 0, manager.address);

    expect(await cc.topicExists("topic 1")).to.equal(true);
  });

  it("Should NOT add topic (upgrade)", async function () {
    const { ca, manager, res, accounts } = await loadFixture(deployAdapterFixture);
    await expect(ca.addTopic("topic 1","description 1", Category.DECISION, 0, manager.address))
              .to.be.revertedWith("You must upgrade first");
  });

  it("Should edit topic", async function () {
    const { ca, manager, res, accounts } = await loadFixture(deployAdapterFixture);
    const { cc } = await loadFixture(deployImplementationFixture);

    await ca.upgrade(cc.address);
    await ca.addTopic("topic 1","description 1", Category.SPENT, 1, manager.address);
    await ca.editTopic("topic 1","new description", 2, manager.address);

    const topic = await cc.getTopic("topic 1");

    expect(topic.description).to.equal("new description");
  });

  it("Should NOT edit topic (upgrade)", async function () {
    const { ca, manager, res, accounts } = await loadFixture(deployAdapterFixture);
    await expect(ca.editTopic("topic 1","new description", 2, manager.address))
              .to.be.revertedWith("You must upgrade first");
  });

  it("Should remove topic", async function () {
    const { ca, manager, res, accounts } = await loadFixture(deployAdapterFixture);
    const { cc } = await loadFixture(deployImplementationFixture);

    await ca.upgrade(cc.address);

    await ca.addTopic("topic 1","description 1", Category.DECISION, 0, manager.address);
    expect(await cc.topicExists("topic 1")).to.equal(true);

    await ca.removeTopic("topic 1");
    expect(await cc.topicExists("topic 1")).to.equal(false);
  });

  it("Should NOT remove topic (upgrade)", async function () {
    const { ca, manager, res, accounts } = await loadFixture(deployAdapterFixture);
    await expect(ca.removeTopic("topic 1")).to.be.revertedWith("You must upgrade first");
  });

  it("Should open voting", async function () {
    const { ca, manager, res, accounts } = await loadFixture(deployAdapterFixture);
    const { cc } = await loadFixture(deployImplementationFixture);

    await ca.upgrade(cc.address);
    
    await ca.addTopic("topic 1","description 1", Category.DECISION, 0, manager.address);
    await ca.openVoting("topic 1");
    const topic = await cc.getTopic("topic 1");

    expect(topic.status).to.equal(Status.VOTING);
  });

  it("Should NOT open voting (upgrade)", async function () {
    const { ca, manager, res, accounts } = await loadFixture(deployAdapterFixture);
    await expect(ca.openVoting("topic 1")).to.be.revertedWith("You must upgrade first");
  });

  it("Should get votes", async function () {
    const { ca, manager, res, accounts } = await loadFixture(deployAdapterFixture);
    const { cc } = await loadFixture(deployImplementationFixture);
    
    await ca.upgrade(cc.address);
    await addResidents(ca, 1, accounts);
    await ca.addTopic("topic 1","description 1", Category.DECISION, 0, manager.address);
    await ca.openVoting("topic 1");
    const instance = ca.connect(res);
    await instance.vote("topic 1", Options.YES);
    const votes = await ca.getVotes("topic 1");

    expect(votes.length).to.equal(await cc.numberOfVotes("topic 1"));
  });

  it("Should NOT get votes (upgrade)", async function () {
    const { ca, manager, res, accounts } = await loadFixture(deployAdapterFixture);
    await expect(ca.getVotes("topic 1")).to.be.revertedWith("You must upgrade first");
  });  

  it("Should vote", async function () {
    const { ca, manager, res, accounts } = await loadFixture(deployAdapterFixture);
    const { cc } = await loadFixture(deployImplementationFixture);

    await ca.upgrade(cc.address);

    await addResidents(ca, 1, accounts);
    await ca.addTopic("topic 1","description 1", Category.DECISION, 0, manager.address);
    await ca.openVoting("topic 1");

    const instance = ca.connect(res);
    await instance.vote("topic 1", Options.YES);

    expect(await cc.numberOfVotes("topic 1")).to.equal(1);
  });

  it("Should NOT vote (upgrade)", async function () {
    const { ca, manager, res, accounts } = await loadFixture(deployAdapterFixture);
    await expect(ca.vote("topic 1", Options.YES)).to.be.revertedWith("You must upgrade first");
  });

  it("Should close voting (decision approved)", async function () {
    const { ca, manager, res, accounts } = await loadFixture(deployAdapterFixture);
    const { cc } = await loadFixture(deployImplementationFixture);

    await ca.upgrade(cc.address);

    await addResidents(ca, 5, accounts);

    await ca.addTopic("topic 1","description 1", Category.DECISION, 0, manager.address);
    await ca.openVoting("topic 1");

    await addVotes(ca, 5, accounts);

    await expect(ca.closeVoting("topic 1")).to.emit(ca, "TopicChanged");

    const topic = await cc.getTopic("topic 1");
    expect(topic.status).to.equal(Status.APPROVED);
  });

  it("Should close voting (decision denied)", async function () {
    const { ca, manager, res, accounts } = await loadFixture(deployAdapterFixture);
    const { cc } = await loadFixture(deployImplementationFixture);

    await ca.upgrade(cc.address);

    await addResidents(ca, 5, accounts);

    await ca.addTopic("topic 1","description 1", Category.DECISION, 0, manager.address);
    await ca.openVoting("topic 1");

    await addVotes(ca, 5, accounts, true);

    await expect(ca.closeVoting("topic 1")).to.emit(ca, "TopicChanged");

    const topic = await cc.getTopic("topic 1");
    expect(topic.status).to.equal(Status.DENIED);
  });

 it("Should close voting (change manager, resident)", async function () {
    const { ca, manager, res, accounts } = await loadFixture(deployAdapterFixture);
    const { cc } = await loadFixture(deployImplementationFixture);

    await ca.upgrade(cc.address);

    await addResidents(ca, 15, accounts);

    await ca.addTopic("topic 1","description 1", Category.CHANGE_MANAGER, 0, res.address);
    await ca.openVoting("topic 1");

    await addVotes(ca, 15, accounts);

    await expect(ca.closeVoting("topic 1")).to.emit(ca,"ManagerChanged").withArgs(res.address);
    //expect(await cc.getManager()).to.equal(res.address);
  });

 it("Should close voting (change manager, not resident)", async function () {
    const { ca, manager, res, accounts } = await loadFixture(deployAdapterFixture);
    const { cc } = await loadFixture(deployImplementationFixture);

    await ca.upgrade(cc.address);

    await addResidents(ca, 15, accounts);

    // Manager será um endereço qualquer, não resident
    const externalManager = "0xE13781Ea049B04a67f7710Fe7A94578CfD58327E";
    await ca.addTopic("topic 1","description 1", Category.CHANGE_MANAGER, 0, externalManager);
    await ca.openVoting("topic 1");

    await addVotes(ca, 15, accounts);

    await expect(ca.closeVoting("topic 1")).to.emit(ca,"ManagerChanged").withArgs(externalManager);
    //expect(await cc.getManager()).to.equal(res.address);
  });

 it("Should close voting (change quota)", async function () {
    const { ca, manager, res, accounts } = await loadFixture(deployAdapterFixture);
    const { cc } = await loadFixture(deployImplementationFixture);

    await ca.upgrade(cc.address);

    await addResidents(ca, 20, accounts);

    await ca.addTopic("topic 1","description 1", Category.CHANGE_QUOTA, 100, manager.address);
    await ca.openVoting("topic 1");

    await addVotes(ca, 20, accounts);

    await expect(ca.closeVoting("topic 1")).to.emit(ca,"QuotaChanged").withArgs(100);
    //expect(await cc.getManager()).to.equal(res.address);
  });

  it("Should NOT close voting (upgrade)", async function () {
    const { ca, manager, res, accounts } = await loadFixture(deployAdapterFixture);
    await expect(ca.closeVoting("topic 1")).to.be.revertedWith("You must upgrade first");
  });

  it("Should NOT pay quota (upgrade)", async function () {
    const { ca, manager, res, accounts } = await loadFixture(deployAdapterFixture);
    await expect(ca.payQuota(1102, {value: ethers.utils.parseEther("0.01")})).to.be.revertedWith("You must upgrade first");
  });

  it("Should transfer", async function () {
    const { ca, manager, res, accounts } = await loadFixture(deployAdapterFixture);
    const { cc } = await loadFixture(deployImplementationFixture);

    await ca.upgrade(cc.address);
    await addResidents(ca, 10, accounts);
    await ca.addTopic("topic 1","description 1", Category.SPENT, 100, res.address);
    await ca.openVoting("topic 1");
    await addVotes(ca, 10, accounts);
    await ca.closeVoting("topic 1");

    const balanceBefore = await ca.provider.getBalance(cc.address);
    const balanceWorkerBefore = await ca.provider.getBalance(res.address);

    await ca.transfer("topic 1", 100);

    const balanceAfter = await ca.provider.getBalance(cc.address);
    const balanceWorkerAfter = await ca.provider.getBalance(res.address);
    
    const topic = await cc.getTopic("topic 1");

    expect(balanceAfter).to.equal(balanceBefore.sub(100));
    expect(balanceWorkerAfter).to.equal(balanceWorkerBefore.add(100));
    expect(topic.status).to.equal(Status.SPENT);
  });

  it("Should NOT transfer (upgrade)", async function () {
    const { ca, manager, res, accounts } = await loadFixture(deployAdapterFixture);
    await expect(ca.transfer("topic 1", 100)).to.be.revertedWith("You must upgrade first");
  });

});
