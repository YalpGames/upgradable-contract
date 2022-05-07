const { ethers, upgrades } = require("hardhat");

async function main() {
  const MichaelJordanNFTFactory = await ethers.getContractFactory("MichaelJordanNFT");

  const MichaelJordanNFT = await upgrades.deployProxy(MichaelJordanNFTFactory);

  await MichaelJordanNFT.deployed();
  console.log("MichaelJordanNFT constract deployed to:", MichaelJordanNFT.address);
}

main()
.then(() => process.exit(0))
.catch(error => {
  console.error(error);
  process.exit(1);
});