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
    DENIED = 3
  }

  enum Category {
    DECISION = 0,       //0
    SPENT = 1,          //1
    CHANGE_QUOTA = 2,   //2
    CHANGE_MANAGER = 3  //3
  }

  async function addResidents(adapter: CondominiumAdapter, count: number, accounts: SignerWithAddress[]) {
    for (let i = 1; i <= count; i++) {
      const residenceId = (1000 * Math.ceil(i / 25)) + (100 * Math.ceil(i / 5)) + (i - (5 * Math.floor((i - 1) / 5)));
      await adapter.addResident(accounts[i - 1].address, residenceId); // 1 101

      const instance = adapter.connect(accounts[i-1]);
      await instance.payQuota(residenceId, {value: ethers.utils.parseEther("0.01")});
    }
  }
  
  async function addVotes(adapter: CondominiumAdapter, count: number, accounts: SignerWithAddress[]) {
    for (let i = 1; i <= count; i++) {
      const instance = adapter.connect(accounts[i -1]);
      await instance.vote("topic 1", Options.YES);
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

    expect(await cc.counselors(res.address)).to.equal(true);
  });

  it("Should NOT set counselor (upgrade)", async function () {
    const { ca, manager, res, accounts } = await loadFixture(deployAdapterFixture);
    await expect(ca.setCounselor(res.address, true)).to.be.revertedWith("You must upgrade first");
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

  it("Should vote", async function () {
    const { ca, manager, res, accounts } = await loadFixture(deployAdapterFixture);
    const { cc } = await loadFixture(deployImplementationFixture);

    await ca.upgrade(cc.address);

    await addResidents(ca, 1, [res]);
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

  it("Should close voting", async function () {
    const { ca, manager, res, accounts } = await loadFixture(deployAdapterFixture);
    const { cc } = await loadFixture(deployImplementationFixture);

    await ca.upgrade(cc.address);

    await addResidents(ca, 5, accounts);

    await ca.addTopic("topic 1","description 1", Category.DECISION, 0, manager.address);
    await ca.openVoting("topic 1");

    await addVotes(ca, 5, accounts);

    await ca.closeVoting("topic 1");

    const topic = await cc.getTopic("topic 1");

    expect(topic.status).to.equal(Status.APPROVED);
  });

  it("Should NOT close voting (upgrade)", async function () {
    const { ca, manager, res, accounts } = await loadFixture(deployAdapterFixture);
    await expect(ca.closeVoting("topic 1")).to.be.revertedWith("You must upgrade first");
  });

});
