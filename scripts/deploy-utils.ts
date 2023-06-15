import path from "path";
import { mkdir, writeFile, readFile } from "fs/promises";
import hardhat, { network } from "hardhat";
import { Contract } from "ethers";

export interface Deployment {
  network: string;
  chainId?: number;
  name: string;
  address: string;
  args: any[];
}

export async function saveDeployment(name: string, address: string, args: any[] = [], network = hardhat.network) {
  const data: Deployment = {
    network: network.name,
    chainId: network.config.chainId,
    name,
    address,
    args,
  };
  const dir = path.join("deployments", network.name);
  await mkdir(dir, { recursive: true }).catch(() => void 0);
  await writeFile(path.join(dir, name + ".json"), JSON.stringify(data));
}

export async function readDeployment(name: string, network = hardhat.network) {
  const dir = path.join("deployments", network.name);
  const data = await readFile(path.join(dir, name + ".json"), "utf-8");
  return JSON.parse(data) as Deployment;
}

export async function verify(name: string, network = hardhat.network) {
  if (network.name !== "hardhat") {
    const { address, args } = await readDeployment(name, network);
    return await hardhat.run("verify:verify", {
      address,
      constructorArguments: args,
    });
  }
}

export async function deploy<T extends Contract>(name: string, ...args: any[]) {
  const contract = await (await hardhat.ethers.getContractFactory(name)).deploy(...args);
  console.log(`deployed ${name} at ${contract.address} on ${hardhat.network.name}[${hardhat.network.config.chainId}]`);
  if (network.name !== "hardhat") {
    await saveDeployment(name, contract.address, args);
    await contract.deployTransaction.wait(2);
    await verify(name, network);
  }
  return contract as T;
}
