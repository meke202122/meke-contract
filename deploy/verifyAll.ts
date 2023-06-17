import { verify } from '../scripts/deploy-utils';


export async function verifyAll() {
  await verify("ContractReader");
  await verify("GlobalConfig");
  await verify("Exchange");
  await verify("Broker");
  await verify("Perpetual");
  await verify("Proxy");
  await verify("Funding");
  await verify("ChainlinkAdapter");
}

verifyAll();
