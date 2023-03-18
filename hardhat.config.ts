import 'hardhat-typechain';
import '@nomiclabs/hardhat-ethers';
import '@nomiclabs/hardhat-waffle';
import '@nomiclabs/hardhat-etherscan';
import dotenv from 'dotenv';
import { task } from 'hardhat/config';
import "hardhat-spdx-license-identifier"
require('hardhat-contract-sizer');
import "./tasks/index.js"

const { buildOrder, getOrderHash } = require('./test/order');
const { toWad } = require('./test/constants');

import { keccak256 } from '@ethersproject/solidity';
import {
  allowVerifyChain,
  compileSetting,
  deployContract,
  getContract,
  mainTokenName,
} from './script/deployTool';
import { RPCS } from './script/network';

const defaultAccount = 0;

dotenv.config();

task("accounts", "Prints the list of accounts", async (taskArgs, bre) => {
  const accounts = await bre.ethers.getSigners();

  for (const account of accounts) {
    let address = await account.getAddress();
    console.log(
      address,
      (await bre.ethers.provider.getBalance(address)).toString()
    );
  }
});

task("markOrder", "test contract")
.setAction(async ({}, { ethers, run, network }) => {
    await run("compile");
    const signers = await ethers.getSigners();

    const signer = signers[4]

    console.log("signer:", network.name,signer);

    const takeTrader = "0xd41bF9460Ecb5202Ee7d83567D6c7e4D24A88B6c"

    const perpetualAddress = "0x2469195C7Def65747d26Bf3fF1cfC0b821C5008f"

    const makeTrader = "0xA193D809F6f2a145c374F6F477badc2dAcb38465"

    const offline = await buildOrder({
      trader: makeTrader,
      amount: 1,
      price: 6000,
      version: 2,
      side: 'buy',
      type: 'market',
      expiredAt: 1589366656,
      salt: 666,
  }, perpetualAddress, "0x0000000000000000000000000000000000000000");

  const offmaker = await buildOrder({
    trader: takeTrader,
    amount: 1,
    price: 6000,
    version: 2,
    side: 'sell',
    type: 'limit',
    expiredAt: 1589366656,
    salt: 666,
}, perpetualAddress, "0x0000000000000000000000000000000000000000");

  console.log("maker trader",offmaker.trader)

  console.log("maker data",offmaker.data)

  const singStr = "0xadacd669391d23355a9e492ed847896f61e9b806b68a186717a49b3b82758ffe665621134a4ec1625fdab9deb4bed5491288a63d55272e3bcdabe1ec514eb0821c"
  const signature = singStr.substring(2);
  const r = "0x" + signature.substring(0, 64);
        const s = "0x" + signature.substring(64, 128);
        const v = signature.substring(128, 130);
        const config = `0x${v}01` + '0'.repeat(60);

        const signaturetakeer ={
          config:config,
          r:r,
          s:s,
      }     

    const takerParam = {
      trader: takeTrader,
      broker: "0x0000000000000000000000000000000000000000",
      amount: toWad(1),
      price: toWad(6000),
      data: "0x020001005ebbcf80000000000000000000000000029a00000000000000000001",
      signature: signaturetakeer,
  };

  const makerSignStr = "0x753b534d763d527a3fe8db3bf6bf5273e0f75dc119cf64539b1758b777d9b6da39d6787cdaff380de611416bd6dc03fd9071727e06c7abdd53194dedbbbedf8c1b"

  const makersignature = makerSignStr.substring(2);

  const maker_r = "0x" + makersignature.substring(0, 64);
        const maker_s = "0x" + makersignature.substring(64, 128);
        const maker_v = makersignature.substring(128, 130);
        const maker_config = `0x${maker_v}01` + '0'.repeat(60);

        ethers.utils.FormatTypes

        const signaturemaker ={
          config:maker_config,
          r:maker_r,
          s:maker_s,
      }     

  const makerParam = {
    trader: makeTrader,
    broker: "0x0000000000000000000000000000000000000000",
    amount: toWad(1),
    price: toWad(6000),
    data: "0x020100005ebbcf80000000000000000000000000029a00000000000000000001",
    signature: signaturemaker,
};
const OrderData = {
  index:0,
  amount:0,
  takerLeverage:15,
  makerLeverage:15,
  gasFee:10
}

const Exchange = await ethers.getContractFactory("Exchange")
const exchange = Exchange.attach("0xa4730859F35B54aF535C4cc1F944DC45B933a454")

await exchange.matchOrders(takerParam,makerParam,perpetualAddress,OrderData,10);
  

});

task("deployOp", "deployTest contract")
.setAction(async ({}, { ethers, run, network }) => {
    await run("compile");
    const signers = await ethers.getSigners();

    let deployAddress = [];

    console.log("Network On:", network.name,signers[defaultAccount]);

    const weth = "0x4200000000000000000000000000000000000006"

    // ContractReader
    const FlashBot = await deployContract(
      "FlashBot",
      network.name,
      ethers.getContractFactory,
      signers[defaultAccount],
      [weth]
    );

    deployAddress.push({"Flash":FlashBot.address});  

    console.log(deployAddress);

    //   await run(
    //   "verify:verify",
    //   getContract(network.name, "Flash")
    // );
});

task("deployTest1", "deploy contract")
.setAction(async ({}, { ethers, run, network }) => {
    await run("compile");
    const signers = await ethers.getSigners();

    let deployAddress = [];

    console.log("Network On:", network.name);

    const multisender = await deployContract(
      "ETHStore",
      network.name,
      ethers.getContractFactory,
      signers[defaultAccount]
    );
    
    deployAddress.push({"ETHStore":multisender.address});  

    // await run(
    //   "verify:verify",
    //   getContract(network.name, "ETHStore")
    // );
    

    const Flash = await deployContract(
      "Attack",
      network.name,
      ethers.getContractFactory,
      signers[defaultAccount],
      [multisender.address]
    );
    
    deployAddress.push({"Attack":Flash.address});  

    // await run(
    //   "verify:verify",
    //   getContract(network.name, "Attack")
    // );


    console.log(deployAddress);
});
task("verifyTest", "verify contract")
.setAction(async ({}, { ethers, run, network }) => {
    await run("compile");
    
         await run(
      "verify:verify",
      getContract(network.name, "Flash")
    );

    //  await run(
    //   "verify:verify",
    //   getContract(network.name, "Attack")
    // );
})

task("deployBsc", "deploy contract")
.setAction(async ({}, { ethers, run, network }) => {
    await run("compile");

    const signers = await ethers.getSigners();

//     console.log("deployAddress:", signers[defaultAccount]);

    let deployAddress = [];

//     console.log("Network On:", network.name);

//     // ContractReader
//     const ContractReader = await deployContract(
//       "ContractReader",
//       network.name,
//       ethers.getContractFactory,
//       signers[defaultAccount]
//     );
    
//     deployAddress.push({"ContractReader":ContractReader.address});  

//     // GlobalConfig
//     const GlobalConfig = await deployContract(
//       "GlobalConfig",
//       network.name,
//       ethers.getContractFactory,
//       signers[defaultAccount]
//     );
    
//     deployAddress.push({"GlobalConfig":GlobalConfig.address});  

//     // exchange
//     const Exchange = await deployContract(
//       "Exchange",
//       network.name,
//       ethers.getContractFactory,
//       signers[defaultAccount],
//       [GlobalConfig.address]
//     );
    
//     deployAddress.push({"Exchange":Exchange.address});  


//    // mock collateral token
//     const testToken = await deployContract(
//       "MyTestToken",
//       network.name,
//       ethers.getContractFactory,
//       signers[defaultAccount],
//       ["USDT", "USDT",6]
//     );

//     deployAddress.push({"testToken":testToken.address});  

    
//   // 以下每添加一个交易对，就需要部署一次
//   // mock price oracle
//   // BTC / ETH	18	0x6eFd3CCf5c673bd5A7Ea91b414d0307a5bAb9cC1
//   // BTC / USD	8	0x0c9973e7a27d00e656B9f153348dA46CaD70d03d
//   // ETH / USD	8	0x5f0423B1a6935dc5596e7A24d98532b67A0AeFd8
//   // LINK / ETH	18	0x1a658fa1a5747d73D0AD674AF12851F7d74c998e
//   // LINK / USD	8	0x52C9Eb2Cc68555357221CAe1e5f2dD956bC194E5
//   // USDT / USD	8	0xb1Ac85E779d05C2901812d812210F6dE144b2df0
    // bnb.usd  8 0x2514895c72f50D8bd4B4F9b1110F0D6bD2c97526
  const chainlinkAdapter = await deployContract(
    "ChainlinkAdapter",
    network.name,
    ethers.getContractFactory,
    signers[defaultAccount],
    ["0x2514895c72f50D8bd4B4F9b1110F0D6bD2c97526",3600 * 6,false]
  );

  deployAddress.push({"chainlinkAdapter":chainlinkAdapter.address}); 


//   // Perpetual
// const Perpetual = await deployContract(
//   "Perpetual",
//   network.name,
//   ethers.getContractFactory,
//   signers[defaultAccount],
//   [GlobalConfig.address, testToken.address,"0x6801b04dFbD58da5846F07c5DdA88beC0567dDf0", 6]
// );

// deployAddress.push({"Perpetual":Perpetual.address});

// // Proxy
// const Proxy = await deployContract(
//   "Proxy",
//   network.name,
//   ethers.getContractFactory,
//   signers[defaultAccount],
//   [Perpetual.address]
// );

// deployAddress.push({"Proxy":Proxy.address});

// // Funding
// const Funding = await deployContract(
//   "Funding",
//   network.name,
//   ethers.getContractFactory,
//   signers[defaultAccount],
//   [GlobalConfig.address, Proxy.address, chainlinkAdapter.address]
// );

// deployAddress.push({"Funding":Funding.address});

// console.log(deployAddress);

// await run(
    //   "verify:verify",
    //   getContract(network.name, "GlobalConfig")
    // );

    // await run(
    //   "verify:verify",
    //   getContract(network.name, "ContractReader")
    // );

    // await run(
    //   "verify:verify",
    //   getContract(network.name, "GlobalConfig")
    // );

    // await run(
    //   "verify:verify",
    //   getContract(network.name, "Exchange")
    // );

    // await run(
    //   "verify:verify",
    //   getContract(network.name, "MyTestToken")
    // );

    // await run(
    //   "verify:verify",
    //   getContract(network.name, "ChainlinkAdapter")
    // );

    // await run(
    //   "verify:verify",
    //   getContract(network.name, "Perpetual")
    // );

    // await run(
    //   "verify:verify",
    //   getContract(network.name, "Proxy")
    // );

    // await run(
    //   "verify:verify",
    //   getContract(network.name, "Funding")
    // );

// whitelist addComponent

// console.log('whitelist exchange -> perpetual');

// const MGlobalConfig = await ethers.getContractFactory("GlobalConfig")
// const GlobalConfig = MGlobalConfig.attach("0x0fE166A3871139677029AA3E52d1f6d1d22fb324")


// const MFunding = await ethers.getContractFactory("Funding")
// const Funding = MFunding.attach("0xB56675AE47ca2b559AD6cB6C9Fef9033fbeB98a7")

// const MPerpetual = await ethers.getContractFactory("Perpetual")
// const Perpetual = MPerpetual.attach("0x5107d08e8f0DFb9593e76004C9874a606fE47702")

// const MExchange = await ethers.getContractFactory("Exchange")
// const Exchange = MExchange.attach("0x44079226Cf0438E724146bD3e4e59EE15F831455")




// await GlobalConfig.addComponent(Exchange.address,Perpetual.address);

// await GlobalConfig.addComponent(Perpetual.address,Exchange.address);

// await GlobalConfig.addComponent(Perpetual.address,Funding.address);

// await GlobalConfig.addComponent(Funding.address,Perpetual.address);

// await GlobalConfig.addComponent(Perpetual.address,"0xD115e3A943F80F89F2319D3De8e5637d90CD8D37");

// await GlobalConfig.addComponent(Funding.address,Exchange.address);

// await GlobalConfig.addBroker("0x1d5e4f466cF752dd84c1569cF97Abbe880843854");



// await Perpetual.setGovernanceAddress(ethers.utils.formatBytes32String("fundingModule"),Funding.address);
// console.log("fundingModule");

// await Perpetual.setGovernanceParameter(ethers.utils.formatBytes32String("initialMarginRate"), ethers.BigNumber.from(10).pow(16).mul(4));
// console.log("initialMarginRate");

// await Perpetual.setGovernanceParameter(ethers.utils.formatBytes32String("maintenanceMarginRate"), ethers.BigNumber.from(10).pow(16).mul(3));
// console.log("maintenanceMarginRate");

// await Perpetual.setGovernanceParameter(ethers.utils.formatBytes32String("liquidationPenaltyRate"), ethers.BigNumber.from(10).pow(15).mul(18));
// console.log("liquidationPenaltyRate");

// await Perpetual.setGovernanceParameter(ethers.utils.formatBytes32String("penaltyFundRate"), ethers.BigNumber.from(10).pow(15).mul(12));
// console.log("penaltyFundRate");

// await Perpetual.setGovernanceParameter(ethers.utils.formatBytes32String("lotSize"), ethers.BigNumber.from(10).pow(15).mul(1));
// console.log("lotSize");

// await Perpetual.setGovernanceParameter(ethers.utils.formatBytes32String("tradingLotSize"), ethers.BigNumber.from(10).pow(15).mul(1));
// console.log("tradingLotSize");


// await Perpetual.setGovernanceParameter(ethers.utils.formatBytes32String("referrerBonusRate"), ethers.BigNumber.from(10).pow(17).mul(3));



// await Funding.setGovernanceParameter(ethers.utils.formatBytes32String("emaAlpha"),3327787021630616);

// await Funding.setGovernanceParameter(ethers.utils.formatBytes32String("markPremiumLimit"),ethers.BigNumber.from(10).pow(14).mul(8));

// await Funding.setGovernanceParameter(ethers.utils.formatBytes32String("fundingDampener"),ethers.BigNumber.from(10).pow(14).mul(4));

// await Funding.initFunding();





    

    

  });

  task("verify", "verify contract")
.setAction(async ({}, { ethers, run, network }) => {
    await run("compile");
    const signers = await ethers.getSigners();
    // await run(
    //   "verify:verify",
    //   getContract(network.name, "GlobalConfig")
    // );

    // await run(
    //   "verify:verify",
    //   getContract(network.name, "ContractReader")
    // );

    // await run(
    //   "verify:verify",
    //   getContract(network.name, "Exchange")
    // );

    // await run(
    //   "verify:verify",
    //   getContract(network.name, "TestToken")
    // );

    // await run(
    //   "verify:verify",
    //   getContract(network.name, "PriceFeeder")
    // );

    // await run(
    //   "verify:verify",
    //   getContract(network.name, "Perpetual")
    // );

    // await run(
    //   "verify:verify",
    //   getContract(network.name, "Proxy")
    // );

    // await run(
    //   "verify:verify",
    //   getContract(network.name, "Funding")
    // );

    await run(
      "verify:verify",
      getContract(network.name, "ChainlinkAdapter")
    );
  });

export default {
  networks: RPCS,
  defaultNetwork: "hardhat",
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY,
  },
  contractSizer: {
    alphaSort: true,
    runOnCompile: true,
    disambiguatePaths: false,
  },
  spdxLicenseIdentifier: {
    overwrite: true,
    runOnCompile: true,
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



      
    }
  },
};
