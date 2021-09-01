import { ethers, getNamedAccounts } from "hardhat"
import chai from "chai"
import { solidity } from "ethereum-waffle"
import { TestGlobalConfig__factory } from "../typechain"

chai.use(solidity)
const { expect } = chai

describe("TestGlobalConfig", async () => {
    let contractAddress: string

    beforeEach(async () => {
        const [deployer] = await ethers.getSigners()
        let testGlobalConfigFactory = new TestGlobalConfig__factory(deployer)
        let testGlobalConfigContract = await testGlobalConfigFactory.deploy()
        await testGlobalConfigContract.setUp()
        contractAddress = testGlobalConfigContract.address
    })

    it("add broker", async () => {
        const [deployer] = await ethers.getSigners()

        let contractInstance = new TestGlobalConfig__factory(deployer).attach(contractAddress)
        await contractInstance.addBroker()
    })
})
