import { ethers , network, artifacts} from 'hardhat';
import { writeAbiAddr } from '../artifact_saver.js';
import * as compiledUniswapFactory from '@uniswap/v2-core/build/UniswapV2Factory.json';
import * as compiledUniswapRouter from '@uniswap/v2-periphery/build/UniswapV2Router02.json';
const fs = require('fs');

async function main() {
    let weth;
    if (network.name === 'hardhat') {
         weth = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2'; //eth mainner
    }else if(network.name === 'localhost'){
      const deployNetwork  = network.name;
      let contractName = `WETH9`;
      let dir =  `deployments/dev/${deployNetwork}/${contractName}.json`;
      weth = JSON.parse(fs.readFileSync(dir)).address;
    }

    const admin = (await ethers.getSigners())[0];
    console.log('admin: ',admin.address,'weth address: ',weth);

    // deploy uniswap
    const UNISWAPV2ROUTER = new ethers.ContractFactory(compiledUniswapRouter.abi, compiledUniswapRouter.bytecode, admin);
    const UNISWAPV2FACTORY = new ethers.ContractFactory(
      compiledUniswapFactory.interface,
      compiledUniswapFactory.bytecode,
      admin,
    );
    const uniswapV2Factory = await UNISWAPV2FACTORY.connect(admin).deploy(admin.address);

    const uniswapV2Router02 = await UNISWAPV2ROUTER.connect(admin).deploy(uniswapV2Factory.address, weth);

    console.log('uniswapV2Factory: ', uniswapV2Factory.address, 'uniswapV2Router: ', uniswapV2Router02.address);
    //储存部署信息在文件
    let artifact = {
        contractName:'uniswapV2Factory',
        abi:compiledUniswapFactory.interface
    };
    await writeAbiAddr(artifact, uniswapV2Factory.address, 'uniswapV2Factory', network.name);
      
    let artifact2 = {
        contractName:'uniswapV2Router02',
        abi:compiledUniswapRouter.abi
    };
    await writeAbiAddr(artifact2, uniswapV2Router02.address, 'uniswapV2Router02', network.name);
    
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
