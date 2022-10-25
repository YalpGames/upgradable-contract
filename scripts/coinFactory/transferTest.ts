  //creat GameCoin
import  { ethers, upgrades,network,artifacts } from 'hardhat';
const fs = require('fs');

async function main() {

const[admin,user,user2] = await ethers.getSigners();

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

const amountGameCoin = BigInt(2000) * BigInt(10) ** 18n;
const amountP12 = BigInt(100) * BigInt(10) ** 18n;

console.log(`user balance: ${ethers.utils.formatEther(await mainToken.balanceOf(user.address))}\n`);
console.log(`admin balance: ${ethers.utils.formatEther(await mainToken.balanceOf(admin.address))}\n`);

await mainToken.connect(user).approve(user2.address, amountP12);
await mainToken.connect(user2).transferFrom(user.address,coinFactory.address,amountP12);
console.log(`admin balance: ${ethers.utils.formatEther(await mainToken.balanceOf(coinFactory.address))}\n`);

}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});

  