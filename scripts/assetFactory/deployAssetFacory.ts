// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
import env, { ethers, upgrades,network,artifacts } from 'hardhat';
import { writeAbiAddr } from '../artifact_saver.js';
const fs = require('fs');

async function main() {

  const developer = (await ethers.getSigners())[0];
  console.log('developer: ', developer.address);

  const deployNetwork  = network.name;
  let contractName = `CoinFactoryUpgradeable`;
  let dir =  `deployments/dev/${deployNetwork}/${contractName}.json`;
  const coinFactoryUpgradeableAddress = JSON.parse(fs.readFileSync(dir)).address;

  const assetFactoryUpgradableFatory = await ethers.getContractFactory('AssetFactoryUpgradable');
  const assetFactoryAddr = await upgrades.deployProxy(assetFactoryUpgradableFatory, [coinFactoryUpgradeableAddress], {
    kind: 'uups',
  });
  const assetFactory = await ethers.getContractAt('AssetFactoryUpgradable', assetFactoryAddr.address);
  console.log('p12AssetFactory proxy: ', assetFactory.address);

  //储存部署信息在文件
  let artifact = await artifacts.readArtifact('AssetFactoryUpgradable');
  await writeAbiAddr(artifact, assetFactory.address, 'AssetFactoryUpgradable', network.name);
        
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
