

import { ethers,network } from 'hardhat';
import "@nomiclabs/hardhat-ethers";
import fs from 'fs';

const testFork = async () => {
    const signer = await ethers.getSigner("0x1fDEbC31fC4f006A3ECb1f0D62f6A2F1BFAeA909")
    const balance = await signer.getBalance();
    console.log(`my waller eth balance: ${ethers.utils.formatEther(balance)} ETH`);
    console.log(`env.network.name: ${network.name}`);
}

testFork()
.then(() => process.exit(0))
.catch((error) => {
  console.error(error);
  process.exit(1);
});
