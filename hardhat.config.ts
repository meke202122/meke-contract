import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "@nomiclabs/hardhat-ethers";
import "@nomiclabs/hardhat-etherscan";
import "hardhat-contract-sizer";
import "hardhat-deploy";
import "hardhat-deploy-ethers";
import { compileSetting } from "./scripts/deployTool";
import { RPCS } from "./scripts/network";

const config: HardhatUserConfig = {
  networks: RPCS,
  defaultNetwork: "hardhat",
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY,
  },
  verify: {
    etherscan: {
      apiKey: process.env.ETHERSCAN_API_KEY,
    },
  },

  contractSizer: {
    alphaSort: true,
    runOnCompile: true,
    disambiguatePaths: false,
  },
  solidity: {
    compilers: [compileSetting("0.7.6", 200)],
    overrides: {
      "contracts/proxy/Proxy1.sol": compileSetting("0.5.3", 200),
      "contracts/test/ETHStore.sol": compileSetting("0.7.0", 200),
      "contracts/test/Attack.sol": compileSetting("0.7.0", 200),
      "contracts/proxy/OlympusTreasury.sol": compileSetting("0.7.5", 200),
      "contracts/mock/PizzaTower.sol": compileSetting("0.8.16", 200),
      "contracts/test/Test.sol": compileSetting("0.8.5", 200),
      "contracts/test/EverMoon.sol": compileSetting("0.8.4", 200),
    },
  },

  namedAccounts: {
    deployer: {
      default: 0,
    },
    dev: {
      default: 0,
    },
  },
};

export default config;
