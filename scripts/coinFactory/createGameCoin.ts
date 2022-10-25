import { log } from 'console';
import env, { ethers, upgrades,network,artifacts } from 'hardhat';
import { writeAbiAddr,writeAbiAddrForAbi } from '../artifact_saver.js';
const fs = require('fs');
import * as compiledUniswapFactory from '@uniswap/v2-core/build/UniswapV2Factory.json';
import * as compiledUniswapRouter from '@uniswap/v2-periphery/build/UniswapV2Router02.json';
import * as compiledUniswapPair from '@uniswap/v2-core/build/UniswapV2Pair.json';

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

  //connect uniswap factory
  contractName = `uniswapV2Factory`;
  dir =  `deployments/dev/${deployNetwork}/${contractName}.json`;
  const uniswapV2FactoryAddress = JSON.parse(fs.readFileSync(dir)).address;
  const UNISWAPV2FACTORY = new ethers.ContractFactory(
    compiledUniswapFactory.interface,
    compiledUniswapFactory.bytecode,
    admin,
  );
  //const uniswapV2FACTORY = await ethers.getContractFactory('UniswapV2Factory');
  const uniswapV2Factory = UNISWAPV2FACTORY.attach(uniswapV2FactoryAddress);

  //connect uniswap router
  contractName = `uniswapV2Router02`;
  dir =  `deployments/dev/${deployNetwork}/${contractName}.json`;
  const uniswapV2Router02Address = JSON.parse(fs.readFileSync(dir)).address;
  const UNISWAPV2ROUTER = new ethers.ContractFactory(compiledUniswapRouter.abi, compiledUniswapRouter.bytecode, admin);
  //const uniswapV2ROUTER = await ethers.getContractFactory('UniswapV2Router02');
  const uniswapV2Router = UNISWAPV2ROUTER.attach(uniswapV2Router02Address);

  //connnet mainToken Instance
  contractName = `MainToken`;
  dir =  `deployments/dev/${deployNetwork}/${contractName}.json`;
  const mainTokenAddress = JSON.parse(fs.readFileSync(dir)).address;
  // P12 0x2844B158Bcffc0aD7d881a982D464c0ce38d8086
  // p12 0x7154f7219F5E0F1EbF8C2dbBA1bCF8Fb36f2c5f3 p12TestNet
  const ERC20 = await ethers.getContractFactory('MainToken');
  const mainToken = ERC20.attach(mainTokenAddress);
  const userMainTokenBalance = await mainToken.balanceOf(user.address);
  const adminMainTokenBalance = await mainToken.balanceOf(admin.address);
  console.log(`user balance: ${ethers.utils.formatEther(userMainTokenBalance)}\n`);
  console.log(`admin balance: ${ethers.utils.formatEther(adminMainTokenBalance)}\n`);

  //mint mainToken for user
  await mainToken.connect(admin).mint(user.address, 50000000n * 10n ** 18n);
  // p12 address 0x2844B158Bcffc0aD7d881a982D464c0ce38d8086
  const userMainTokenBalance2 = await mainToken.balanceOf(user.address);
  const adminMainTokenBalance2 = await mainToken.balanceOf(admin.address);
  console.log(`user balance: ${ethers.utils.formatEther(userMainTokenBalance2)}\n`);
  console.log(`admin balance: ${ethers.utils.formatEther(adminMainTokenBalance2)}\n`);

  /**
   * smapleProcess
   */

  //setDevloper address 
  await coinFactory.connect(admin).setDev(user.address);
  console.log("gameCoin dev address: ",await coinFactory.dev());
  //setMine
  contractName = `MineUpgradeable`;
  dir =  `deployments/dev/${deployNetwork}/${contractName}.json`;
  const MineUpgradeableAddress = JSON.parse(fs.readFileSync(dir)).address;
  await coinFactory.connect(admin).setMine(MineUpgradeableAddress);
  console.log("coinFactory mine address: ",await coinFactory.mine());

  //setGaugeController
  contractName = `GaugeControllerUpgradeable`;
  dir =  `deployments/dev/${deployNetwork}/${contractName}.json`;
  const GaugeControllerUpgradeableAddress = JSON.parse(fs.readFileSync(dir)).address;
  await coinFactory.connect(admin).setGaugeController(GaugeControllerUpgradeableAddress);
  console.log("coinFactory GaugeController address: ",await coinFactory.gaugeController());

  //GameCoin info
  const name = 'GameCoinTest003';
  const symbol = 'GC003';
  const gameId = '1003';
  const gameCoinIconUrl =
    'https://images.weserv.nl/?url=https://i0.hdslb.com/bfs/article/87c5b43b19d4065f837f54637d3932e680af9c9b.jpg';
  const amountGameCoin = BigInt(2000) * BigInt(10) ** 18n;
  const amountP12 = BigInt(100) * BigInt(10) ** 18n;
  
  //register
  await coinFactory.connect(admin).register(gameId, user.address);
  console.log("gameId =>address:",await coinFactory.allGames(gameId));

  //creat GameCoin
  await mainToken.connect(user).approve(coinFactory.address, amountP12);
  console.log("11111111111111111111111");
  const createInfo = await coinFactory.connect(user).create(name, symbol, gameId, gameCoinIconUrl, amountGameCoin, amountP12);

  let gameCoinAddress;
  // console.log("createInfo", createInfo);
  (await createInfo.wait()).events!.forEach((x:any) => {
    if (x.event === 'CreateGameCoin') {
      gameCoinAddress = x.args!.gameCoinAddress;
    }
  });
  console.log('gameCoinAddress is :', gameCoinAddress);

  // get pair
  const GAMECOINFACTORY = await ethers.getContractFactory('GameCoin');
  const gameCoin = await GAMECOINFACTORY.attach(String(gameCoinAddress));
  const pairAddress =  await uniswapV2Factory.getPair(gameCoinAddress,mainTokenAddress);

  const UNISWAPV2PAIR = new ethers.ContractFactory(compiledUniswapPair.abi, compiledUniswapPair.bytecode, admin);
  const uniswapV2Pair = await UNISWAPV2PAIR.attach(String(pairAddress));

  console.log('gameCoin address: ', gameCoinAddress);
  console.log('gameCoin name: ', await gameCoin.name());
  console.log('gameCoin symbol: ', await gameCoin.symbol());
  console.log('gameCoin gameId: ', await gameCoin.gameId());
  console.log('gameCoin Icon url: ', await gameCoin.gameCoinUrl());
  console.log('P12GameCoin Pair Address: ', pairAddress);
  //console.log('P12GameCoin Pair Reserves: ', await uniswapV2Pair.getReserves());
  console.log('gameCoin create successfully!');

   // set delay
   await coinFactory.connect(admin).setDelayK(1);
   await coinFactory.connect(admin).setDelayB(1);
   console.log('p12CoinFactory delay K: ', await coinFactory.delayK());
   console.log('p12CoinFactory delay B: ', await coinFactory.delayB());
   console.log('set delay variable successfully!');

  //储存部署信息在文件
  let artifact = {
    contractName:'GameCoin',
  };
  await writeAbiAddrForAbi(artifact, gameCoinAddress, network.name);

}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
