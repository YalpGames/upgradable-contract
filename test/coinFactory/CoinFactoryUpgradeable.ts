import { ethers, upgrades } from 'hardhat';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { expect } from 'chai';
import { deployAll, EconomyContract, ExternalContract } from '../../scripts/deployAll';

describe('CoinFactory', function () {
  let admin: SignerWithAddress;
  let Dev: SignerWithAddress;
  let gameDeveloper: SignerWithAddress;
  let gameDeveloper2: SignerWithAddress;
  let admin2: SignerWithAddress;
  let user: SignerWithAddress;
  let mintId: string;
  let gameCoinAddress: string;
  let core: EconomyContract & ExternalContract;
  let test: SignerWithAddress;
  this.beforeAll(async function () {
    // hardhat test accounts
    const accounts = await ethers.getSigners();
    admin = accounts[0];
    admin2 = accounts[1];
    gameDeveloper = accounts[2];
    user = accounts[3];
    gameDeveloper2 = accounts[8];
    test = accounts[9];
    core = await deployAll();
    //await core.CoinFactory.setDev(Dev.address);
  });
  it('Should pausable effective', async () => {
    await core.CoinFactory.pause();
    expect(core.CoinFactory.create('', '', '', '', 0n, 0n)).to.be.revertedWith('Pausable: paused');
    expect(core.CoinFactory.queueMintCoin('', '', 0n)).to.be.revertedWith('Pausable: paused');
    expect(core.CoinFactory.executeMintCoin('', '')).to.be.revertedWith('Pausable: paused');
    await core.CoinFactory.unpause();
  });

  it('Should show gameDeveloper register successfully', async function () {
    const gameId = '1101';
    await core.CoinFactory.connect(admin).register(gameId, gameDeveloper.address);
    expect(await core.CoinFactory.allGames('1101')).to.be.equal(gameDeveloper.address);
  });
  it('should show register fail by test account', async function () {
    const gameId2 = '1102';
    await expect(core.CoinFactory.connect(test).register(gameId2, gameDeveloper2.address)).to.be.revertedWith(
      'Ownable: caller is not the owner',
    );
  });
  it('Give gameDeveloper  and approve  MainToken to V0factory', async function () {
    await core.MainToken.connect(admin).transfer(gameDeveloper.address, BigInt(3) * 10n ** 18n);
    expect(await core.MainToken.balanceOf(gameDeveloper.address)).to.be.equal(3n * 10n ** 18n);
    await core.MainToken.connect(gameDeveloper).approve(core.CoinFactory.address, 3n * 10n ** 18n);
  });
  it('Should show gameCoin create successfully!', async function () {
    const name = 'GameCoin';
    const symbol = 'GC';
    const gameId = '1101';
    const gameCoinIconUrl =
      'https://images.weserv.nl/?url=https://i0.hdslb.com/bfs/article/87c5b43b19d4065f837f54637d3932e680af9c9b.jpg';
    const amountGameCoin = BigInt(10) * BigInt(10) ** 18n;
    const amount = BigInt(1) * BigInt(10) ** 18n;

    await core.MainToken.connect(gameDeveloper).approve(core.CoinFactory.address, amount);
    const createInfo = await core.CoinFactory
      .connect(gameDeveloper)
      .create(name, symbol, gameId, gameCoinIconUrl, amountGameCoin, amount);

    (await createInfo.wait()).events!.forEach((x) => {
      if (x.event === 'CreateGameCoin') {
        gameCoinAddress = x.args!.gameCoinAddress;
      }
    });
  });

  it('Should show set delay variable successfully! ', async function () {
    await core.CoinFactory.connect(admin).setDelayK(1);
    await core.CoinFactory.connect(admin).setDelayB(1);
    expect(await core.CoinFactory.delayK()).to.be.equal(1);
    expect(await core.CoinFactory.delayB()).to.be.equal(1);
  });

  // it("Check gameCoin mint fee", async function () {
  //   const price = await core.CoinFactory.getMintFee(
  //     gameCoinAddress,
  //     BigInt(30) * BigInt(10) ** 18n
  //   );
  //   console.log("check gameCoin mint fee", price);
  // });

  it('Check gameCoin mint delay time', async function () {
    await core.CoinFactory.getMintDelay(gameCoinAddress, BigInt(5) * BigInt(10) ** 18n);
  });
  it('Should show declare mint successfully!', async function () {
    const amount = BigInt(6) * BigInt(10) ** 17n;
    await core.MainToken.connect(gameDeveloper).approve(core.CoinFactory.address, amount);
    const tx = await core.CoinFactory
      .connect(gameDeveloper)
      .queueMintCoin('1101', gameCoinAddress, BigInt(5) * BigInt(10) ** 18n);
    (await tx.wait()).events!.forEach((x) => {
      if (x.event === 'QueueMintCoin') {
        mintId = x.args!.mintId;
      }
    });
  });

  it('Should show execute mint successfully!', async function () {
    const blockNumBefore = await ethers.provider.getBlockNumber();
    const blockBefore = await ethers.provider.getBlock(blockNumBefore);
    const timestampBefore = blockBefore.timestamp;
    const amountGameCoin = BigInt(6) * BigInt(10) ** 17n;
    const delayD = await core.CoinFactory.getMintDelay(gameCoinAddress, amountGameCoin);
    const coinMintRecords = await core.CoinFactory.coinMintRecords(gameCoinAddress,mintId);
    const unlockTimestamp = coinMintRecords.unlockTimestamp;
    console.log("unlockTimestamp",unlockTimestamp);
    await ethers.provider.send('evm_mine', [timestampBefore + 50000000000000]);
    await core.CoinFactory.executeMintCoin(gameCoinAddress, mintId);
  });
  it('Should show duplicate mint fail!', async function () {
    const blockNumBefore = await ethers.provider.getBlockNumber();
    const blockBefore = await ethers.provider.getBlock(blockNumBefore);
    const timestampBefore = blockBefore.timestamp;
    const amountGameCoin = BigInt(6) * BigInt(10) ** 17n;
    const delayD = await core.CoinFactory.getMintDelay(gameCoinAddress, amountGameCoin);
    await ethers.provider.send('evm_mine', [timestampBefore + 50000000000000]);
    await expect(core.CoinFactory.executeMintCoin(gameCoinAddress, mintId)).to.be.revertedWith('mintId is minted!');
  });

  it('Should show change game gameDeveloper successfully !', async function () {
    const gameId = '1101';
    await core.CoinFactory.connect(admin).register(gameId, admin.address);
    expect(await core.CoinFactory.allGames('1101')).to.be.equal(admin.address);
  });

  it('Should show withdraw gameCoin successfully', async function () {
    await core.CoinFactory.connect(gameDeveloper).withdraw(user.address, gameCoinAddress, 1n * 10n ** 18n);
    const GameCoin = await ethers.getContractFactory('GameCoin');
    const gameCoin = GameCoin.attach(gameCoinAddress);

    expect(await gameCoin.balanceOf(user.address)).to.be.equal(1n * 10n ** 18n);
  });
  it('should transfer ownership successfully', async () => {
    await expect(core.CoinFactory.transferOwnership(ethers.constants.AddressZero)).to.be.revertedWith(
      'Ownable: new owner is the zero address',
    );

    await core.CoinFactory.connect(admin).transferOwnership(admin2.address);

    // await expect(core.CoinFactory.connect(admin2).claimOwnership()).to.be.revertedWith('SafeOwnable: caller != pending');
    await expect(
    core.CoinFactory.connect(admin2).upgradeTo(Buffer.from(ethers.utils.randomBytes(20)).toString('hex')),
    ).to.be.revertedWith('Ownable: caller is not the owner');

    await core.CoinFactory.connect(admin2).transferOwnership(admin.address);

   // core.CoinFactory.connect(admin2).upgradeTo(Buffer.from(ethers.utils.randomBytes(20)).toString('hex'));

  });
  // it('Should contract upgrade successfully', async function () {
  //   const FactoryAlterF = await ethers.getContractFactory('CoinFactoryUpgradeableAlter');

  //   await upgrades.upgradeProxy(core.CoinFactory.address, FactoryAlterF);
  //   const FactoryAlter = await ethers.getContractAt('CoinFactoryUpgradeableAlter', core.CoinFactory.address);

  //   await FactoryAlter.callWhiteBlack();
  // });
});
