import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { assert } from "chai";
import { ethers } from "hardhat";

const { toWad } = require('./constants');
const { buildOrder, getOrderHash } = require('./order');

describe('order', () => {
    let testOrder: any;
    let testType: any;
    let accounts: string[] = [];
    let accs: SignerWithAddress[];

    const deploy = async () => {
        accs = await ethers.getSigners();
        for (const acc of accs) {
            let addr = await acc.getAddress();
            accounts.push(addr);
        }
        console.log("accounts"+accounts);
        const TestOrder = await ethers.getContractFactory("TestOrder");
        const TestTypes = await ethers.getContractFactory("TestTypes");
        testOrder = await TestOrder.deploy();
        testType = await TestTypes.deploy();
       
        
    }

    before(async () => {
        await deploy();
    });

    it("test order", async () => {

        const chainId = await ethers.provider._network.chainId

        console.log("chainId"+chainId);

        const trader = "0xd41bF9460Ecb5202Ee7d83567D6c7e4D24A88B6c";
        const admin = "0x0000000000000000000000000000000000000000";
        const data = "0x02000100639b18e0000000000000000000000098968000000000000000000061";
        const signatureString = "0x7c8c5dcc591b9d14336fb75fc05b415c0c10a86e5b99a43a3c5c510e41d28c7a2c4b4763c371dcca019198e9875db6961d1ec03d2b4ccee1b863a7b6dccc25361c";


        const perpetualAddress = "0x5107d08e8f0DFb9593e76004C9874a606fE47702"

        const signature = signatureString.substring(2);

        const r = "0x" + signature.substring(0, 64);
        const s = "0x" + signature.substring(64, 128);
        const v = signature.substring(128, 130);
        const config = `0x${v}01` + '0'.repeat(60);

        console.log("sign :"+config+signature.substring(0, 64)+signature.substring(64, 128))

        console.log("signature"+signature)

        console.log("r"+r)

        console.log("s"+s)

        console.log("v"+v)

        
        const signature1 ={
            config:config,
            r:r,
            s:s,
        }

        const orderParam = {
                    trader: trader,
                    broker: "0x0000000000000000000000000000000000000000",
                    amount: toWad(22.3),
                    price: toWad(0) ,
                    data: data,
                    signature: signature1,
                };

        const orderHash = await testOrder.getOrderHash3(orderParam,perpetualAddress,admin);

        const address = await testOrder.getSigner(orderParam,orderHash);

        console.log(address);


            
    });

    it("test order 2", async () => {
        const admin = accounts[0];
        const u1 = accounts[4];
        const trader = u1;
        const perpetualAddress = "0x4DA467821456Ca82De42fa691ddA08B24A4f0572";

        const offline = await buildOrder({
            trader: trader,
            amount: 1,
            price: 6000,
            version: 2,
            side: 'sell',
            type: 'limit',
            expiredAt: 1589366657,
            salt: 666,
            makerFeeRate: -15, // 100000
            takerFeeRate: 20
        }, perpetualAddress, admin);

        const orderParam = {
            trader: trader,
            amount: toWad(1),
            price: toWad(6000),
            data: offline.data,
            signature: offline.signature,
        };
        const order = await testOrder.getOrder(orderParam, perpetualAddress, admin);
        const orderHash = await testOrder.getOrderHash1(order);

        assert.equal(getOrderHash(offline), orderHash);

        assert.equal(await testOrder.expiredAt(orderParam), 1589366657)
        assert.equal(await testOrder.isSell(orderParam), true)
        assert.equal(await testOrder.isMarketOrder(orderParam), false);
        assert.equal(await testOrder.getPrice(orderParam), toWad(6000));
        assert.equal(await testOrder.isMarketBuy(orderParam), false);
        assert.equal(await testOrder.isMakerOnly(orderParam), false);
        assert.equal(await testOrder.isInversed(orderParam), false);
        assert.equal(await testOrder.side(orderParam), 1);
        assert.equal(await testOrder.makerFeeRate(orderParam), toWad(-0.000015));
        assert.equal(await testOrder.takerFeeRate(orderParam), toWad(0.00002));
    });

    it("test order 3", async () => {
        const admin = accounts[0];
        const u1 = accounts[4];
        const trader = u1;
        const perpetualAddress = "0x4DA467821456Ca82De42fa691ddA08B24A4f0572";

        const offline = await buildOrder({
            trader: trader,
            amount: 1,
            price: 6000,
            version: 2,
            side: 'sell',
            type: 'market',
            expiredAt: 1589366657,
            salt: 666,
            makerFeeRate: -15, // 100000
            takerFeeRate: 20,
            inversed: true,
        }, perpetualAddress, admin);

        const orderParam = {
            trader: trader,
            amount: toWad(1),
            price: toWad(6000),
            data: offline.data,
            signature: offline.signature,
        };
        const order = await testOrder.getOrder(orderParam, perpetualAddress, admin);
        const orderHash = await testOrder.getOrderHash1(order);
        assert.equal(getOrderHash(offline), orderHash);

        assert.equal(await testOrder.expiredAt(orderParam), 1589366657)
        assert.equal(await testOrder.isSell(orderParam), false)
        assert.equal(await testOrder.isMarketOrder(orderParam), true);
        assert.equal(await testOrder.getPrice(orderParam), "166666666666667");
        assert.equal(await testOrder.isMarketBuy(orderParam), true);
        assert.equal(await testOrder.isMakerOnly(orderParam), false);
        assert.equal(await testOrder.isInversed(orderParam), true);
        assert.equal(await testOrder.side(orderParam), 2);
        assert.equal(await testOrder.makerFeeRate(orderParam), toWad(-0.000015));
        assert.equal(await testOrder.takerFeeRate(orderParam), toWad(0.00002));
    });

    it("test order 3", async () => {
        assert.equal(await testType.counterSide(0), 0);
        assert.equal(await testType.counterSide(1), 2);
        assert.equal(await testType.counterSide(2), 1);
    });
});
