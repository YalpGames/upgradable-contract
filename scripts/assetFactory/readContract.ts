import env, { ethers, upgrades,network,artifacts } from 'hardhat';
const fs = require('fs');

async function main() {
  const developer = (await ethers.getSigners())[1];

  const deployNetwork  = network.name;
  let contractName = `AssetFactoryUpgradable`;
  let dir =  `deployments/dev/${deployNetwork}/${contractName}.json`;
  const assetFactoryUpgradableAddress = JSON.parse(fs.readFileSync(dir)).address;

  const AssetFactory = await ethers.getContractAt('AssetFactoryUpgradable', assetFactoryUpgradableAddress);
  console.log('AssetFactory: ', AssetFactory.address);

  contractName = `CoinFactoryUpgradeable`;
  dir =  `deployments/dev/${deployNetwork}/${contractName}.json`;
  const coinFactoryStorageAddress = JSON.parse(fs.readFileSync(dir)).address;
  const coinFactory = await ethers.getContractAt('CoinFactoryUpgradeable', coinFactoryStorageAddress);

  console.log(await coinFactory.allGames('1001'));
  console.log(developer.address);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
