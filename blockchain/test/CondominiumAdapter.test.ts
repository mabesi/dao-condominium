import { time, loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect } from "chai";
import { ethers } from "hardhat";

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

  it("Should remove resident", async function () {
    const { ca, manager, res, accounts } = await loadFixture(deployAdapterFixture);
    const { cc } = await loadFixture(deployImplementationFixture);

    await ca.upgrade(cc.address);
    
    await ca.addResident(res.address, 1301);
    expect(await cc.isResident(res.address)).to.equal(true);

    await ca.removeResident(res.address);
    expect(await cc.isResident(res.address)).to.equal(false);
  });

  it("Should set counselor", async function () {
    const { ca, manager, res, accounts } = await loadFixture(deployAdapterFixture);
    const { cc } = await loadFixture(deployImplementationFixture);

    await ca.upgrade(cc.address);
    await ca.addResident(res.address, 1301);
    await ca.setCounselor(res.address, true);

    expect(await cc.counselors(res.address)).to.equal(true);
  });

  it("Should add topic", async function () {
    const { ca, manager, res, accounts } = await loadFixture(deployAdapterFixture);
    const { cc } = await loadFixture(deployImplementationFixture);

    await ca.upgrade(cc.address);
    await ca.addTopic("topic 1","description 1");

    expect(await cc.topicExists("topic 1")).to.equal(true);
  });

  it("Should remove topic", async function () {
    const { ca, manager, res, accounts } = await loadFixture(deployAdapterFixture);
    const { cc } = await loadFixture(deployImplementationFixture);

    await ca.upgrade(cc.address);

    await ca.addTopic("topic 1","description 1");
    expect(await cc.topicExists("topic 1")).to.equal(true);

    await ca.removeTopic("topic 1");
    expect(await cc.topicExists("topic 1")).to.equal(false);
  });

  it("Should open voting", async function () {
    const { ca, manager, res, accounts } = await loadFixture(deployAdapterFixture);
    const { cc } = await loadFixture(deployImplementationFixture);

    await ca.upgrade(cc.address);
    
    await ca.addTopic("topic 1","description 1");
    await ca.openVoting("topic 1");
    const topic = await cc.getTopic("topic 1");

    expect(topic.status).to.equal(Status.VOTING);
  });

  it("Should vote", async function () {
    const { ca, manager, res, accounts } = await loadFixture(deployAdapterFixture);
    const { cc } = await loadFixture(deployImplementationFixture);

    await ca.upgrade(cc.address);

    await ca.addResident(res.address, 1301);
    await ca.addTopic("topic 1","description 1");
    await ca.openVoting("topic 1");

    const instance = ca.connect(res);
    await instance.vote("topic 1", Options.YES);

    expect(await cc.numberOfVotes("topic 1")).to.equal(1);
  });

  it("Should close voting", async function () {
    const { ca, manager, res, accounts } = await loadFixture(deployAdapterFixture);
    const { cc } = await loadFixture(deployImplementationFixture);

    await ca.upgrade(cc.address);

    await ca.addResident(res.address, 1301);
    await ca.addTopic("topic 1","description 1");
    await ca.openVoting("topic 1");

    const instance = ca.connect(res);
    await instance.vote("topic 1", Options.YES);

    await ca.closeVoting("topic 1");

    const topic = await cc.getTopic("topic 1");

    expect(topic.status).to.equal(Status.APPROVED);
  });

});

