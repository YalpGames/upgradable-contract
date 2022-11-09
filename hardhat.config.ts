import "@nomiclabs/hardhat-waffle";
import "@nomiclabs/hardhat-ethers";
import '@typechain/hardhat';
import { task } from "hardhat/config";
import '@openzeppelin/hardhat-upgrades';
require("dotenv").config({ path: "./hardhat-tutorial.env" });
//import 'hardhat-deploy';


const ETH_MAINNER_API_KEY_URL = process.env.ETH_MAINNER_API_KEY_URL;

const POLYGON_API_KEY_URL = process.env.POLYGON_API_KEY_URL;
const POLYGON_PRIVATE_KEY = process.env.POLYGON_PRIVATE_KEY;

const GOERLI_API_KEY_URL = process.env.GOERLI_API_KEY_URL;
const GOERLI_PRIVATE_KEY = process.env.GOERLI_PRIVATE_KEY;

const ETHERSCAN_KEY = process.env.ETHERSCAN_KEY;

// This is a sample Hardhat task. To learn how to create your own go to
// https://hardhat.org/guides/create-task.html
task("accounts", "Prints the list of accounts", async (taskArgs, hre) => {
  const accounts = await hre.ethers.getSigners();

  for (const account of accounts) {
    console.log(account.address);
  }
});

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  solidity: {
    compilers: [
      {
        version: "0.8.14",
        settings: { optimizer: { 
          enabled: true,
          runs: 200, 
         },}
      },
      {
        version: "0.8.4",
        settings: { optimizer: { 
          enabled: true,
          runs: 200, 
         },}
      },
      {
        version: "0.8.0",
        settings: { optimizer: { 
          enabled: true,
          runs: 200, 
         },}
      },
      {
        version: "0.6.6",
        settings: { optimizer: { 
          enabled: true,
          runs: 200, 
         },}
      },
      {
        version: "0.4.22",
        settings: { 
          optimizer: { 
            enabled: true,
            runs: 200, 
           },
        }
      },
    ]
  },
  namedAccounts: {
    deployer: 0,
    tokenOwner: 1,
    play1:2,
  },
  defaultNetwork: "hardhat",
  networks: {
    hardhat: {
      forking: {
        url: ETH_MAINNER_API_KEY_URL,
        blockNumber: 15796830,
        allowUnlimitedContractSize:true,  //deploy coinFactory gas excess ,so open it
        // gas: 2100000,
        // gasPrice: 8000000000,
        // timeout: 1800000
      },
    },
    localhost: {
      url: "http://localhost:8545",
      //gasPrice: 125000000000,//you can adjust gasPrice locally to see how much it will cost on production
      /*
        notice no mnemonic here? it will just use account 0 of the hardhat node to deploy
        (you can put in a mnemonic here to set the deployer locally)
      */
      //chainId: 11130,
     // allowUnlimitedContractSize:false,
      // allowUnlimitedContractSize: true,
      // //gas: 'auto',
      // gasPrice: 125000000000,
      // gas: 210000000,
      // blockGasLimit:950000000
    },
    privateChain:{
      url: "http://47.99.55.27:8500",
      chainId: 84537
    },
    polygon:{
      url: POLYGON_API_KEY_URL,
      accounts: [POLYGON_PRIVATE_KEY],
    },
    goerli:{
      url: GOERLI_API_KEY_URL,
      accounts: [GOERLI_PRIVATE_KEY],
    },
  },
  paths: {
    sources: './contracts',
  },
  etherscan: {
    // Your API key for Etherscan
    // Obtain one at https://etherscan.io/
    apiKey:ETHERSCAN_KEY,
  },
  typechain: {
    outDir: 'src/types',
    target: 'ethers-v5',
    alwaysGenerateOverloads: false, // should overloads with full signatures like deposit(uint256) be generated always, even if there are no overloads?
    externalArtifacts: ['externalArtifacts/*.json'], // optional array of glob patterns with external artifacts to process (for example external libs from node_modules)
    dontOverrideCompile: false // defaults to false
  },
};
