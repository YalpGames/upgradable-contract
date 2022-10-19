import env, { ethers, upgrades,network,artifacts } from 'hardhat';
import { writeAbiAddr } from '../artifact_saver.js';
const fs = require('fs');

async function main() {

    const deployNetwork  = network.name;
    let contractName = `MainToken`;
    let dir =  `deployments/dev/${deployNetwork}/${contractName}.json`;
    const mainToken = JSON.parse(fs.readFileSync(dir)).address;

    contractName = `uniswapV2Factory`;
    dir =  `deployments/dev/${deployNetwork}/${contractName}.json`;
    const uniswapV2Factory = JSON.parse(fs.readFileSync(dir)).address;

    contractName = `uniswapV2Router02`;
    dir =  `deployments/dev/${deployNetwork}/${contractName}.json`;
    const uniswapV2Router = JSON.parse(fs.readFileSync(dir)).address;;

    const coinFactoryUpgradeableFactory = await ethers.getContractFactory('CoinFactoryUpgradeable');
    const coinFactoryUpgradeable = await upgrades.deployProxy(
      coinFactoryUpgradeableFactory,
      [mainToken, uniswapV2Factory, uniswapV2Router, 86400, ethers.utils.randomBytes(32)],
      { kind: 'uups' },
    );
    console.log('proxy contract', coinFactoryUpgradeable.address);

      //储存部署信息在文件
  let artifact = await artifacts.readArtifact('CoinFactoryUpgradeable');
  await writeAbiAddr(artifact, coinFactoryUpgradeable.address, 'CoinFactoryUpgradeable', network.name);
  
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
