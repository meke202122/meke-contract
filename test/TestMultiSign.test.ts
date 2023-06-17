import { expect, test } from "@jest/globals";
import { _TypedDataEncoder } from "ethers/lib/utils";
import hardhat from "hardhat";
import { deploy } from "../scripts/deploy-utils";
import { TestMultiSignCaller__factory, TestMultiSign__factory } from "../typechain-ethers-v5";

describe("testMultiSign", () => {
  test("testAll", async () => {
    const { ethers } = hardhat;

    const signers = await ethers.getSigners();
    const _signers = signers.slice(1, 4).map(s => s.address);

    const testMultiSign = await deploy<TestMultiSign__factory>("TestMultiSign", _signers, []);

    const signerCount = await testMultiSign.getSignerCount();
    expect(signerCount.toBigInt()).toBe(BigInt(_signers.length));

    const allSigners = await testMultiSign.getSigners();
    expect(allSigners).toStrictEqual(_signers);

    expect(await testMultiSign.getRatio()).toStrictEqual([2, 3]);

    const timeout = await testMultiSign.signTimeout();
    expect(timeout).toBe(10 * 60);

    const signer1 = await testMultiSign.getSignerAt(1);
    expect(signer1).toBe(_signers[1]);

    const signer2 = await testMultiSign.getSignerAt(2);
    expect(signer2).toBe(_signers[2]);

    await expect(testMultiSign.getSignerAt(100)).rejects.toThrow(/index out of range/);
    await expect(testMultiSign.connect(signers[5]).writeDemo1()).rejects.toThrow(/the caller is not the signer/);
    await expect(testMultiSign.connect(signers[0]).writeDemo2()).rejects.toThrow(/the caller is not the signer/);

    // ---------writeTest1-------
    let lastWriter = await testMultiSign.lastWriter();
    console.log(lastWriter);
    expect(lastWriter).toBe(signers[0].address);

    //sign
    await testMultiSign.connect(signers[1]).writeDemo1();
    lastWriter = await testMultiSign.lastWriter();
    console.log(lastWriter);
    expect(lastWriter).toBe(signers[0].address);

    //exec
    await testMultiSign.connect(signers[2]).writeDemo1();
    lastWriter = await testMultiSign.lastWriter();
    console.log(lastWriter);
    expect(lastWriter).toBe(signers[2].address);

    //-------------------
    //sign
    await testMultiSign.connect(signers[3]).writeDemo2();
    lastWriter = await testMultiSign.lastWriter();
    console.log(lastWriter);
    expect(lastWriter).toBe(signers[2].address);

    //exec
    await testMultiSign.connect(signers[1]).writeDemo2();
    lastWriter = await testMultiSign.lastWriter();
    console.log(lastWriter);
    expect(lastWriter).toBe(signers[1].address);

    //-----------------------
    //-------------------
    //sign
    await testMultiSign.connect(signers[3]).writeDemo2();
    lastWriter = await testMultiSign.lastWriter();
    console.log(lastWriter);
    expect(lastWriter).toBe(signers[1].address);

    //resign
    await testMultiSign.connect(signers[1]).writeDemo1();
    lastWriter = await testMultiSign.lastWriter();
    console.log(lastWriter);
    expect(lastWriter).toBe(signers[1].address);

    //resign
    await testMultiSign.connect(signers[3]).writeDemo2();
    lastWriter = await testMultiSign.lastWriter();
    console.log(lastWriter);
    expect(lastWriter).toBe(signers[1].address);

    //==========timeout test================
    await testMultiSign.connect(signers[1]).setSignTimeout(2);
    await testMultiSign.connect(signers[2]).setSignTimeout(2);
    expect(await testMultiSign.signTimeout()).toBe(2);

    await testMultiSign.connect(signers[1]).writeDemo2();
    await new Promise(resolve => setTimeout(resolve, 5000));

    //expired resign
    await testMultiSign.connect(signers[2]).writeDemo2();
    await new Promise(resolve => setTimeout(resolve, 5000));

    //expired resign
    await testMultiSign.connect(signers[3]).writeDemo2();
    expect(await testMultiSign.lastWriter()).toBe(signers[1].address);

    //exec
    await testMultiSign.connect(signers[2]).writeDemo2();
    expect(await testMultiSign.lastWriter()).toBe(signers[2].address);

    // ======== test remove signer =========
    expect((await testMultiSign.getSignerCount()).toBigInt()).toBe(BigInt(3));
    await testMultiSign.connect(signers[1]).removeSigner(signers[3].address);
    await testMultiSign.connect(signers[2]).removeSigner(signers[3].address);
    expect((await testMultiSign.getSignerCount()).toBigInt()).toBe(BigInt(2));
    await expect(testMultiSign.connect(signers[3]).writeDemo2()).rejects.toThrow(/the caller is not the signer/);

    await testMultiSign.connect(signers[1]).removeSigner(signers[2].address);
    await testMultiSign.connect(signers[2]).removeSigner(signers[2].address);
    expect((await testMultiSign.getSignerCount()).toBigInt()).toBe(BigInt(1));
    await expect(testMultiSign.connect(signers[2]).writeDemo2()).rejects.toThrow(/the caller is not the signer/);

    await expect(testMultiSign.connect(signers[1]).removeSigner(signers[1].address)).rejects.toThrow(
      /can not remove the only one signer/,
    );

    // ---------------add Signer----------------------
    await testMultiSign.connect(signers[1]).addSigner(signers[2].address);
    expect((await testMultiSign.getSignerCount()).toBigInt()).toBe(BigInt(2));

    await testMultiSign.connect(signers[1]).addSigner(signers[3].address);
    expect((await testMultiSign.getSignerCount()).toBigInt()).toBe(BigInt(2));
    await testMultiSign.connect(signers[2]).addSigner(signers[3].address);
    expect((await testMultiSign.getSignerCount()).toBigInt()).toBe(BigInt(3));

    // ------------ change Ratio -------------
    await testMultiSign.connect(signers[1]).setRatio(1, 3);
    expect(await testMultiSign.getRatio()).toStrictEqual([2, 3]);
    await testMultiSign.connect(signers[2]).setRatio(1, 3);
    expect(await testMultiSign.getRatio()).toStrictEqual([1, 3]);

    await testMultiSign.connect(signers[1]).setRatio(2, 3);
    expect(await testMultiSign.getRatio()).toStrictEqual([2, 3]);

    await testMultiSign.connect(signers[1]).setRatio(1, 3);
    await testMultiSign.connect(signers[2]).setRatio(1, 3);
    expect(await testMultiSign.getRatio()).toStrictEqual([1, 3]);

    // -----whitelist test-----
    const testCaller = await deploy<TestMultiSignCaller__factory>("TestMultiSignCaller", testMultiSign.address);

    await expect(testCaller.writeDemo1(10)).rejects.toThrow(/caller not in whitelist/);
    await testMultiSign.connect(signers[1]).addCaller(testCaller.address);

    expect((await testMultiSign.getCallerCount()).toBigInt()).toBe(BigInt(1));
    expect(await testMultiSign.getCallers()).toStrictEqual([testCaller.address]);
    expect(await testMultiSign.getCallerAt(0)).toBe(testCaller.address);

    await testCaller.connect(signers[2]).writeDemo1(123);
    expect((await testCaller.value()).toBigInt()).toBe(BigInt(123));

    await expect(testMultiSign.removeCaller(testCaller.address)).rejects.toThrow(/the caller is not the signer/);
    await testMultiSign.connect(signers[2]).removeCaller(testCaller.address);

    await expect(testCaller.connect(signers[2]).writeDemo1(122)).rejects.toThrow(/caller not in whitelist/);
  }, 30_000);
});
