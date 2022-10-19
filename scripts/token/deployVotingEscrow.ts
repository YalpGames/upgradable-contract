import { log } from 'console';
import { ethers,network, artifacts} from 'hardhat';
const fs = require('fs');
import { writeAbiAddr } from '../artifact_saver.js';

async function main() {
    const contractName = `MainToken`;
    const deployNetwork  = network.name;
    const dir =  `deployments/dev/${deployNetwork}/${contractName}.json`;
    const MainToken = JSON.parse(fs.readFileSync(dir)).address;
    console.log(MainToken);
    const VotingEscrow = await ethers.getContractFactory('VotingEscrow');
    const votingEscrow = await VotingEscrow.deploy(MainToken, 'Vote-escrowed', 'VE');
    console.log('VotingEscrow contract', votingEscrow.address);
    //储存部署信息在文件
    let artifact = await artifacts.readArtifact('VotingEscrow');
    await writeAbiAddr(artifact, votingEscrow.address, 'VotingEscrow', network.name);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
