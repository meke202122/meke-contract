import { expect, test } from "@jest/globals";
import hardhat from "hardhat";
import { deploy } from "../scripts/deploy-utils";
import { TestToken__factory } from '../typechain-ethers-v5/factories/contracts/test/TestToken.sol';

async function exec(action:()=>any){
  console.log(action.toString());
}

describe("TestToken", () => {
  test('funcTest',async()=>{
    exec(()=>{console.log('kkk')});
  });
  test("simpleTest", async () => {
    const { ethers } = hardhat;

    const signers = await ethers.getSigners();
    const deployer = signers[0].address;

    const decimals = 18;
    const unitOne = BigInt(10) ** BigInt(decimals);
    const totalSupply = BigInt(10) * unitOne;

    const testToken = await deploy<TestToken__factory>('TestToken', "TestU", "TestU");

    expect(await testToken.decimals()).toBe(decimals);
    expect((await testToken.totalSupply()).toBigInt()).toBe(totalSupply);
    expect((await testToken.balanceOf(deployer)).toBigInt()).toBe(totalSupply);

    //---test transfer ---
    const receiver1 = signers[1].address;
    const amount = unitOne * BigInt(321);
    expect((await testToken.balanceOf(receiver1)).toBigInt()).toBe(BigInt(0));

    await (await testToken.transfer(receiver1, amount)).wait();
    expect((await testToken.balanceOf(receiver1)).toBigInt()).toBe(amount);
    expect((await testToken.balanceOf(deployer)).toBigInt()).toBe(totalSupply - amount);
    expect((await testToken.totalSupply()).toBigInt()).toBe(totalSupply);

    //--- test mint --
    await (await testToken.mint(receiver1, amount)).wait();
    expect((await testToken.balanceOf(receiver1)).toBigInt()).toBe(amount * BigInt(2));
    expect((await testToken.balanceOf(deployer)).toBigInt()).toBe(totalSupply - amount);
    expect((await testToken.totalSupply()).toBigInt()).toBe(totalSupply + amount);
    console.log('---finished--')
  }, 30_000);
});
