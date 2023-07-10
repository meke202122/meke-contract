import { test } from "@jest/globals";
import { Wallet } from "ethers";
import { _TypedDataEncoder } from "ethers/lib/utils";
import { execTx, readDeployment } from "../scripts/deploy-utils";
import { StaticJsonRpcProvider } from "@ethersproject/providers";
import { GlobalConfig, GlobalConfig__factory, TestToken, TestToken__factory } from '../typechain-ethers-v5';

describe("Demo", () => {
  test("globalConfig.addBrokers", async () => {
    const network = { chainId: 5611, name: "opbnbTestnet" };
    const provider = new StaticJsonRpcProvider("https://opbnb-testnet.meke.io/", network);
    const signer = new Wallet(process.env.PRIVATE_KEY_OPBNB_TEST || "", provider);

    const globalInfo=await readDeployment("GlobalConfig",network as any);
    const globalConfig: GlobalConfig = GlobalConfig__factory.connect(globalInfo.address, signer);
    const brokers: string[] = [];

    for(let i=0;i<brokers.length;i++){
      await execTx((...args)=>globalConfig.addBroker(...args),"globalConfig.addBroker",brokers[i]);
    }
    console.log('---finished--')
  },300_000);

  test("USDT.info",async()=>{
    const network = { chainId: 5611, name: "opbnbTestnet" };
    const provider = new StaticJsonRpcProvider("https://opbnb-testnet.meke.io/", network);
    const signer = new Wallet(process.env.PRIVATE_KEY_OPBNB_TEST || "", provider);

    const usdtInfo=await readDeployment("TestToken", network as any);
    const usdt: TestToken = TestToken__factory.connect(usdtInfo.address, signer);
    const info={
      address: usdt.address,
      symbol: await usdt.symbol(),
      totalSupply: (await usdt.totalSupply()).toBigInt(),
      owner: await usdt.owner(),
    }

    console.log(info);

  },300_000)

  
  test("USDT.approve", async () => {
    const network = { chainId: 5611, name: "opbnbTestnet" };
    const provider = new StaticJsonRpcProvider("https://opbnb-testnet.meke.io/", network);
    const signer = new Wallet(
      "",
      provider,
    );
    console.log("Wallet Account",signer.address);
    const usdtInfo = await readDeployment("TestToken", network as any);
    const perpetualInfo = await readDeployment("Perpetual", network as any);

    const usdt: TestToken = TestToken__factory.connect(usdtInfo.address, signer);
    const info = {
      address: usdt.address,
      symbol: await usdt.symbol(),
      totalSupply: (await usdt.totalSupply()).toBigInt(),
      owner: await usdt.owner(),
    };
    console.log(info);
    await execTx((...args) => usdt.approve(...args), "usdt.approve", perpetualInfo.address, BigInt(10)**BigInt(9+18));

  }, 300_000);
});
