import env, { ethers, upgrades,network,artifacts } from 'hardhat';
import { writeAbiAddr } from '../artifact_saver.js';
const fs = require('fs');

async function main() {
  // let admin: SignerWithAddress;
  // let user: SignerWithAddress;
  const [admin, user] = await ethers.getSigners();
  console.log('admin: ', admin.address, 'user: ', user.address);

  const deployNetwork  = network.name;
  let contractName = `CoinFactoryUpgradeable`;
  let dir =  `deployments/dev/${deployNetwork}/${contractName}.json`;
  const FactoryAddress = JSON.parse(fs.readFileSync(dir)).address;

  contractName = `GameCoin`;
  dir =  `deployments/dev/${deployNetwork}/${contractName}.json`;
  const gameCoinAddress = JSON.parse(fs.readFileSync(dir)).address;

 // const FactoryAddress = '0xDEC0EAB90159aE6E63485d2BE0765fb274Fe9a59';
 // const gameCoinAddress = '0xDd97F6b1C83E28159bBf6a152559Ad5DfDdBd025';

  const GameCoinFactory = await ethers.getContractFactory('GameCoin');
  const GameCoin = await GameCoinFactory.attach(gameCoinAddress);

  const amountGameCoin = 1n * 10n ** 18n;
  const userId = '123';
  await GameCoin.connect(admin).approve(FactoryAddress, amountGameCoin);
  await GameCoin.connect(admin).transferWithAccount(FactoryAddress, userId, amountGameCoin);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
