import env, { ethers, upgrades,network,artifacts } from 'hardhat';
import { writeAbiAddr } from '../artifact_saver.js';
const fs = require('fs');

async function main() {

    const deployNetwork  = network.name;
    let contractName = `CoinFactoryUpgradeable`;
    let dir =  `deployments/dev/${deployNetwork}/${contractName}.json`;
    const coinFactoryUpgradeableAddress = JSON.parse(fs.readFileSync(dir)).address;

    const coinFactoryUpgradeableFactory = await ethers.getContractFactory('CoinFactoryUpgradeable');
    const coinFactory = await coinFactoryUpgradeableFactory.attach(
        coinFactoryUpgradeableAddress, // 0x0CE1Eb4f32b5CFEeDDb375341175C81709716Cf7 p12TestNet
      );
      // 0x839A28f16c5ebFA8E4693e9b068325477E7f268B 1.17
      // 0xfeDb5e3a2783D4aB876f262d5eD522CD13d3559E 1.18
      // check uniswapRouter , uniswapFactory
    
    console.log('uniswap router address', await coinFactory.uniswapRouter());
    console.log('uniswap factory address', await coinFactory.uniswapFactory());
    
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
