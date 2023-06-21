import hardhat from "hardhat";
import { deploy } from "../scripts/deploy-utils";
import {
  Broker__factory,
  ChainlinkAdapter,
  ChainlinkAdapter__factory,
  ContractReader__factory,
  Exchange__factory,
  Funding__factory,
  GlobalConfig__factory,
  MyTestToken__factory,
  Perpetual__factory,
  PriceFeeder__factory,
  Proxy__factory,
} from "../typechain-ethers-v5";

export async function deployChainLinkAdapter(usdtDecimals: number) {
  const { network } = hardhat;

  const oneUsdt = BigInt(10) ** BigInt(usdtDecimals);
  const priceFeeder = {
    address: "0x9ef1b8c0e4f7dc8bf5719ea496883dc6401d5b2e",
    name: "ETH_USD",
    chainId: 56,
    priceTimeout: 3600, //todo
  };

  if (network.config.chainId !== priceFeeder.chainId) {
    priceFeeder.chainId = network.config.chainId!;
    priceFeeder.address = "Invalid Address";
  }

  if (network.config.chainId === 97) {
    priceFeeder.address = "0x143db3CEEfbdfe5631aDD3E50f7614B6ba708BA7";
    priceFeeder.priceTimeout = 3600;
  }

  

  if (network.name === "hardhat") {
    const mockPriceFeeder = await deploy<PriceFeeder__factory>("PriceFeeder");
    await mockPriceFeeder.setPrice(BigInt(1763) * oneUsdt);
    return mockPriceFeeder as unknown as ChainlinkAdapter;
  }

  return deploy<ChainlinkAdapter__factory>("ChainlinkAdapter", priceFeeder.address, priceFeeder.priceTimeout, false);
}

export async function deployUsdt() {
  const { network } = hardhat;

  const usdt = {
    address: "0x55d398326f99059fF775485246999027B3197955", //todo
    name: "BNB_USDT",
    symbol: "USDT",
    decimals: 18,
    chainId: 56,
  };

  if (network.config.chainId !== usdt.chainId) {
    let testToken = await deploy<MyTestToken__factory>("MyTestToken", usdt.name, usdt.symbol, usdt.decimals);
    usdt.address = testToken.address;
    usdt.chainId = network.config.chainId!;
  }

  return usdt;
}

export async function deployAll(): Promise<void> {
  const { ethers, network } = hardhat;
  ;(network as any).forceWrite=true

  const signers = await ethers.getSigners();
  const deployer = signers[0].address;
  const dev = deployer;

  console.log("network:", network.name, network.config.chainId);
  console.log("deployer:", deployer);

  //ContractReader
  let contractRreader = await deploy<ContractReader__factory>("ContractReader");

  // GlobalConfig
  let globalConfig = await deploy<GlobalConfig__factory>("GlobalConfig");
  await globalConfig.addBroker(deployer);

  // exchange
  let exchange = await deploy<Exchange__factory>("Exchange", globalConfig.address);
  

  // USDT
  const usdt = await deployUsdt();

  // ChainlinkAdapter
  const chainlinkAdapter = await deployChainLinkAdapter(usdt.decimals);

  // // Broker
  // let broker = await deploy<Broker__factory>("Broker", chainlinkAdapter.address, exchange.address);
  // await globalConfig.addBroker(broker.address);
  

  // Perpetual
  let perpetual = await deploy<Perpetual__factory>("Perpetual", globalConfig.address, usdt.address, dev, usdt.decimals, exchange.address);

  // Proxy
  //let proxy = await deploy<Proxy__factory>("Proxy", perpetual.address);

  // Funding
  let funding = await deploy<Funding__factory>("Funding",globalConfig.address,perpetual.address,chainlinkAdapter.address,);

  console.log("Perpetual.setGovernanceAddress");
  const perpetualGovAddresses = {
    // globalConfig: globalConfig.address,
    // dev: deployer,
    fundingModule: funding.address,
  };
  for (let [key, address] of Object.entries(perpetualGovAddresses)) {
    await perpetual.setGovernanceAddress(ethers.utils.formatBytes32String(key), address);
  }

  console.log("Funding.setGovernanceParameter");
  const fundingGovSettings = {
    emaAlpha: "3327787021630616",
    //updatePremiumPrize: "0",
    markPremiumLimit: "800000000000000",
    fundingDampener: "400000000000000",
    //accumulatedFundingPerContract:'0xxxx', //Emergency Only
    //priceFeeder: chainlinkAdapter.address,
  };

  for (let [key, value] of Object.entries(fundingGovSettings)) {
    await funding.setGovernanceParameter(ethers.utils.formatBytes32String(key), BigInt(value));
  }

  // init funding
  await funding.initFunding();
  console.log("Perpetual.setGovernanceParameter");
  const perpetualGovSettings = {
    initialMarginRate: "40000000000000000",
    maintenanceMarginRate: "30000000000000000",
    liquidationPenaltyRate: "18000000000000000",
    penaltyFundRate: "12000000000000000",
    //takerDevFeeRate: "0",
    //makerDevFeeRate: "0",
    lotSize: "1000000000000000",
    tradingLotSize: "1000000000000000",
    referrerBonusRate: "300000000000000000",
    //longSocialLossPerContracts: '0xxxx', //Emergency Only
    //shortSocialLossPerContracts: '0xxxx' //Emergency Only
  };
  for (let [key, value] of Object.entries(perpetualGovSettings)) {
    await perpetual.setGovernanceParameter(ethers.utils.formatBytes32String(key), BigInt(value));
  }

  console.log("-----finished---");
}


deployAll()