import hardhat, { ethers } from "hardhat";
import { test } from "@jest/globals";
import { Wallet } from "ethers";
import { _TypedDataEncoder } from "ethers/lib/utils";
import { StaticJsonRpcProvider } from "@ethersproject/providers";
import { Exchange, Exchange__factory, GlobalConfig__factory } from "../typechain-ethers-v5";
import { deploy } from '../scripts/deploy-utils';

function getOrderSignerature(signature:string){
  const {r,s,v}=ethers.utils.splitSignature(signature)
  const orderSign={
    config:`0x${v.toString(16).padStart(2,'0')}01${'0'.repeat(60)}`,
    r,
    s,
  }
  console.log(orderSign);
  return orderSign;
}

describe("TestMatchOrders", () => {
  test("Exchange.validatePrice", async () => {
    const { ethers, network } = hardhat;
    const chainId = network.config.chainId!;

    const signers = await ethers.getSigners();
    const deployer = signers[0].address;

    console.log("Deployer Account:", deployer);
    console.log("Network:", network.name, chainId);

    // GlobalConfig
    let globalConfig = await deploy<GlobalConfig__factory>("GlobalConfig");
    // Exchange
    let exchange = await deploy<Exchange__factory>("Exchange", globalConfig.address);
    const takerOrderParam = {
      trader: "0x96e9cd83fac47e3b335afee6607bfadbc65fd3c2",
      amount: "79000000000000000000",
      price: 0,
      data: "0x02000100649d22cf01f403e800000000000000989680000000000000000015eb",
      signature: getOrderSignerature(
        "0x014e92905d2b6ae03b96e2fe1d2f807f26364f2001e318c4e9f00a9ebb37bcc9247e6e95cbcaab4865508eb0abb9a826cb696c165a07397c0faf837a88b134271b",
      ),
      //orderHash: "0xbbff6d52ea12755a3e73b1d87637d2e34d378c088bd644c8a8863ed1cdd47cd1",
    };
    const makerOrderParams = [
      {
        trader: "0xb62f90a6df89bf6ab6df9c0aaa25968f0474fdea",
        amount: "50000000000000000000",
        price: "1821000000000000000000",
        data: "0x02010000649d210d0000025800000000000000989680000000000000000015eb",
        signature: getOrderSignerature(
          "0x91eea17d6608c54771ab454a84eed26275301591c1b3290e576199d1c44cf27e4dae7347ae02516bfe0c361dce7f5e3f244d66770179bd8cfce1c822319646c31c",
        ),
        //orderHash: "0x0756d73a40d3a5b836db04b92888ed25db0f7eff88bfa9828ec47e47fc0b42fe",
      },

      // {
      //   trader: "0xb62f90a6df89bf6ab6df9c0aaa25968f0474fdea",
      //   amount: "50000000000000000000",
      //   price: "1821660000000000000000",
      //   data: "0x02010000649d214e0000025800000000000000989680000000000000000015eb",
      //   signature: getOrderSignerature(
      //     "0x0e2a0e58f53370d4b200d7aab67965934671a578e7ab4501557b1dacbb83b35a0830b5fa65aed83bb1c910753515dd138686d37e6a578425673aae1a70d7d2591c",
      //   ),
      //   //orderHash: "0xd46da8b6e91ff31da864dd5cef524af9bc75aa22c2d00580a1ae1c8cdee668f3",
      // },

      {
        trader: "0xb62f90a6df89bf6ab6df9c0aaa25968f0474fdea",
        amount: "50000000000000000000",
        price: "1821660000000000000000",
        data: "0x02010000649d214e0000025800000000000000989680000000000000000015eb",
        //error sign
        signature: getOrderSignerature(
          "0x0e3a0e58f53370d4b200d7aab67965934671a578e7ab4501557b1dacbb83b35a0830b5fa65aed83bb1c910753515dd138686d37e6a578425673aae1a70d7d2591c",
        ),
        //orderHash: "0xd46da8b6e91ff31da864dd5cef524af9bc75aa22c2d00580a1ae1c8cdee668f3",
      },
    ];

    for (let i = 0; i < 100; i++) {
      const str2=await exchange.uint2str(i).catch(err=>`${i} Error:${err.message}`)
      console.log(`uint2str(${i}) = ${str2} `)
    }

    // for(let i=0;i<100;i++){
    //   const str=await exchange.uint2str(i).catch(err=>`${i} Error:${err.message}`)
    //   console.log(`uint2str(${i}) = ${str} `)
    // }


    // for(let i=0;i<makerOrderParams.length;i++){
    //   console.log(`validatePrice ${i}`)
    //   const r=await exchange.validatePrice(takerOrderParam,makerOrderParams[i]);
    //   console.log(`validatePrice ${i}  result: ${r}`);
    // }
  }, 30000);

  test("Exchange.matchOrders", async () => {
    console.log(hardhat.network.name);
    const network = { chainId: 5611, name: "opbnbTestnet" };
    const provider = new StaticJsonRpcProvider("https://opbnb-testnet-rpc.bnbchain.org/", network);
    const signer = new Wallet(process.env.PRIVATE_KEY_OPBNB_TEST || "", provider);

    const exchange: Exchange = Exchange__factory.connect("0xf03f70BB9a287c190Fe04b91410b4401dcC3B2A2", signer);

    console.log(
      getOrderSignerature(
        "0x014e92905d2b6ae03b96e2fe1d2f807f26364f2001e318c4e9f00a9ebb37bcc9247e6e95cbcaab4865508eb0abb9a826cb696c165a07397c0faf837a88b134271b",
      ),
    );

    const takerOrderParam = {
      trader: "0x96e9cd83fac47e3b335afee6607bfadbc65fd3c2",
      amount: "79000000000000000000",
      price: 0,
      data: "0x02000100649d22cf01f403e800000000000000989680000000000000000015eb",
      signature: getOrderSignerature(
        "0x014e92905d2b6ae03b96e2fe1d2f807f26364f2001e318c4e9f00a9ebb37bcc9247e6e95cbcaab4865508eb0abb9a826cb696c165a07397c0faf837a88b134271b",
      ),
      //orderHash: "0xbbff6d52ea12755a3e73b1d87637d2e34d378c088bd644c8a8863ed1cdd47cd1",
    };
    const makerOrderParams = [
      {
        trader: "0xb62f90a6df89bf6ab6df9c0aaa25968f0474fdea",
        amount: "50000000000000000000",
        price: "1821000000000000000000",
        data: "0x02010000649d210d0000025800000000000000989680000000000000000015eb",
        signature: getOrderSignerature(
          "0x91eea17d6608c54771ab454a84eed26275301591c1b3290e576199d1c44cf27e4dae7347ae02516bfe0c361dce7f5e3f244d66770179bd8cfce1c822319646c31c",
        ),
        //orderHash: "0x0756d73a40d3a5b836db04b92888ed25db0f7eff88bfa9828ec47e47fc0b42fe",
      },

      // {
      //   trader: "0xb62f90a6df89bf6ab6df9c0aaa25968f0474fdea",
      //   amount: "50000000000000000000",
      //   price: "1821660000000000000000",
      //   data: "0x02010000649d214e0000025800000000000000989680000000000000000015eb",
      //   signature: getOrderSignerature(
      //     "0x0e2a0e58f53370d4b200d7aab67965934671a578e7ab4501557b1dacbb83b35a0830b5fa65aed83bb1c910753515dd138686d37e6a578425673aae1a70d7d2591c",
      //   ),
      //   //orderHash: "0xd46da8b6e91ff31da864dd5cef524af9bc75aa22c2d00580a1ae1c8cdee668f3",
      // },

      {
        trader: "0xb62f90a6df89bf6ab6df9c0aaa25968f0474fdea",
        amount: "50000000000000000000",
        price: "1821660000000000000000",
        data: "0x02010000649d214e0000025800000000000000989680000000000000000015eb",
        //error sign
        signature: getOrderSignerature(
          "0x0e3a0e58f53370d4b200d7aab67965934671a578e7ab4501557b1dacbb83b35a0830b5fa65aed83bb1c910753515dd138686d37e6a578425673aae1a70d7d2591c",
        ),
        //orderHash: "0xd46da8b6e91ff31da864dd5cef524af9bc75aa22c2d00580a1ae1c8cdee668f3",
      },
    ];

    const _perpetual = "0x5f283cf6be736669e4f511b4072d1deaccb1312b";

    const orderDatas = [
      {
        index: 0,
        amount: "41000000000000000000",
        takerLeverage: "25000000000000000000",
        makerLeverage: "9000000000000000000",
        gasFee: "2500000000000000000",
      },
      {
        index: 0,
        amount: "38000000000000000000",
        takerLeverage: "25000000000000000000",
        makerLeverage: "10000000000000000000",
        gasFee: "2500000000000000000",
      },
    ];

    const takerGasFee = "2500000000000000000";

    const receipt2=await provider.getTransactionReceipt("0xa13cc6dfff3ad2e0d5f893b38b397a0636e05cbe2d67269ad1396ecdf4612d0b");
    console.log(receipt2);


    //txhash 0xa13cc6dfff3ad2e0d5f893b38b397a0636e05cbe2d67269ad1396ecdf4612d0b
    await exchange.callStatic.matchOrders(takerOrderParam, makerOrderParams, _perpetual, orderDatas, takerGasFee, {
      gasLimit: 3_000_000,
    });

    // console.log("tx", tx);
    // await tx.wait();
    console.log("--finished--");
  }, 300_000);
});
