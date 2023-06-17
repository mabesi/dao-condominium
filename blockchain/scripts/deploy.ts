import { ethers } from "hardhat";

// Contratos gerados:
// 1: 0xa018Fc9DecA4A08661Cb214f666538ED988fdfB3

async function main() {

  const Condominium = await ethers.getContractFactory("Condominium");
  const cc = await Condominium.deploy();

  await cc.deployed();
  console.log(`Contract deployed to: ${cc.address}`);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
