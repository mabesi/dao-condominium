import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "solidity-coverage";

import dotenv from 'dotenv';
dotenv.config();

import "@nomiclabs/hardhat-etherscan";

const config: HardhatUserConfig = {
  solidity: "0.8.17",
  networks: {
    bsctest: {
      url: process.env.BSC_NODE_URL,
      chainId: parseInt(`${process.env.BSC_CHAIN_ID}`),
      accounts: {
        mnemonic: process.env.BSC_SECRET
      },
      gasPrice: 35000000000
    }
  },
  etherscan: {
    apiKey: process.env.BSC_API_KEY
  }
};

export default config;
