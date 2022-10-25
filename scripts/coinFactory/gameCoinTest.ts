import { log } from 'console';
import { copyFileSync } from 'fs';
import env, { ethers, upgrades,network,artifacts } from 'hardhat';
import { writeAbiAddr } from '../artifact_saver.js';
const fs = require('fs');

async function main() {

    const [admin, user] = await ethers.getSigners();
    console.log('admin: ', admin.address, 'user: ', user.address);
  
    const deployNetwork  = network.name;

    //connect coinfactory Instance
    let contractName = `CoinFactoryUpgradeable`;
    let dir =  `deployments/dev/${deployNetwork}/${contractName}.json`;
    const coinFactoryUpgradeableAddress = JSON.parse(fs.readFileSync(dir)).address;
    const COINFACTORY = await ethers.getContractFactory('CoinFactoryUpgradeable');
    const coinFactory = COINFACTORY.attach(coinFactoryUpgradeableAddress);

    contractName = `MainToken`;
    dir =  `deployments/dev/${deployNetwork}/${contractName}.json`;
    const mainTokenAddress = JSON.parse(fs.readFileSync(dir)).address;
    // P12 0x2844B158Bcffc0aD7d881a982D464c0ce38d8086
    // p12 0x7154f7219F5E0F1EbF8C2dbBA1bCF8Fb36f2c5f3 p12TestNet
    const ERC20 = await ethers.getContractFactory('MainToken');
    const mainToken = ERC20.attach(mainTokenAddress);

    //get balance
    const userMainTokenBalance = await mainToken.balanceOf(user.address);
    const adminMainTokenBalance = await mainToken.balanceOf(admin.address);
    console.log(`user balance: ${ethers.utils.formatEther(userMainTokenBalance)}\n`);
    console.log(`admin balance: ${ethers.utils.formatEther(adminMainTokenBalance)}\n`);

    //GameCoin info
    const name = 'GameCoinTest001';
    const symbol = 'GC001';
    const gameId = '1001';
    const gameCoinIconUrl =
        'https://images.weserv.nl/?url=https://i0.hdslb.com/bfs/article/87c5b43b19d4065f837f54637d3932e680af9c9b.jpg';
    const amountGameCoin = BigInt(2000) * BigInt(10) ** 18n;
    const amountP12 = BigInt(100) * BigInt(10) ** 18n;
    //creat GameCoin
    await mainToken.connect(user).approve(coinFactory.address, amountP12);
    console.log("mainTokenAddress: ",mainToken.address);
    console.log("coinFactory address: ",await coinFactory.mainCoin());

    console.log("11111111111111111111111");
    const createInfo = await coinFactory.connect(user).create(name, symbol, gameId, gameCoinIconUrl, amountGameCoin, amountP12);

    let gameCoinAddress;
    (await createInfo.wait()).events!.forEach((x:any) => {
      if (x.event === 'CreateGameCoin') {
        console.log(x.args!);
        gameCoinAddress = x.args!.gameCoinAddress;
      }
    });
    console.log('gameCoinAddress is :', gameCoinAddress);
}


main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
  