import hardhat from "hardhat";
import { delay, deploy } from "../scripts/deploy-utils";
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
    priceTimeout: 24 * 3600, //todo
  };

  if (network.config.chainId !== priceFeeder.chainId) {
    priceFeeder.chainId = network.config.chainId!;
    priceFeeder.address = "Invalid Address";
  }

  if (network.config.chainId === 97) {
    priceFeeder.address = "0x143db3CEEfbdfe5631aDD3E50f7614B6ba708BA7";
  }

  if (network.name === "hardhat") {
    const mockPriceFeeder = await deploy<PriceFeeder__factory>("PriceFeeder");
    await mockPriceFeeder.setPrice(BigInt(1763) * oneUsdt);
    console.log('mockPrice',(await mockPriceFeeder.price())[0].toBigInt())
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

  const signers = await ethers.getSigners();
  const deployer = signers[0].address;
  const dev = deployer;

  console.log("Deployer Account:", deployer);
  console.log("Network:", network.name, network.config.chainId);

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

  // Broker, unused
  // let broker = await deploy<Broker__factory>("Broker", chainlinkAdapter.address, exchange.address);
  // await globalConfig.addBroker(broker.address);
  await globalConfig.addBroker(deployer);
  await delay(500);

  // Perpetual
  let perpetual = await deploy<Perpetual__factory>("Perpetual", globalConfig.address, usdt.address, dev, usdt.decimals);
  globalConfig.addCaller(perpetual.address);

  // // Proxy
  // let proxy = await deploy<Proxy__factory>("Proxy", perpetual.address);
  // await globalConfig.addComponent(perpetual.address, proxy.address);

  // Funding
  let funding = await deploy<Funding__factory>(
    "Funding",
    globalConfig.address,
    perpetual.address,
    chainlinkAdapter.address,
  );
  await globalConfig.addCaller(funding.address);
  console.log("whitelist of exchange")
  await globalConfig.addComponent(exchange.address, perpetual.address);
  await delay(500);

  console.log("whitelist of perpetual");
  await globalConfig.addComponent(perpetual.address, exchange.address);
  await globalConfig.addComponent(perpetual.address, contractRreader.address);
  await globalConfig.addComponent(perpetual.address, funding.address);
  await delay(500);

  console.log("whitelist of funding");
  await globalConfig.addComponent(funding.address, exchange.address);
  await globalConfig.addComponent(funding.address, perpetual.address);
  await delay(500);

  if (network.config.chainId !== 56) {
    await globalConfig.addComponent(perpetual.address, deployer);
    await globalConfig.addComponent(funding.address, deployer);
  }

  const [price] = await chainlinkAdapter.price();
  console.log(`funding.setFairPrice(${price.toBigInt()})`);
  await funding.setFairPrice(price);
  await delay(500);

  console.log("Perpetual.setGovernanceAddress");
  const perpetualGovAddresses: Record<string, string> = {
    // globalConfig: globalConfig.address,
    // dev: deployer,
    fundingModule: funding.address,
  };
  for (let [key, address] of Object.entries(perpetualGovAddresses)) {
    console.log(`perpetual.setGovernanceAddress('${key}','${address}')`);
    await perpetual.setGovernanceAddress(ethers.utils.formatBytes32String(key), address);
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
    console.log(`funding.setGovernanceParameter('${key}','${value}')`);
    await funding.setGovernanceParameter(ethers.utils.formatBytes32String(key), BigInt(value + ""));
    await delay(500);
  }

  // init funding
  console.log("funding.initFunding");
  await funding.initFunding();
  await delay(500);

  console.log("Perpetual.setGovernanceParameter");
  const perpetualGovSettings: Record<string, string> = {
    initialMarginRate: "40000000000000000",//0.04
    maintenanceMarginRate: "30000000000000000",//0.03
    liquidationPenaltyRate: "18000000000000000",//0.018
    penaltyFundRate: "12000000000000000",//0.012
    //takerDevFeeRate: "0",
    //makerDevFeeRate: "0",
    lotSize: "1000000000000000",//0.001
    tradingLotSize: "1000000000000000",//0.001
    referrerBonusRate: "300000000000000000",//0.3
    //longSocialLossPerContracts: '0xxxx', //Emergency Only
    //shortSocialLossPerContracts: '0xxxx' //Emergency Only
  };

  for (let [key, value] of Object.entries(perpetualGovSettings)) {
    console.log(`perpetual.setGovernanceParameter('${key}','${value}')`);
    await perpetual.setGovernanceParameter(ethers.utils.formatBytes32String(key), BigInt(value), {gasLimit:500_000});
    await delay(500);
  }

  console.log("-----finished---");
}

deployAll();
