  //connnet mainToken Instance
  import env, { ethers, upgrades,network,artifacts } from 'hardhat';
import { utils } from 'mocha';
  import { writeAbiAddr } from '../artifact_saver.js';
  const fs = require('fs');
  
  async function main() {
  
      const [admin, user] = await ethers.getSigners();
      console.log('admin: ', admin.address, 'user: ', user.address);
    
      const deployNetwork  = network.name;
      let contractName = `MainToken`;
      let dir =  `deployments/dev/${deployNetwork}/${contractName}.json`;
      const mainTokenAddress = JSON.parse(fs.readFileSync(dir)).address;
      // P12 0x2844B158Bcffc0aD7d881a982D464c0ce38d8086
      // p12 0x7154f7219F5E0F1EbF8C2dbBA1bCF8Fb36f2c5f3 p12TestNet
      //const mainTokenAddress = "0x74Df809b1dfC099E8cdBc98f6a8D1F5c2C3f66f8";
      const ERC20 = await ethers.getContractFactory('MainToken');
      const MainToken = ERC20.attach(mainTokenAddress);

       contractName = `VotingEscrow`;
       dir =  `deployments/dev/${deployNetwork}/${contractName}.json`;
      const votingEscrowAddress = JSON.parse(fs.readFileSync(dir)).address;
      //console.log(mainToken);

      const VotingEscrowF = await ethers.getContractFactory('VotingEscrow');
      const votingEscrow = VotingEscrowF.attach(votingEscrowAddress);

      await MainToken.transfer(user.address, 100n * 10n ** 18n);
      console.log("user mainToken balance:",ethers.utils.formatEther(await MainToken.balanceOf(user.address)));
       
      //await MainToken.connect(user).approve(votingEscrow.address, 100n * 10n ** 18n);
      //votingEscrow.connect(user).createLock(100n * 10n ** 18n, 1689849796);
      const tx = await votingEscrow.locked(user.address);
      console.log(tx);
      const amount = tx.amount;
      console.log("loced amount: ",amount);

  }
  
  main().catch((error) => {
      console.error(error);
      process.exitCode = 1;
    });