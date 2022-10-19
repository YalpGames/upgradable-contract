import env, { ethers, upgrades,network, artifacts} from 'hardhat';
import { writeAbiAddr } from '../artifact_saver.js';
const fs = require('fs');

async function main() {
  
  const deployNetwork  = network.name;
  let contractName = `VotingEscrow`;
  let dir =  `deployments/dev/${deployNetwork}/${contractName}.json`;
  const votingEscrow = JSON.parse(fs.readFileSync(dir)).address;

   contractName = `CoinFactoryUpgradeable`;
   dir =  `deployments/dev/${deployNetwork}/${contractName}.json`;
  const p12CoinFactory = JSON.parse(fs.readFileSync(dir)).address;

  const GaugeController = await ethers.getContractFactory('GaugeControllerUpgradeable');
  const gaugeController = await upgrades.deployProxy(GaugeController, [votingEscrow, p12CoinFactory]);
  console.log('gaugeController contract', gaugeController.address);
  // 0x7d1a5e173996F2926e710E60C5361A3506502BB6
  //储存部署信息在文件
  let artifact = await artifacts.readArtifact('GaugeControllerUpgradeable');
  await writeAbiAddr(artifact, gaugeController.address, 'GaugeControllerUpgradeable', network.name);
  
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
