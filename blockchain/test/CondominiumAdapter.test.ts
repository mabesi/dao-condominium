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

    const CondominiumAdapter = await ethers.getContractFactory("CondominiumAdapter");
    const ca = await CondominiumAdapter.deploy();

    return { ca, manager, accounts };
  }

  async function deployImplementationFixture() {

    const Condominium = await ethers.getContractFactory("Condominium");
    const cc = await Condominium.deploy();

    return { cc };
  }

  it("Should upgrade", async function () {
    const { ca, manager, accounts } = await loadFixture(deployAdapterFixture);
    const { cc } = await loadFixture(deployImplementationFixture);

    await ca.upgrade(cc.address);
    const address = await ca.getAddress();

    expect(address).to.equal(cc.address);
  });

  it("Should NOT upgrade (permission)", async function () {
    const { ca, manager, accounts } = await loadFixture(deployAdapterFixture);
    const { cc } = await loadFixture(deployImplementationFixture);

    const instance = ca.connect(accounts[1]);

    await expect(instance.upgrade(cc.address)).to.be.revertedWith("You do not have permission");
  });
  

});

