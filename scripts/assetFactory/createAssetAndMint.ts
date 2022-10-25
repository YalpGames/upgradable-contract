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
  
  contractName = `collection`;
  dir =  `deployments/dev/${deployNetwork}/${contractName}.json`;
  const collectionAddr = JSON.parse(fs.readFileSync(dir)).address;

  //const collectionAddr = '0xF60C0C3fA68387f05D2A5F7e6BA468fAaDB0dd62';

  const assetFactory = await ethers.getContractAt('AssetFactoryUpgradable', assetFactoryUpgradableAddress);

  const tx = await assetFactory.connect(developer).createAssetAndMint(
    collectionAddr,
    110,
    /* cSpell:disable */
    'ipfs://QmVZMakUubEr5Gaa5DAcunMjCWj5pkUMXav21bS7DTjySQ',
  );

  let tokenId;
  (await tx.wait()).events.forEach((x:any) => {
    if (x.event === 'SftCreated') {
      tokenId = x.args.tokenId;
    }
  });

  console.log("tokenId: ",tokenId);
  const asset = await ethers.getContractAt('Asset', collectionAddr);
  console.log("asset amount: ",await asset.supply(tokenId));

}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
