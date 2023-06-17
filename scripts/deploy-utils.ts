import path from "path";
import { mkdir, writeFile, readFile } from "fs/promises";
import hardhat, { network } from "hardhat";
import { ContractFactory } from "ethers";

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
  const file = path.join(dir, name + ".json");
  await writeFile(file, JSON.stringify(data));
}

export async function readDeployment(name: string, network = hardhat.network) {
  const dir = path.join("deployments", network.name);
  const data = await readFile(path.join(dir, name + ".json"), "utf-8");
  return JSON.parse(data) as Deployment;
}

export async function getDeployedConstract<T extends ContractFactory>(name:string){
  const {address}=await readDeployment(name)
  const factory = (await hardhat.ethers.getContractFactory(name)) as T;
  return factory.attach(address) as ReturnType<T['attach']>
}

export async function verify(name: string, network = hardhat.network) {
  if (network.name !== "hardhat") {
    const { address, args } = await readDeployment(name, network);
    console.log(`-- verify ${name} ${address} --`)
    return await hardhat.run("verify:verify", {
      address,
      constructorArguments: args,
    });
  }
}

export async function delay(timeoutMs:number){
  return new Promise((resolve)=>{
    setTimeout(resolve,timeoutMs)
  })
}

export async function deploy<T extends ContractFactory>(name: string, ...args: Parameters<T["deploy"]>) {
  const factory = (await hardhat.ethers.getContractFactory(name)) as T;
  const isForce = false;
  const skipVerify = false;
  const forceSave = true;

  if (!isForce && network.name !== 'hardhat') {
    const deployment = await readDeployment(name).catch(() => undefined);
    if (deployment) {
      if (JSON.stringify(deployment.args) === JSON.stringify(args)) {
        console.log(`used cached ${name} at ${deployment.address}`)
        return factory.attach(deployment.address) as ReturnType<T['deploy']>;
      }
    }
  }

  const contract = await factory.deploy(...args);
  console.log(`deployed ${name} at ${contract.address} on ${hardhat.network.name}[${hardhat.network.config.chainId}]`);
  if (network.name !== "hardhat" || forceSave) {
    await saveDeployment(name, contract.address, args);
    if (network.name !== "hardhat" && !skipVerify) {
      await contract.deployTransaction.wait(1);
      await verify(name, network).catch(err => console.warn(`${name} Verify Error: ${err.message}`));
    }
  }
  return contract as ReturnType<T["deploy"]>;
}
