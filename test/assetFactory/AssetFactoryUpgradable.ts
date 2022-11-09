import { expect } from 'chai';
import { ethers, upgrades } from 'hardhat';
import { AssetFactoryUpgradable, Asset } from '../../src/types';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { Contract } from 'ethers';

describe('AssetFactoryUpgradable', function () {
  // admin: Who deploy factory contract
  let admin: SignerWithAddress;
  // developer1: Who have register a gameId on Factory
  let developer1: SignerWithAddress;
  // developer2: Who don't register a gameId on Factory
  let developer2: SignerWithAddress;
  // user1: not Used Now
  // let user1: SignerWithAddress;
  // factory: Register Game and create GameCoin
  let CoinFactory: Contract;
  //
  let AssetFactoryAddr: Contract;
  let AssetFactory: AssetFactoryUpgradable;
  let collectionAddr: string;
  let collection: Asset;
  let Dev: SignerWithAddress;

  this.beforeAll(async () => {
    // distribute account
    const accounts = await ethers.getSigners();
    admin = accounts[0];
    developer1 = accounts[1];
    developer2 = accounts[2];
    Dev = accounts[9];
    // user1 = accounts[3];

    // deploy  coin
    const TokenF = await ethers.getContractFactory('MainToken');
    const Token = await TokenF.deploy('Main Token', '', 0n);

    // mint  Coin
    // await coin.mint(user1.address, 100n * 10n ** 18n);
    // await coin.mint(user2.address, 100n * 10n ** 18n);
    // expect(await coin.balanceOf(user1.address)).to.be.equal(
    //   100n * 10n ** 18n
    // );
    // expect(await coin.balanceOf(user2.address)).to.be.equal(
    //   100n * 10n ** 18n
    // );

    // deploy factory
    const CoinFactoryF = await ethers.getContractFactory('CoinFactoryUpgradeable');
    // not fully use, so set random address args

    CoinFactory = await upgrades.deployProxy(
      CoinFactoryF,
      [Token.address, Token.address, Token.address, 0n, ethers.utils.randomBytes(32)],
      {
        kind: 'uups',
      },
    );
    await CoinFactory.setDev(Dev.address);

    // register game
    await CoinFactory.connect(admin).register('gameId1', developer1.address);
  });

  it('Should AssetFactoryUpgradable Deploy successfully', async function () {
    const AssetFactoryUpgradableF = await ethers.getContractFactory('AssetFactoryUpgradable');
    AssetFactoryAddr = await upgrades.deployProxy(AssetFactoryUpgradableF, [CoinFactory.address], {
      kind: 'uups',
    });
    AssetFactory = await ethers.getContractAt('AssetFactoryUpgradable', AssetFactoryAddr.address);
  });

  it('Should developer1 create collection successfully', async function () {
    const tx = await AssetFactory.connect(developer1).createCollection('gameId1', 'ipfs://');

    // await expect(AssetFactory.connect(developer1).createCollection('gameId1', 'ipfs://'))
    //   .to.emit(AssetFactory.address, 'CollectionCreated')
    //   .withArgs(collection.address, developer1.address);

    (await tx.wait()).events?.forEach((x) => {
      if (x.event === 'CollectionCreated') {
        collectionAddr = x.args?.collection;
      }
    });

    expect(collectionAddr).to.lengthOf(42);

    collection = await ethers.getContractAt('Asset', collectionAddr);
    expect(await collection.contractURI()).to.be.equal('ipfs://');
  });

  it('Should change contract uri successfully', async () => {
    await AssetFactory.connect(developer1).updateCollectionUri(collection.address, 'ar://');
    expect(await collection.contractURI()).to.be.equal('ar://');
  });

  it('Should developer2 create collection fail', async () => {
    await expect(AssetFactory.connect(developer2).createCollection('gameId1', 'ipfs://')).to.be.revertedWith(
      'not game developer',
    );
  });

  it('Should developer1 create asset successfully', async () => {
    await expect(AssetFactory.connect(developer1).createAssetAndMint(collection.address, 10, 'ipfs://'))
      .to.emit(AssetFactory, 'SftCreated')
      .withArgs(collection.address, 0, 10);

    expect(await collection.balanceOf(developer1.address, 0)).to.be.equal(10);
    expect(await collection.uri(0)).to.be.equal('ipfs://');
  });

  it('Should developer1 create asset again successfully', async () => {
    await AssetFactory.connect(admin).pause();
    await expect(AssetFactory.connect(developer1).createAssetAndMint(collection.address, 10, 'ipfs://')).to.be.revertedWith(
      'Pausable: paused',
    );

    await AssetFactory.connect(admin).unpause();
    await expect(AssetFactory.connect(developer1).createAssetAndMint(collection.address, 10, 'ipfs://'))
      .to.emit(AssetFactory, 'SftCreated')
      .withArgs(collection.address, 1, 10);
  });

  it('Should developer1 update metadata uri successfully', async () => {
    await expect(AssetFactory.connect(developer1).updateSftUri(collection.address, 0, 'ar://'))
      .to.emit(collection, 'SetUri')
      .withArgs(0, 'ar://');

    expect(await collection.uri(0)).to.be.equal('ar://');

    await expect(AssetFactory.connect(developer2).updateSftUri(collection.address, 0, 'ar://')).to.be.revertedWith(
      'not collection developer!',
    );
  });

  // it('Should upgrade successfully', async () => {
  //   const AssetFactoryAlter = await ethers.getContractFactory('AssetFactoryUpgradableAlter');

  //   const AssetFactoryAlter = await upgrades.upgradeProxy(AssetFactory.address, AssetFactoryAlter);

  //   await expect(AssetFactoryAlter.setCoinFactory(ethers.constants.AddressZero)).to.be.revertedWith(
  //     'AssetF: CoinFactory cannot be 0',
  //   );
  //   const randomAddr = ethers.utils.computeAddress(ethers.utils.randomBytes(32));
  //   await AssetFactoryAlter.setCoinFactory(randomAddr);
  //   expect(await AssetFactoryAlter.CoinFactory()).to.be.equal(randomAddr);
  // });
});
