import env, { ethers, upgrades,network,artifacts } from 'hardhat';
import { writeAbiAddr } from '../artifact_saver.js';
const fs = require('fs');

async function main() {

    const deployNetwork  = network.name;
    let contractName = `CoinFactoryUpgradeable`;
    let dir =  `deployments/dev/${deployNetwork}/${contractName}.json`;
    const proxyAddr = JSON.parse(fs.readFileSync(dir)).address;

    const P12CoinFactoryUpgradeableF = await ethers.getContractFactory('CoinFactoryUpgradeable');
   // const proxyAddr = '0x3288095c0033E33DcD25bf2cf439B848b45DFB70';

    // const p12Token = '0xeAc1F044C4b9B7069eF9F3eC05AC60Df76Fe6Cd0';
    // const uniswapV2Factory = '0x8C2543578eFEd64343C63e9075ed70F1d255D1c6';
    // const uniswapV2Router = '0x71A3B75A9A774EB793A44a36AF760ee2868912ac';
    await upgrades.upgradeProxy(proxyAddr, P12CoinFactoryUpgradeableF);

    console.log('proxy contract', proxyAddr);
    //储存部署信息在文件
    await writeAbiAddr(artifacts, proxyAddr, 'CoinFactoryUpgradeable', network.name);
    
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
