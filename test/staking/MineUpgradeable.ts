import { expect } from 'chai';
import { ethers } from 'hardhat';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { deployAll, EconomyContract, ExternalContract } from '../../scripts/deployAll';
import { Contract } from 'ethers/lib/ethers';
import * as compiledUniswapPair from '@uniswap/v2-core/build/UniswapV2Pair.json';

describe('Mine', function () {
  let admin: SignerWithAddress;
  let developer: SignerWithAddress;
  let user: SignerWithAddress;
  let core: EconomyContract & ExternalContract;
  let RewardVault: Contract;
  let gameCoinAddress: string;
  let pair: Contract;
  let liquidity: number;
  let id: string;
  let Dev: SignerWithAddress;
  this.beforeAll(async function () {
    // hardhat test accounts
    const accounts = await ethers.getSigners();
    admin = accounts[0];
    Dev = accounts[9];
    developer = accounts[1];
    user = accounts[2];
    core = await deployAll();
    await core.CoinFactory.setDev(Dev.address);
  });

  // pause
  it('show pause successfully', async function () {
    await core.Mine.pause();
    const testPairAddress = ethers.Wallet.createRandom().address;
    await expect(core.Mine.connect(core.CoinFactory.address).createPool(testPairAddress)).to.be.revertedWith('Pausable: paused');
    await core.Mine.unpause();
    await core.Mine.createPool(testPairAddress);
    console.log("pool length: ",await core.Mine.getPoolLength());
  });

  // transfer MainToken token to the RewardVault
  it('show transfer MainToken successfully', async function () {
    const RewardVaultF = await ethers.getContractFactory('RewardVault');
    RewardVault = RewardVaultF.attach(await core.Mine.rewardVault());
    await core.MainToken.mint(RewardVault.address, 100000000n * 10n ** 18n);
    expect(await core.MainToken.balanceOf(RewardVault.address)).to.be.equal(100000000n * 10n ** 18n);
  });

  it('Should show developer register successfully', async function () {
    const gameId = '1101';
    await core.CoinFactory.connect(admin).register(gameId, developer.address);
    expect(await core.CoinFactory.allGames('1101')).to.be.equal(developer.address);
  });

  it('Give developer  and approve  token to V0factory', async function () {
    await core.MainToken.connect(admin).transfer(developer.address, BigInt(3) * 10n ** 18n);
    expect(await core.MainToken.balanceOf(developer.address)).to.be.equal(3n * 10n ** 18n);
    await core.MainToken.connect(developer).approve(core.CoinFactory.address, 3n * 10n ** 18n);
  });

  it('Should show gameCoin create successfully!', async function () {
    const name = 'GameCoin';
    const symbol = 'GC';
    const gameId = '1101';
    const gameCoinIconUrl =
      'https://images.weserv.nl/?url=https://i0.hdslb.com/bfs/article/87c5b43b19d4065f837f54637d3932e680af9c9b.jpg';
    const amountGameCoin = BigInt(10) * BigInt(10) ** 18n;
    const amount = BigInt(1) * BigInt(10) ** 18n;

    await core.MainToken.connect(developer).approve(core.CoinFactory.address, amount);
    const createInfo = await core.CoinFactory
      .connect(developer)
      .create(name, symbol, gameId, gameCoinIconUrl, amountGameCoin, amount);

    (await createInfo.wait()).events!.forEach((x) => {
      if (x.event === 'CreateGameCoin') {
        gameCoinAddress = x.args!.gameCoinAddress;
      }
    });
    const pairAddress = await core.uniswapFactory.getPair(core.MainToken.address, gameCoinAddress);
    const Pair = new ethers.ContractFactory(compiledUniswapPair.interface, compiledUniswapPair.bytecode, admin);
    pair = Pair.attach(pairAddress);
    liquidity = await pair.balanceOf(core.Mine.address);
    console.log("pool length: ",await core.Mine.getPoolLength());
  });
  // create locker
  it('show create locker successfully', async function () {
    await core.MainToken.connect(developer).approve(core.votingEscrow.address, 200n * 10n ** 18n);
    await core.votingEscrow.connect(developer).createLock(2n * 10n ** 18n, 1716693857);
    const timestampBefore = (await ethers.provider.getBlock(await ethers.provider.getBlockNumber())).timestamp;
    await ethers.provider.send('evm_mine', [timestampBefore + 10 * 86400]);
  });
  // get gauge type
  it('show gauge type', async function () {
    expect(await core.gaugeController.getGaugeTypes(pair.address)).to.be.equal(0);
  });
  // vote for gauge
  it('show vote for gauge successfully', async function () {
    await core.gaugeController.connect(developer).voteForGaugeWeights(pair.address, 5000);
    const timestampBefore = (await ethers.provider.getBlock(await ethers.provider.getBlockNumber())).timestamp;
    await ethers.provider.send('evm_mine', [timestampBefore + 86400 * 10]);
    expect(await core.gaugeController.getTypeWeight(0)).to.be.equal(1n * 10n ** 18n);
  });

  // claim MainToken
  it('show claim MainToken successfully', async function () {
    await core.Mine.connect(developer).checkpoint(pair.address);
    expect(await core.Mine.getPid(pair.address)).to.be.equal(1);
    const balanceOf = await core.MainToken.balanceOf(developer.address);
    await core.Mine.connect(developer).claim(pair.address);
    expect(await core.MainToken.balanceOf(developer.address)).to.be.above(balanceOf);
  });

  // attempts to forge false information to obtain lpToken and Tokens should fail
  it('should show that neither balanceOfLpToken nor balanceOfReward has changed ', async function () {
    const balanceOfLpToken = await core.Mine.getUserLpBalance(pair.address, user.address);
    const balanceOfReward = await core.MainToken.balanceOf(user.address);
    await expect(
      core.Mine
        .connect(user)
        .executeWithdraw(pair.address, '0x686a653b3b000000000000000000000000000000000000000000000000000000'),
    ).to.be.revertedWith('msg.sender is not who!');
    expect(await core.MainToken.balanceOf(user.address)).to.be.equal(balanceOfReward);
    expect(await core.Mine.getUserLpBalance(pair.address, user.address)).to.be.equal(balanceOfLpToken);
  });

  // delay unStaking mining
  it('show  withdraw delay', async function () {
    const tx = await core.Mine.connect(developer).queueWithdraw(pair.address, liquidity);
    expect(await core.Mine.getUserLpBalance(pair.address, developer.address)).to.be.equal(liquidity);

    (await tx.wait()).events!.forEach((x) => {
      if (x.event === 'QueueWithdraw') {
        id = x.args!.newWithdrawId;
      }
    });
  });
  // try withdraw
  it('show withdraw fail', async function () {
    const timestampBefore = (await ethers.provider.getBlock(await ethers.provider.getBlockNumber())).timestamp;
    await ethers.provider.send('evm_mine', [timestampBefore + 60]);
    await expect(core.Mine.connect(developer).executeWithdraw(pair.address, id)).to.be.revertedWith(
      'unlockTimestamp not secceseced!',
    );
  });

  it('show withdraw successfully', async function () {
    // time goes by
    const timestampBefore = (await ethers.provider.getBlock(await ethers.provider.getBlockNumber())).timestamp;
    await ethers.provider.send('evm_mine', [timestampBefore + 60]);
    await core.Mine.connect(developer).executeWithdraw(pair.address, id);
    expect(await core.Mine.getUserLpBalance(pair.address, developer.address)).to.be.equal(0);
    expect(await core.MainToken.balanceOf(developer.address)).to.be.above(0);
  });

  // reset delayK and delayB
  it('show set delayB and delayK success', async function () {
    await core.Mine.setDelayK(120);
    await core.Mine.setDelayB(120);
    expect(await core.Mine.delayK()).to.be.equal(120);
    expect(await core.Mine.delayB()).to.be.equal(120);
  });

  // reset rate
  it('show set new rate successfully', async function () {
    await core.Mine.setRate(4n * 10n ** 18n);
    expect(await core.Mine.rate()).to.be.equal(4n * 10n ** 18n);
  });

  // Staking Mining after reset delayK  delayB and MainToken
  it('show stake successfully', async function () {
    // use developer account
    const liquidity = await pair.balanceOf(developer.address);
    await pair.connect(developer).approve(core.Mine.address, liquidity);
    await core.Mine.connect(developer).deposit(pair.address, liquidity.div(2));
    expect(await core.Mine.getUserLpBalance(pair.address, developer.address)).to.be.equal(liquidity.div(2));
    await core.Mine.connect(developer).deposit(pair.address, liquidity.div(2));
    expect(await core.Mine.getUserLpBalance(pair.address, developer.address)).to.be.equal(liquidity);
  });

  // get pending MainToken
  it('show claim success', async function () {
    const balanceOfReward = await core.MainToken.balanceOf(user.address);
    const timestampBefore = (await ethers.provider.getBlock(await ethers.provider.getBlockNumber())).timestamp;
    await ethers.provider.send('evm_mine', [timestampBefore + 1200]);
    await core.Mine.connect(developer).claim(pair.address);
    expect(await core.MainToken.balanceOf(developer.address)).to.be.above(balanceOfReward);
  });

  // try withdraw
  it('show withdraw fail', async function () {
    expect(core.Mine.executeWithdraw(pair.address, id)).to.be.revertedWith('Mine: can only be withdraw once');
  });

  // delay unStaking mining
  it('show  withdraw delay', async function () {
    const info = await core.Mine.userInfo(await core.Mine.getPid(pair.address), developer.address);
    const tx = await core.Mine.connect(developer).queueWithdraw(pair.address, info.amount);
    expect(await core.Mine.getUserLpBalance(pair.address, developer.address)).to.be.equal(info.amount);

    (await tx.wait()).events!.forEach((x) => {
      if (x.event === 'QueueWithdraw') {
        id = x.args!.newWithdrawId;
      }
    });
  });

  // claim  pending MainToken with fake account
  it('show claim nothing', async function () {
    const balanceOfReward = await core.MainToken.balanceOf(admin.address);
    await expect(core.Mine.connect(admin).claim(pair.address)).to.be.revertedWith('Mine: no staked token');
    expect(await core.MainToken.balanceOf(admin.address)).to.be.equal(balanceOfReward);
  });

  // get pending MainToken by claimAll
  it('show claimAll successfully', async function () {
    const timestampBefore = (await ethers.provider.getBlock(await ethers.provider.getBlockNumber())).timestamp;
    await ethers.provider.send('evm_mine', [timestampBefore + 86400 * 7]);
    const balanceOfReward = await core.MainToken.balanceOf(developer.address);
    await core.Mine.connect(developer).claimAll();
    expect(await core.MainToken.balanceOf(developer.address)).to.be.above(balanceOfReward);
  });

  // update checkpoint
  it('show checkpoint  success', async function () {
    const res = await core.Mine.poolInfos(1);
    const timestampBefore = (await ethers.provider.getBlock(await ethers.provider.getBlockNumber())).timestamp;
    await ethers.provider.send('evm_mine', [timestampBefore + 86400 * 10]);
    await core.Mine.checkpoint(pair.address);
    expect((await core.Mine.poolInfos(1)).accPerShare).to.be.above(res.accPerShare);
  });

  // update checkpoint all
  it('show checkpoint  success', async function () {
    await core.Mine.checkpointAll();
  });

  it('show withdraw successfully', async function () {
    // time goes by
    const balanceOf = await core.MainToken.balanceOf(developer.address);
    const timestampBefore = (await ethers.provider.getBlock(await ethers.provider.getBlockNumber())).timestamp;
    await ethers.provider.send('evm_mine', [timestampBefore + 600]);
    await core.Mine.connect(developer).executeWithdraw(pair.address, id);
    expect(await core.Mine.getUserLpBalance(pair.address, developer.address)).to.be.equal(0);
    expect(await core.MainToken.balanceOf(developer.address)).to.be.above(balanceOf);
  });

  // staking an unregistered pool
  it('show staking fail', async function () {
    const balance = await core.MainToken.balanceOf(user.address);
    await core.MainToken.connect(user).approve(core.Mine.address, balance);
    await expect(core.Mine.connect(user).deposit(core.MainToken.address, balance)).to.be.revertedWith(
      'Mine: LP Token Not Exist',
    );
  });

  // try create an existing pool
  it('show create an existing pool fail', async function () {
    const before = await core.Mine.getPoolLength();
    await expect(core.Mine.connect(admin).createPool(pair.address)).to.be.revertedWith('Mine: LP Token Already Exist');
    expect(await core.Mine.lpTokenRegistry(pair.address)).to.be.equal(before);
  });

  // get pool info
  it('show get pool info success', async function () {
    const len = await core.Mine.getPoolLength();
    expect(len).to.equal(2);
    const pid = await core.Mine.getPid(pair.address);
    const tmp = await core.Mine.lpTokenRegistry(pair.address);
    expect(pid).to.be.equal(tmp.sub(1));
  });

  // withdraw token Emergency by admin
  it('show withdraw token Emergency successfully', async function () {
    await expect(core.Mine.withdrawEmergency()).to.be.revertedWith('no emergency now');
    await core.Mine.emergency();
    await expect(core.Mine.withdrawEmergency()).to.be.revertedWith('Mine: not unlocked yet');
    const balanceOf = await core.MainToken.balanceOf(RewardVault.address);
    const balanceOfAdmin = await core.MainToken.balanceOf(admin.address);
    const timestampBefore = (await ethers.provider.getBlock(await ethers.provider.getBlockNumber())).timestamp;
    await ethers.provider.send('evm_mine', [timestampBefore + 86400]);
    await core.Mine.withdrawEmergency();
    expect(await core.MainToken.balanceOf(admin.address)).be.be.equal(balanceOf.add(balanceOfAdmin));
    await expect(core.Mine.emergency()).to.be.revertedWith('Mine: already exists');
  });

  // withdraw lpTokens Emergency
  it('show withdraw lpTokens Emergency successfully', async function () {
    await expect(core.Mine.withdrawLpTokenEmergency(pair.address)).to.be.revertedWith('Mine: without any lpToken');
    const balanceOf = await pair.balanceOf(developer.address);
    await pair.connect(developer).approve(core.Mine.address, balanceOf);
    await core.Mine.connect(developer).deposit(pair.address, balanceOf);
    expect(await core.Mine.getUserLpBalance(pair.address, developer.address)).to.be.equal(balanceOf);
    await core.Mine.connect(developer).withdrawLpTokenEmergency(pair.address);
    expect(await pair.balanceOf(developer.address)).to.be.equal(balanceOf);
    expect(await core.Mine.getUserLpBalance(pair.address, developer.address)).to.be.equal(0);

    await pair.connect(developer).approve(core.Mine.address, balanceOf);
    await core.Mine.connect(developer).deposit(pair.address, balanceOf);
    expect(await core.Mine.getUserLpBalance(pair.address, developer.address)).to.be.equal(balanceOf);
    await core.Mine.connect(developer).withdrawAllLpTokenEmergency();
    expect(await pair.balanceOf(developer.address)).to.be.equal(balanceOf);
    expect(await core.Mine.getUserLpBalance(pair.address, developer.address)).to.be.equal(0);
  });
});
