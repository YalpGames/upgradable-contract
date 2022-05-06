const hre = require("hardhat");

async function main() {
    const storageFactory = await ethers.getContractFactory("Storage");
    console.log("Deploying Storage...");
    const storage = await upgrades.deployProxy(storageFactory, [42], { initializer: 'store' });
    console.log("Storage deployed to:", storage.address);
  }
  
  main()
    .then(() => process.exit(0))
    .catch(error => {
      console.error(error);
      process.exit(1);
    });