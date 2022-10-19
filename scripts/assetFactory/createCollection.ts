// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
import env, { ethers, upgrades,network,artifacts } from 'hardhat';
import { writeAbiAddr } from '../artifact_saver.js';
const fs = require('fs');

async function main() {
  const developer = (await ethers.getSigners())[1];

  const deployNetwork  = network.name;
  let contractName = `AssetFactoryUpgradable`;
  let dir =  `deployments/dev/${deployNetwork}/${contractName}.json`;
  const assetFactoryUpgradableAddress = JSON.parse(fs.readFileSync(dir)).address;

  const assetFactory = await ethers.getContractAt('AssetFactoryUpgradable', assetFactoryUpgradableAddress);

  /* cSpell:disable */
  const collectionAddress = await assetFactory.connect(developer).createCollection('1001', 'ipfs://QmU9qevD5dbj4Mpret5ZqYL2FWh8yov2tZmAFgRNBkBjCA');

  let artifact2 = {
    contractName:'collection',
    abi:''
  };

  await writeAbiAddr(artifact2, collectionAddress, 'collection', network.name);

}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
