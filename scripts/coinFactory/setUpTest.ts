import { ethers,network } from 'hardhat';
const fs = require('fs');

async function main() {
    const [admin, user] = await ethers.getSigners();
    console.log('admin: ', admin.address, '\n user: ', user.address);
    
    const deployNetwork  = network.name;
    //connect coinfactory Instance
    let contractName = `CoinFactoryUpgradeable`;
    let dir =  `deployments/dev/${deployNetwork}/${contractName}.json`;
    const coinFactoryUpgradeableAddress = JSON.parse(fs.readFileSync(dir)).address;
    const COINFACTORY = await ethers.getContractFactory('CoinFactoryUpgradeable');
    const coinFactory = COINFACTORY.attach(coinFactoryUpgradeableAddress);

    //setDev
    await coinFactory.connect(admin).setDev(user.address);
    console.log("gameCoin dev address: ",await coinFactory.dev());

    //setMine
    contractName = `MineUpgradeable`;
    dir =  `deployments/dev/${deployNetwork}/${contractName}.json`;
    const MineUpgradeableAddress = JSON.parse(fs.readFileSync(dir)).address;
    await coinFactory.connect(admin).setMine(MineUpgradeableAddress);
    console.log("coinFactory min address: ",await coinFactory.mine());
    
    //setGaugeController
    contractName = `GaugeControllerUpgradeable`;
    dir =  `deployments/dev/${deployNetwork}/${contractName}.json`;
    const GaugeControllerUpgradeableAddress = JSON.parse(fs.readFileSync(dir)).address;
    await coinFactory.connect(admin).setGaugeController(GaugeControllerUpgradeableAddress);
    console.log("coinFactory GaugeController address: ",await coinFactory.gaugeController());
    
    await coinFactory.connect(admin).setDelayK(60);
    await coinFactory.connect(admin).setDelayB(60);
    console.log("delayK: ",await coinFactory.delayK(),"delayB: ",await coinFactory.delayK());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
