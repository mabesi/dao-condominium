import { ethers } from "hardhat";

// Contratos gerados:
// 1: 0xa018Fc9DecA4A08661Cb214f666538ED988fdfB3

async function main() {

  const CondominiumLib = await ethers.getContractFactory("CondominiumLib");
  const ccLib = await CondominiumLib.deploy();
  await ccLib.deployed();
  console.log(`Condominium Lib deployed to: ${ccLib.address}`);

  const Condominium = await ethers.getContractFactory("Condominium");
  const cc = await Condominium.deploy();
  await cc.deployed();
  console.log(`Condominium deployed to: ${cc.address}`);

  const CondominiumAdapter = await ethers.getContractFactory("CondominiumAdapter");
  const ca = await CondominiumAdapter.deploy();
  await ca.deployed();
  console.log(`Condominium Adapter deployed to: ${ca.address}`);
  
  await ca.upgrade(cc.address);
  console.log(`Condominium Adapter upgraded to contract: ${cc.address}`);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
