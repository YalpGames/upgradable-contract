import { ethers ,artifacts,network} from 'hardhat';
import { writeAbiAddr } from '../artifact_saver.js';

async function main() {
  const ERC20 = await ethers.getContractFactory('MainToken');
  const erc20 = await ERC20.deploy('MainToken', 'MT', 100000000n * 10n ** 18n);
  await erc20.deployed();

  console.log('MainToken address : ', erc20.address);
  const [owner,playOther] = await ethers.getSigners();
  console.log(await owner.getBalance());

  let tx = await erc20.connect(playOther).mint(owner.address,1000);
  await tx.wait();
  console.log("owner mainCoin balance: ",await erc20.balanceOf(owner.address));
  //储存部署信息在文件
  // let artifact = await artifacts.readArtifact('MainToken');
  // await writeAbiAddr(artifact, erc20.address, 'MainToken', network.name);

}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
