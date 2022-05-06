async function main() {
    const proxyAddress = '0x7B818d5f89FE1b37b6C4833623d0c630766DBdb6';
   
    const StorageV2 = await ethers.getContractFactory("StorageV2");
    console.log("Preparing upgrade...");
    const StorageV2Address = await upgrades.prepareUpgrade(proxyAddress, StorageV2);
    console.log("StorageV2 at:", StorageV2Address);
  }
   
  main()
    .then(() => process.exit(0))
    .catch(error => {
      console.error(error);
      process.exit(1);
    });