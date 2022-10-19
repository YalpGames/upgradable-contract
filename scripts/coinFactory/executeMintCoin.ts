import env, { ethers, upgrades,network,artifacts } from 'hardhat';
import { writeAbiAddr } from '../artifact_saver.js';
const fs = require('fs');

async function main() {
  const [admin, user] = await ethers.getSigners();
  console.log('admin: ', admin.address, 'user: ', user.address);

  const deployNetwork  = network.name;
  let contractName = `CoinFactoryUpgradeable`;
  let dir =  `deployments/dev/${deployNetwork}/${contractName}.json`;
  const coinFactoryUpgradeableAddress = JSON.parse(fs.readFileSync(dir)).address;

  const COINFACTORY = await ethers.getContractFactory('CoinFactoryUpgradeable');
  const coinFactory = await COINFACTORY.attach(coinFactoryUpgradeableAddress);

  contractName = `MainToken`;
  dir =  `deployments/dev/${deployNetwork}/${contractName}.json`;
  const mainTokenAddress = JSON.parse(fs.readFileSync(dir)).address;
  // P12 0x2844B158Bcffc0aD7d881a982D464c0ce38d8086
  // p12 0x7154f7219F5E0F1EbF8C2dbBA1bCF8Fb36f2c5f3 p12TestNet
  const ERC20 = await ethers.getContractFactory('MainToken');
  const mainToken = ERC20.attach(mainTokenAddress);

  // mint
  const amountGameCoin = BigInt(10) * BigInt(10) ** 18n;
  const amountP12 = BigInt(10) * BigInt(10) ** 18n;

  contractName = `GameCoin`;
  dir =  `deployments/dev/${deployNetwork}/${contractName}.json`;
  const gameCoinAddress = JSON.parse(fs.readFileSync(dir)).address;
  
  await mainToken.connect(user).approve(coinFactory.address, amountP12);
  console.log('mint delay', await coinFactory.getMintDelay(gameCoinAddress, amountGameCoin));

  //  //正常监听transfer事件
  coinFactory.on("QueueMintCoin",(mintId,gameCoinAddress, mintAmount, unlockTimestamp, amount)=>{
      console.log(` QueueMintCoin mintId:${mintId}, gameCoinAddress: ${gameCoinAddress},mintAmount:${mintAmount}`);
      coinFactory.executeMintCoin(mintId);
    });

  await coinFactory.connect(user).queueMintCoin('1001', gameCoinAddress, amountGameCoin);
 
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
