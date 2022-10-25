import env, { ethers, upgrades, artifacts, network } from 'hardhat';
import { writeAbiAddr } from '../artifact_saver.js';
const fs = require('fs');

async function main() {

    const deployNetwork  = network.name;
    let contractName = `MainToken`;
    let dir =  `deployments/dev/${deployNetwork}/${contractName}.json`;
    const mainToken = JSON.parse(fs.readFileSync(dir)).address;

    contractName = `CoinFactoryUpgradeable`;
    dir =  `deployments/dev/${deployNetwork}/${contractName}.json`;
    const coinFactory = JSON.parse(fs.readFileSync(dir)).address;

    contractName = `GaugeControllerUpgradeable`;
    dir =  `deployments/dev/${deployNetwork}/${contractName}.json`;
    const gaugeController = JSON.parse(fs.readFileSync(dir)).address;
   
    // contractName = `VotingEscrow`;
    // dir =  `deployments/dev/${deployNetwork}/${contractName}.json`;
    // const votingEscrow = JSON.parse(fs.readFileSync(dir)).address;
  
    const delayK = 60;
    const delayB = 60;
    const rate = 5n * 10n ** 17n;

    const MineUpgradeable = await ethers.getContractFactory('MineUpgradeable');
    const mineUpgradeable = await upgrades.deployProxy(
      MineUpgradeable,
      [mainToken, coinFactory, gaugeController, delayK, delayB, rate],
      {
        kind: 'uups',
      },
    );
    console.log('p12 Mine proxy contract', mineUpgradeable.address);

    //储存部署信息在文件
    let artifact = await artifacts.readArtifact('MineUpgradeable');
    await writeAbiAddr(artifact, mineUpgradeable.address, 'MineUpgradeable', network.name);
    
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
