import { test } from "@jest/globals";
import { Wallet } from "ethers";
import { _TypedDataEncoder } from "ethers/lib/utils";
import { readDeployment } from "../scripts/deploy-utils";
import { StaticJsonRpcProvider } from "@ethersproject/providers";
import { GlobalConfig, GlobalConfig__factory } from '../typechain-ethers-v5';

describe("Demo", () => {
  test("globalConfig.addBrokers", async () => {
    const network = { chainId: 5611, name: "opbnbTestnet" };
    const provider = new StaticJsonRpcProvider("https://opbnb-testnet.meke.io/", network);
    const signer = new Wallet(process.env.PRIVATE_KEY_OPBNB_TEST || "", provider);

    const globalInfo = await readDeployment("GlobalConfig",network as any);
    console.log("globalInfo", globalInfo);

    expect(globalInfo.address).toBe("0xc474b6fCCd4b7deF593545193d17Dd9415E3B525");

    const keys:string[] = [];

    const accounts = await Promise.all(keys.map(async key => ({ key, address: await new Wallet(key, provider).getAddress() })));
    console.log(accounts.map(({address})=>address));

    const global: GlobalConfig = GlobalConfig__factory.connect(globalInfo.address, signer);
    for(let i=0;i<accounts.length;i++){
      const {key,address}=accounts[i];
      const isBroker = await global.brokers(address);
      if (isBroker) {
        console.log(`broker[${address}] already exists`);
        continue;
      }

      await (await global.addBroker(address))
        .wait()
        .then(res => {
          console.log(`addBroker success ${address} at tx ${res.transactionHash}`);
        })
        .catch(err => {
          console.log(`addBroker error ${err.message}`);
        });
    }

  },300_000);
});
