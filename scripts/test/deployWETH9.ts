import { ethers ,artifacts,network} from 'hardhat';
import { writeAbiAddr } from '../artifact_saver.js';

async function main() {
    if(network.name === 'localhost'){
        const WETH9 = await ethers.getContractFactory('WETH9');
        const weth9 = await WETH9.deploy();
        await weth9.deployed();
    
        console.log('weth9 address : ', weth9.address);
        //储存部署信息在文件
        let artifact = await artifacts.readArtifact('WETH9');
        await writeAbiAddr(artifact, weth9.address, 'WETH9', network.name);
    }else{
        console.log(`network not is localhost :it is : ${network.name}`);
    }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
