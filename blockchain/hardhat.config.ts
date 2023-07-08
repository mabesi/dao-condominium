import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "solidity-coverage";

import dotenv from 'dotenv';
dotenv.config();

import "@nomiclabs/hardhat-etherscan";

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.17",
    settings: {
      optimizer: {
        enabled: true,
        runs: 1000
      }
    }
  },
  networks: {
    bsctest: {
      url: process.env.NODE_URL,
      chainId: parseInt(`${process.env.CHAIN_ID}`),
      accounts: {
        mnemonic: process.env.BSC_SECRET
      }
    }
  },
  etherscan: {
    apiKey: process.env.BSC_API_KEY
  }
};

export default config;
