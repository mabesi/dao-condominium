import { time, loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect } from "chai";
import { ethers } from "hardhat";

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

  async function deployFixture() {

    // Contracts are deployed using the first signer/account by default
    const [manager, resident] = await ethers.getSigners();

    const Condominium = await ethers.getContractFactory("Condominium");
    const cc = await Condominium.deploy();

    return { cc, manager, resident };
  }

  it("Should be residence", async function () {
    const { cc, manager, resident } = await loadFixture(deployFixture);
    expect(await cc.residenceExists(2102)).to.equal(true);
  });

  it("Should add resident", async function () {
    const { cc, manager, resident } = await loadFixture(deployFixture);
    await cc.addResident(resident.address, 2102);
    expect(await cc.isResident(resident.address)).to.equal(true);
  });

  it("Should NOT add resident (not council or manager)", async function () {
    const { cc, manager, resident } = await loadFixture(deployFixture);
    const instance = cc.connect(resident);
    await expect(instance.addResident(resident.address, 2102)).to.be.revertedWith("Only the manager or the council can do this");
  });

  it("Should NOT add resident (residence does not exists)", async function () {
    const { cc, manager, resident } = await loadFixture(deployFixture);
    await expect(cc.addResident(resident.address, 21020)).to.be.revertedWith("This residence does not exists");
  });

  it("Should remove resident", async function () {
    const { cc, manager, resident } = await loadFixture(deployFixture);
    await cc.addResident(resident.address, 2102);
    expect(await cc.isResident(resident.address)).to.equal(true);
    await cc.removeResident(resident.address);
    expect(await cc.isResident(resident.address)).to.equal(false);
  });

  it("Should NOT remove resident (permission)", async function () {
    const { cc, manager, resident } = await loadFixture(deployFixture);
    await cc.addResident(resident.address, 2102);
    const instance = cc.connect(resident);
    await expect(instance.removeResident(resident.address)).to.be.revertedWith("Only the manager can do this");
  });

  it("Should NOT remove resident (counselor)", async function () {
    const { cc, manager, resident } = await loadFixture(deployFixture);
    await cc.addResident(resident.address, 2102);
    await cc.setCounselor(resident.address,true);
    await expect(cc.removeResident(resident.address)).to.be.revertedWith("A counselor cannot be removed");
  });

  it("Should set conselor", async function () {
    const { cc, manager, resident } = await loadFixture(deployFixture);
    await cc.addResident(resident.address, 2102);
    await cc.setCounselor(resident.address,true);
    expect(await cc.counselors(resident.address)).to.equal(true);
  });

  it("Should NOT set conselor (permission)", async function () {
    const { cc, manager, resident } = await loadFixture(deployFixture);
    await cc.addResident(resident.address, 2102);
    const instance = cc.connect(resident);
    await expect(instance.setCounselor(resident.address,true)).to.be.revertedWith("Only the manager can do this");
  });

  it("Should NOT set conselor (not resident)", async function () {
    const { cc, manager, resident } = await loadFixture(deployFixture);
    await expect(cc.setCounselor(resident.address,true)).to.be.revertedWith("The counselor must be a resident");
  });

  // it("Should set manager", async function () {
  //   const { cc, manager, resident } = await loadFixture(deployFixture);
  //   await cc.setManager(resident.address);
  //   expect(await cc.manager()).to.equal(resident.address);
  // });

  it("Should add topic", async function () {
    const { cc, manager, resident } = await loadFixture(deployFixture);
    await cc.addTopic("Topic 01", "Description topic 01.");
    expect(await cc.topicExists("Topic 01")).to.equal(true);
  });

  it("Should add topic (resident)", async function () {
    const { cc, manager, resident } = await loadFixture(deployFixture);
    await cc.addResident(resident.address, 2102);
    const instance = cc.connect(resident);
    await instance.addTopic("Topic 01", "Description topic 01.");
    expect(await cc.topicExists("Topic 01")).to.equal(true);
  });
  
  it("Should NOT add topic (permission)", async function () {
    const { cc, manager, resident } = await loadFixture(deployFixture);
    const instance = cc.connect(resident);
    await expect(instance.addTopic("Topic 01", "Description topic 01.")).to.be.revertedWith("Only the manager or the residents can do this");
  });

  it("Should NOT add topic (duplicated)", async function () {
    const { cc, manager, resident } = await loadFixture(deployFixture);
    await cc.addTopic("Topic 01", "Description topic 01.");
    await expect(cc.addTopic("Topic 01", "Description topic 01.")).to.be.revertedWith("This topic already exists");
  });  

  it("Should remove topic", async function () {
    const { cc, manager, resident } = await loadFixture(deployFixture);
    await cc.addTopic("Topic 01", "Description topic 01.");
    expect(await cc.topicExists("Topic 01")).to.equal(true);
    await cc.removeTopic("Topic 01");
    expect(await cc.topicExists("Topic 01")).to.equal(false);
  });

  it("Should NOT remove topic (permission)", async function () {
    const { cc, manager, resident } = await loadFixture(deployFixture);
    await cc.addTopic("Topic 01", "Description topic 01.");
    const instance = cc.connect(resident);
    await expect(instance.removeTopic("Topic 01")).to.be.revertedWith("Only the manager can do this");
  });

  it("Should NOT remove topic (it does not exists)", async function () {
    const { cc, manager, resident } = await loadFixture(deployFixture);
    await expect(cc.removeTopic("Topic 01")).to.be.revertedWith("The topic does not exists");
  });

  it("Should NOT remove topic (status)", async function () {
    const { cc, manager, resident } = await loadFixture(deployFixture);

    await cc.addTopic("topic 1", "description 1");

    await cc.openVoting("topic 1");

    await expect(cc.removeTopic("topic 1")).to.be.revertedWith("Only IDLE topics can be removed");
  });

  it("Should vote", async function () {
    const { cc, manager, resident } = await loadFixture(deployFixture);

    await cc.addResident(resident.address, 2102);
    await cc.addTopic("topic 1", "description 1");
    await cc.openVoting("topic 1");

    const instance = cc.connect(resident);
    await instance.vote("topic 1", Options.YES);

    expect(await instance.numberOfVotes("topic 1")).to.equal(1);
  });

  it("Should NOT vote (duplicated)", async function () {
    const { cc, manager, resident } = await loadFixture(deployFixture);

    await cc.addResident(resident.address, 2102);
    await cc.addTopic("topic 1", "description 1");
    await cc.openVoting("topic 1");

    const instance = cc.connect(resident);
    await instance.vote("topic 1", Options.YES);

    await expect(instance.vote("topic 1", Options.YES)).to.be.revertedWith("A residence should vote only once");
  });

  it("Should NOT vote (status)", async function () {
    const { cc, manager, resident } = await loadFixture(deployFixture);

    await cc.addResident(resident.address, 2102);
    await cc.addTopic("topic 1", "description 1");

    const instance = cc.connect(resident);

    await expect(instance.vote("topic 1", Options.YES)).to.be.revertedWith("Only VOTING topics can be voted");
  });

  it("Should NOT vote (exists)", async function () {
    const { cc, manager, resident } = await loadFixture(deployFixture);

    await cc.addResident(resident.address, 2102);
    const instance = cc.connect(resident);

    await expect(instance.vote("topic 1", Options.YES)).to.be.revertedWith("The topic does not exists");
  });

  it("Should NOT vote (permission)", async function () {
    const { cc, manager, resident } = await loadFixture(deployFixture);

    await cc.addTopic("topic 1", "description 1");
    await cc.openVoting("topic 1");

    const instance = cc.connect(resident);

    await expect(instance.vote("topic 1", Options.YES)).to.be.revertedWith("Only the manager or the residents can do this");
  });

  it("Should NOT vote (empty)", async function () {
    const { cc, manager, resident } = await loadFixture(deployFixture);

    await cc.addResident(resident.address, 2102);
    await cc.addTopic("topic 1", "description 1");
    await cc.openVoting("topic 1");

    const instance = cc.connect(resident);

    await expect(instance.vote("topic 1", Options.EMPTY)).to.be.revertedWith("The option cannot be EMPTY");
  });

  it("Should close voting", async function () {
    const { cc, manager, resident } = await loadFixture(deployFixture);

    await cc.addResident(resident.address, 2102);
    await cc.addTopic("topic 1", "description 1");
    await cc.openVoting("topic 1");

    await cc.vote("topic 1", Options.YES);

    const instance = cc.connect(resident);
    await instance.vote("topic 1", Options.YES);

    await cc.closeVoting("topic 1");
    const topic = await cc.getTopic("topic 1");

    expect(topic.status).to.equal(Status.APPROVED);
  });

  it("Should NOT close voting (permission)", async function () {
    const { cc, manager, resident } = await loadFixture(deployFixture);

    await cc.addResident(resident.address, 2102);
    await cc.addTopic("topic 1", "description 1");
    await cc.openVoting("topic 1");

    const instance = cc.connect(resident);
    await expect(instance.closeVoting("topic 1")).to.be.revertedWith("Only the manager can do this");
  });

  it("Should NOT close voting (exists)", async function () {
    const { cc, manager, resident } = await loadFixture(deployFixture);
    await expect(cc.closeVoting("topic 1")).to.be.revertedWith("The topic does not exists");
  });

  it("Should NOT close voting (status)", async function () {
    const { cc, manager, resident } = await loadFixture(deployFixture);

    await cc.addTopic("topic 1", "description 1");
    await expect(cc.closeVoting("topic 1")).to.be.revertedWith("Only VOTING topics can be closed");
  });

  it("Should NOT open voting (permission)", async function () {
    const { cc, manager, resident } = await loadFixture(deployFixture);

    await cc.addResident(resident.address, 2102);
    await cc.addTopic("topic 1", "description 1");

    const instance = cc.connect(resident);
    await expect(instance.openVoting("topic 1")).to.be.revertedWith("Only the manager can do this");
  });

});

