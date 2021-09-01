// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
// When running the script with `hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.

import {HardhatRuntimeEnvironment} from "hardhat/types";


async function deployment(hre: HardhatRuntimeEnvironment): Promise<void> {
  const {deployments, getNamedAccounts, network, ethers} = hre
  const {deploy, save, getArtifact, execute, read} = deployments
  const {deployer, dev} = await getNamedAccounts()

  // ContractReader
  let contractRreader = await deploy("ContractReader", {
    from: deployer,
    log: true
  })

  // GlobalConfig
  let globalConfig = await deploy("GlobalConfig", {
    from: deployer,
    log: true
  })

  // exchange
  let exchange = await deploy("Exchange", {
    from: deployer,
    log: true,
    args: [globalConfig.address]
  })

  // mock collateral token
  let testToken = await deploy("TestToken", {
    from: deployer,
    log: true,
    args: ["USDT", "USDT"]
  })

  // mock price feeder
  let priceFeeder = await deploy("PriceFeeder", {
    from: deployer,
    log: true,
  })

  // set oracle price
  await execute("PriceFeeder", {
    from: deployer,
  }, "setPrice", ethers.BigNumber.from(10).pow(20).mul(38));

  // Perpetual
  let perpetual = await deploy("Perpetual", {
    from: deployer,
    log: true,
    args: [globalConfig.address, dev, testToken.address, 18]
  })

  // Proxy
  let proxy = await deploy("Proxy", {
    from: deployer,
    log: true,
    args: [perpetual.address]
  })

  // AMM
  let amm = await deploy("AMM", {
    from: deployer,
    log: true,
    args: [globalConfig.address, proxy.address, priceFeeder.address]
  })

  // whitelist
  console.log('whitelist perpetual -> proxy');
  await execute("GlobalConfig", {
    from: deployer
  }, "addComponent", perpetual.address, proxy.address);

  console.log('whitelist perpetual -> exchange');
  await execute("GlobalConfig", {
    from: deployer
  }, "addComponent", perpetual.address, exchange.address);

  console.log('whitelist amm -> exchange');
  await execute("GlobalConfig", {
    from: deployer
  }, "addComponent", amm.address, exchange.address);

  await execute("GlobalConfig", {
    from: deployer
  }, "addComponent", perpetual.address, contractRreader.address);

  // set perpetual gov param
  await execute("Perpetual", {
    from: deployer,
  }, "setGovernanceAddress", ethers.utils.formatBytes32String("amm"), amm.address)
  console.log("set amm address done")

  // init funding
  await execute("AMM", {
    from: deployer
  }, "initFunding")
  console.log("initFunding done")
}

deployment.tags = ["ArbTest"]
export default deployment
