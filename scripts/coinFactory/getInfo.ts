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

    contractName = `GameCoin`;
    dir =  `deployments/dev/${deployNetwork}/${contractName}.json`;
    const gameCoinAddress = JSON.parse(fs.readFileSync(dir)).address;

    const gameId = await coinFactory.allGameCoins(gameCoinAddress);
    const developer = await coinFactory.allGames(gameId);
    console.log('gameId', gameId);
    console.log('developer address', developer);

    contractName = `MainToken`;
    dir =  `deployments/dev/${deployNetwork}/${contractName}.json`;
    const mainTokenAddress = JSON.parse(fs.readFileSync(dir)).address;
    // P12 0x2844B158Bcffc0aD7d881a982D464c0ce38d8086
    // p12 0x7154f7219F5E0F1EbF8C2dbBA1bCF8Fb36f2c5f3 p12TestNet
    const ERC20 = await ethers.getContractFactory('MainToken');
    const mainToken = ERC20.attach(mainTokenAddress);
    console.log(`mainTokenAddress: ${mainTokenAddress}, coinFactoryAddress: ${coinFactoryUpgradeableAddress}`);

    const nameToken = await mainToken.name();
    const symbol = await mainToken.symbol();
    const totalSupply = await mainToken.totalSupply();

    console.log("\n1. read mainToken Info");
    console.log(`address: ${mainTokenAddress}`);
    console.log(`name: ${nameToken}`);
    console.log(`symbol: ${symbol}`);
    console.log(`totalSupply: ${ethers.utils.formatEther(totalSupply)}`);

    const userMainTokenBalance = await mainToken.balanceOf(user.address);
    const adminMainTokenBalance = await mainToken.balanceOf(admin.address);
    console.log(`user balance: ${ethers.utils.formatEther(userMainTokenBalance)}\n`);
    console.log(`admin balance: ${ethers.utils.formatEther(adminMainTokenBalance)}\n`);

}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
