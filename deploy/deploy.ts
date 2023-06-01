// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
// When running the script with `hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.

import { HardhatRuntimeEnvironment } from "hardhat/types";

async function deployment(hre: HardhatRuntimeEnvironment): Promise<void> {
  const { deployments, getNamedAccounts, ethers, network } = hre;

  const { deploy, execute } = deployments;
  const { deployer, dev } = await getNamedAccounts();

  console.log("network:", network.name);
  console.log("deployer:", deployer);
  console.log("bytes32", ethers.utils.formatBytes32String("priceFeeder"));

  //ContractReader
  let contractRreader = await deploy("ContractReader", {
    from: deployer,
    log: true,
  });

  // GlobalConfig
  let globalConfig = await deploy("GlobalConfig", {
    from: deployer,
    log: true,
  });

  // exchange
  let exchange = await deploy("Exchange", {
    from: deployer,
    log: true,
    args: [globalConfig.address],
  });

  //mock collateral token
  const tokenTokenDecimal = 6;
  let testToken = await deploy("TestToken", {
    from: deployer,
    log: true,
    args: ["USDT", "USDT", tokenTokenDecimal],
  });

  //chainLinkAdapter
  const usdEthOracle = "0x143db3CEEfbdfe5631aDD3E50f7614B6ba708BA7";//chainlink bscTestnet  ETH/USDT
  const priceTimeout = 3600 * 24 * 365 * 30;
  let chainLinkAdapter = await deploy("ChainlinkAdapter", {
    from: deployer,
    log: true,
    args: [usdEthOracle, priceTimeout, false],
  });

  if (network.name === "hardhat") {
    chainLinkAdapter = await deploy("PriceFeeder", {
      from: deployer,
      log: true,
    });
    await execute(
      "PriceFeeder",
      {
        from: deployer,
      },
      "setPrice",
      BigInt("1763600000000000000000"),
    );
  }

  // Broker
  let broker = await deploy("Broker", {
    from: deployer,
    log: true,
    args: [chainLinkAdapter.address, exchange.address],
  });

  // Perpetual
  let perpetual = await deploy("Perpetual", {
    from: deployer,
    log: true,
    args: [globalConfig.address, testToken.address, dev, tokenTokenDecimal],
  });

  // Proxy
  let proxy = await deploy("Proxy", {
    from: deployer,
    log: true,
    args: [perpetual.address],
  });

  // Funding
  let funding = await deploy("Funding", {
    from: deployer,
    log: true,
    args: [globalConfig.address, proxy.address, chainLinkAdapter.address],
  });

  // whitelist
  console.log("whitelist perpetual -> proxy");
  await execute(
    "GlobalConfig",
    {
      from: deployer,
    },
    "addComponent",
    perpetual.address,
    proxy.address,
  );

  console.log("whitelist perpetual -> exchange");
  await execute(
    "GlobalConfig",
    {
      from: deployer,
    },
    "addComponent",
    perpetual.address,
    exchange.address,
  );

  console.log("whitelist perpetual -> contractRreader");
  await execute(
    "GlobalConfig",
    {
      from: deployer,
    },
    "addComponent",
    perpetual.address,
    contractRreader.address,
  );

  console.log("whitelist perpetual -> funding");
  await execute(
    "GlobalConfig",
    {
      from: deployer,
    },
    "addComponent",
    perpetual.address,
    funding.address,
  );

  console.log("whitelist perpetual -> deployer");
  await execute(
    "GlobalConfig",
    {
      from: deployer,
    },
    "addComponent",
    perpetual.address,
    deployer,
  );

  console.log("whitelist funding -> exchange");
  await execute(
    "GlobalConfig",
    {
      from: deployer,
    },
    "addComponent",
    funding.address,
    exchange.address,
  );

  console.log("whitelist funding -> perpetual");
  await execute(
    "GlobalConfig",
    {
      from: deployer,
    },
    "addComponent",
    funding.address,
    perpetual.address,
  );

  console.log("whitelist funding -> deployer");
  await execute(
    "GlobalConfig",
    {
      from: deployer,
    },
    "addComponent",
    funding.address,
    deployer,
  );

  console.log("Perpetual.setGovernanceAddress -> fundingModule");
  await execute(
    "Perpetual",
    {
      from: deployer,
    },
    "setGovernanceAddress",
    ethers.utils.formatBytes32String("fundingModule"),
    funding.address,
  );

  console.log("Funding.setGovernanceParameter");
  const fundingGovSettings = {
    emaAlpha: "3327787021630616",
    updatePremiumPrize: "0",
    markPremiumLimit: "800000000000000",
    fundingDampener: "400000000000000",
    //accumulatedFundingPerContract:'0xxx',
    priceFeeder: chainLinkAdapter.address,
  };
  for (let [key, value] of Object.entries(fundingGovSettings)) {
    if(key==='priceFeeder'){
      console.log(`Funding.setGovernanceParameter('${ethers.utils.formatBytes32String(key)}',${value})`);
      continue
    }
    console.log(`Funding.setGovernanceParameter('${key}',${value})`);
    await execute(
      "Funding",
      {
        from: deployer,
      },
      "setGovernanceParameter",
      ethers.utils.formatBytes32String(key),
      BigInt(value),
    );
  }

  // init funding
  await execute(
    "Funding",
    {
      from: deployer,
    },
    "initFunding",
  );
  console.log("initFunding done");

  console.log("Perpetual.setGovernanceParameter");
  const perpetualGovSettings = {
    initialMarginRate: "40000000000000000",
    maintenanceMarginRate: "30000000000000000",
    liquidationPenaltyRate: "18000000000000000",
    penaltyFundRate: "12000000000000000",
    takerDevFeeRate: "0",
    makerDevFeeRate: "0",
    lotSize: "1000000000000000",
    tradingLotSize: "1000000000000000",
    referrerBonusRate: "300000000000000000",
    //longSocialLossPerContracts: '0xxxx',
    //shortSocialLossPerContracts: '0xxxx'
  };
  for (let [key, value] of Object.entries(perpetualGovSettings)) {
    console.log(`Perpetual.setGovernanceParameter('${key}',${value})`);
    await execute(
      "Perpetual",
      {
        from: deployer,
      },
      "setGovernanceParameter",
      ethers.utils.formatBytes32String(key),
      BigInt(value),
    );
  }

  console.log("Perpetual.setFairPrice");
  await execute("Perpetual", { from: deployer }, "setFairPrice", BigInt("1763600000000000000000")).catch(() =>
    console.warn("--Error:Perpetual.setFairPrice"),
  );

  console.log("Funding.setFairPrice");
  await execute("Funding", { from: deployer }, "setFairPrice", BigInt("1763600000000000000000")).catch(() =>
    console.warn("--Error: Funding.setFairPrice"),
  );

  console.log('Add Broker')
    await execute(
      "GlobalConfig",
      {
        from: deployer,
      },
      "addBroker",
      deployer,
    );

}

deployment.tags = ["bsctest", "hardhat"];

export default deployment;
