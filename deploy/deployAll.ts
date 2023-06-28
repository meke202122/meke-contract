import hardhat from "hardhat";
import { delay, deploy, execTx, isTestnet } from "../scripts/deploy-utils";
import {
  ChainlinkAdapter,
  ChainlinkAdapter__factory,
  ContractReader__factory,
  Exchange__factory,
  Funding__factory,
  GlobalConfig__factory,
  Perpetual__factory,
  PriceFeeder__factory,
  TestToken__factory,
} from "../typechain-ethers-v5";

export async function deployChainLinkAdapter(usdtDecimals: number) {
  const { network } = hardhat;
  const chainId = network.config.chainId!;

  const priceFeeder = {
    chainId,
    address: "Invalid Address",
    name: "ETH_USD",
    priceTimeout: 24 * 3600, //todo
  };

  switch (chainId) {
    case 56:
      priceFeeder.address = "0x9ef1b8c0e4f7dc8bf5719ea496883dc6401d5b2e";
      break;
    case 97:
      priceFeeder.address = "0x143db3CEEfbdfe5631aDD3E50f7614B6ba708BA7";
      break;
    default:
      const mockPriceFeeder = await deploy<PriceFeeder__factory>("PriceFeeder");
      const oneUsdt = BigInt(10) ** BigInt(usdtDecimals);
      await execTx((...args) => mockPriceFeeder.setPrice(...args), "mockPriceFeeder.setPrice", BigInt(1763) * oneUsdt);
      return mockPriceFeeder as unknown as ChainlinkAdapter;
  }
  return deploy<ChainlinkAdapter__factory>("ChainlinkAdapter", priceFeeder.address, priceFeeder.priceTimeout, false);
}

export async function deployUsdt() {
  const { network } = hardhat;
  const chainId = network.config.chainId!;

  const usdt = {
    chainId,
    address: "Invalid Address", //todo
    name: "USDT",
    symbol: "USDT",
    decimals: 18,
  };

  switch (chainId) {
    case 56:
      usdt.address = "0x55d398326f99059fF775485246999027B3197955";
      break;
    default:
      let testToken = await deploy<TestToken__factory>("TestToken", usdt.name, usdt.symbol, usdt.decimals);
      usdt.address = testToken.address;
  }
  return usdt;
}

export async function deployAll(): Promise<void> {
  const { ethers, network } = hardhat;
  const chainId = network.config.chainId!;

  const signers = await ethers.getSigners();
  const deployer = signers[0].address;
  const dev = deployer;

  console.log("Deployer Account:", deployer);
  console.log("Network:", network.name, chainId);

  //ContractReader
  let contractRreader = await deploy<ContractReader__factory>("ContractReader");

  // GlobalConfig
  let globalConfig = await deploy<GlobalConfig__factory>("GlobalConfig");

  // Exchange
  let exchange = await deploy<Exchange__factory>("Exchange", globalConfig.address);

  // USDT
  const usdt = await deployUsdt();

  // ChainlinkAdapter
  const chainlinkAdapter = await deployChainLinkAdapter(usdt.decimals);

  await execTx((...args)=>globalConfig.addBroker(...args),'globalConfig.addBroker',deployer);

  // Perpetual
  let perpetual = await deploy<Perpetual__factory>("Perpetual", globalConfig.address, usdt.address, dev, usdt.decimals);
  await execTx((...args) => globalConfig.addCaller(...args), "globalConfig.addCaller", perpetual.address);

  // Funding
  let funding = await deploy<Funding__factory>("Funding", globalConfig.address, perpetual.address, chainlinkAdapter.address);
  await execTx((...args) => globalConfig.addCaller(...args), "globalConfig.addCaller", funding.address);

  console.log("whitelist of exchange");
  await execTx((...args)=>globalConfig.addComponent(...args),'globalConfig.addComponent',exchange.address, perpetual.address);

  console.log("whitelist of perpetual");
  await execTx((...args)=>globalConfig.addComponent(...args),'globalConfig.addComponent',perpetual.address, exchange.address);
  await execTx((...args)=>globalConfig.addComponent(...args),'globalConfig.addComponent',perpetual.address, contractRreader.address);
  await execTx((...args)=>globalConfig.addComponent(...args),'globalConfig.addComponent',perpetual.address, funding.address);

  console.log("whitelist of funding");
  await execTx((...args)=>globalConfig.addComponent(...args),'globalConfig.addComponent',funding.address, exchange.address);
  await execTx((...args)=>globalConfig.addComponent(...args),'globalConfig.addComponent',funding.address, perpetual.address);

  if (isTestnet(chainId)) {
    await execTx((...args)=>globalConfig.addComponent(...args),'globalConfig.addComponent',perpetual.address, deployer);
    await execTx((...args)=>globalConfig.addComponent(...args),'globalConfig.addComponent',funding.address, deployer);
  }

  const [price] = await chainlinkAdapter.price();
  await execTx((...args) => funding.setFairPrice(...args), "funding.setFairPrice", price);

  console.log("Perpetual.setGovernanceAddress");
  const perpetualGovAddresses: Record<string, string> = {
    // globalConfig: globalConfig.address,
    // dev: deployer,
    fundingModule: funding.address,
  };
  for (let [key, address] of Object.entries(perpetualGovAddresses)) {
    await execTx(
      (k, ...args) => perpetual.setGovernanceAddress(ethers.utils.formatBytes32String(k),...args),
      "perpetual.setGovernanceAddress",
      key,
      address,
    );
    await delay(500);
  }

  console.log("Funding.setGovernanceParameter");
  const fundingGovSettings: Record<string, string> = {
    emaAlpha: "3327787021630616",
    //updatePremiumPrize: "0",
    markPremiumLimit: "800000000000000",
    fundingDampener: "400000000000000",
    //accumulatedFundingPerContract:'0xxxx', //Emergency Only
    //priceFeeder: chainlinkAdapter.address,
  };

  for (let [key, value] of Object.entries(fundingGovSettings)) {
    await execTx((k,v, ...args)=>funding.setGovernanceParameter(ethers.utils.formatBytes32String(k), BigInt(v + ""),...args),'funding.setGovernanceParameter',key,value);
  }

  await execTx((...args) => funding.initFunding(...args), "funding.initFunding");

  console.log("Perpetual.setGovernanceParameter");
  const perpetualGovSettings: Record<string, string> = {
    initialMarginRate: "40000000000000000", //0.04
    maintenanceMarginRate: "30000000000000000", //0.03
    liquidationPenaltyRate: "18000000000000000", //0.018
    penaltyFundRate: "12000000000000000", //0.012
    //takerDevFeeRate: "0",
    //makerDevFeeRate: "0",
    lotSize: "1000000000000000", //0.001
    tradingLotSize: "1000000000000000", //0.001
    referrerBonusRate: "300000000000000000", //0.3
    //longSocialLossPerContracts: '0xxxx', //Emergency Only
    //shortSocialLossPerContracts: '0xxxx' //Emergency Only
  };

  for (let [key, value] of Object.entries(perpetualGovSettings)) {
    await execTx(
      (k, v, ...args) => perpetual.setGovernanceParameter(ethers.utils.formatBytes32String(k), BigInt(v), ...args),
      "perpetual.setGovernanceParameter",
      key,
      value,
    );
  }

  console.log("-----finished---");
}

deployAll();
