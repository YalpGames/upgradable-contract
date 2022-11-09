  //connnet mainToken Instance
import { log } from 'console';
import env, { ethers, upgrades,network,artifacts } from 'hardhat';
import { writeAbiAddr } from '../artifact_saver.js';
const fs = require('fs');

async function main() {

    const [admin, user] = await ethers.getSigners();
    console.log('admin: ', admin.address, 'user: ', user.address);
  
    // const deployNetwork  = network.name;
    // let contractName = `MainToken`;
    // let dir =  `deployments/dev/${deployNetwork}/${contractName}.json`;
    // const mainTokenAddress = JSON.parse(fs.readFileSync(dir)).address;
    // P12 0x2844B158Bcffc0aD7d881a982D464c0ce38d8086
    // p12 0x7154f7219F5E0F1EbF8C2dbBA1bCF8Fb36f2c5f3 p12TestNet
    const mainTokenAddress = "0x74Df809b1dfC099E8cdBc98f6a8D1F5c2C3f66f8";
    const ERC20 = await ethers.getContractFactory('MainToken');
    const mainToken = ERC20.attach(mainTokenAddress);
    //console.log(mainToken);
    console.log('mainToken address: ', mainToken.address);
    console.log('mainToken name: ', await mainToken.name());
    console.log('mainToken symbol: ', await mainToken.symbol());

    const userMainTokenBalance = await mainToken.balanceOf(user.address);
    const adminMainTokenBalance = await mainToken.balanceOf(admin.address);
    console.log(`user balance: ${ethers.utils.formatEther(userMainTokenBalance)}\n`);
    console.log(`admin balance: ${ethers.utils.formatEther(adminMainTokenBalance)}\n`);

    const blockNumber = await ethers.provider.getBlockNumber();
    const block = await ethers.provider.getBlock(blockNumber);
    console.log("blockNumber is: ",blockNumber);
    console.log(block);
    
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });