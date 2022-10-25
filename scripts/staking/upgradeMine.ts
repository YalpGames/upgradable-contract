// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
import env, { ethers, upgrades, artifacts, network } from 'hardhat';
import { writeAbiAddr } from '../artifact_saver.js';
const fs = require('fs');

async function main() {

    const MineUpgradeableF = await ethers.getContractFactory('MineUpgradeable');

    const deployNetwork  = network.name;
    let contractName = `MineUpgradeable`;
    let dir =  `deployments/dev/${deployNetwork}/${contractName}.json`;
    const proxyAddr = JSON.parse(fs.readFileSync(dir)).address;

    // const p12Token = '0xeAc1F044C4b9B7069eF9F3eC05AC60Df76Fe6Cd0';
    // const uniswapV2Factory = '0x8C2543578eFEd64343C63e9075ed70F1d255D1c6';
    // const uniswapV2Router = '0x71A3B75A9A774EB793A44a36AF760ee2868912ac';
    await upgrades.upgradeProxy(proxyAddr, MineUpgradeableF);

    console.log('proxy contract', proxyAddr);

    //储存部署信息在文件
    await writeAbiAddr(artifacts, proxyAddr, 'MineUpgradeable', network.name);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
