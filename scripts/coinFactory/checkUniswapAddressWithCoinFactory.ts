import env, { ethers, upgrades,network,artifacts } from 'hardhat';
import { writeAbiAddr } from '../artifact_saver.js';
const fs = require('fs');
import * as compiledUniswapFactory from '@uniswap/v2-core/build/UniswapV2Factory.json';
import * as compiledUniswapRouter from '@uniswap/v2-periphery/build/UniswapV2Router02.json';
import * as compiledUniswapPair from '@uniswap/v2-core/build/UniswapV2Pair.json';


async function main() {
    const [admin, user] = await ethers.getSigners();
    console.log('admin: ', admin.address, 'user: ', user.address);

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
    

    // get pair
    const UNISWAPV2FACTORY = new ethers.ContractFactory(
      compiledUniswapFactory.interface,
      compiledUniswapFactory.bytecode,
      admin,
    );
    const uniswapV2Factory =  await UNISWAPV2FACTORY.attach(await coinFactory.uniswapFactory());
    //const GAMECOINFACTORY = await ethers.getContractFactory('GameCoin');
    const gameCoinAddress = "0x6EdC350E995834F4af6d76D74732a496E991CaEF";
    const mainTokenAddress = "0x4DAf17c8142A483B2E2348f56ae0F2cFDAe22ceE";
    const pairAddress =  await uniswapV2Factory.getPair(gameCoinAddress,mainTokenAddress);
    const UNISWAPV2PAIR = new ethers.ContractFactory(compiledUniswapPair.abi, compiledUniswapPair.bytecode, admin);
    const uniswapV2Pair = await UNISWAPV2PAIR.attach(String(pairAddress));

    console.log( pairAddress);
    const [_reserve0, _reserve1, _blockTimestampLast] = await uniswapV2Pair.getReserves();
    console.log('P12GameCoin Pair Reserves0: ',_reserve0 ,"Reserves1: ",_reserve1,"TimestampLast:",_blockTimestampLast);
    console.log('gameCoin create successfully!');

}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
