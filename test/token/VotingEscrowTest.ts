import { expect } from 'chai';
import { ethers } from 'hardhat';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { deployAll, EconomyContract, ExternalContract } from '../../scripts/deployAll';

describe('VotingEscrow', function () {
  let core: EconomyContract & ExternalContract;
  let test: SignerWithAddress;
  this.beforeAll(async function () {
    // hardhat test accounts
    const accounts = await ethers.getSigners();
    test = accounts[1];
    core = await deployAll();
  });
  it('transfer MainToken to test account successfully', async function () {
    await core.MainToken.transfer(test.address, 100n * 10n ** 18n);
    expect(await core.MainToken.balanceOf(test.address)).to.be.equal(100n * 10n ** 18n);
  });
  it('should create a locker successfully', async function () {
    console.log(await core.MainToken.balanceOf(test.address));
    await core.MainToken.connect(test).approve(core.votingEscrow.address, 100n * 10n ** 18n);
    const block = await ethers.provider.getBlock(await ethers.provider.getBlockNumber());
    const incBlockTime = block.timestamp + (7 * 86400);
    console.log("incBlockTime: ",incBlockTime);
    const tx = await core.votingEscrow.connect(test).createLock(100n * 10n ** 18n, incBlockTime);
    await tx.wait();
    expect((await core.votingEscrow.locked(test.address)).amount).to.be.equal(100n * 10n ** 18n);
  });
  it('Compare the deposit amount with veMainToken',async function(){
    const amount =  await core.votingEscrow.balanceOf(test.address);
    const lockedBalance = (await core.votingEscrow.locked(test.address)).amount;
    console.log("create lockedBalance: ",lockedBalance,"balanceOf veMainToken: ",amount);
  });
  it('increaseUnlockTime and increaseAmount test',async function(){
    const amount =  await core.votingEscrow.balanceOf(test.address);
    const block = await ethers.provider.getBlock(await ethers.provider.getBlockNumber());
    const incBlockTime = block.timestamp + (2 * 7 * 86400);
    await core.votingEscrow.connect(test).increaseUnlockTime(incBlockTime);
    const lockedBalance = (await core.votingEscrow.locked(test.address)).amount;
    console.log("lockedBalance: ",lockedBalance,"veMainToken",amount,"increaseUnlockTime veMainToken: ",await core.votingEscrow.balanceOf(test.address));
  });
  it('increaseAmount and increaseAmount test',async function(){
    await core.MainToken.transfer(test.address, 100n * 10n ** 18n);
    await core.MainToken.connect(test).approve(core.votingEscrow.address, 100n * 10n ** 18n);
    await core.votingEscrow.connect(test).increaseAmount(100n * 10n ** 18n);
    console.log("increaseAmount veMainToken: ",await core.votingEscrow.balanceOf(test.address));
  });
  it('withdraw MainToken Emergency successfully', async function () {
    await expect(core.votingEscrow.connect(test).expire()).to.be.revertedWith('Ownable: caller is not the owner');
    await expect(core.votingEscrow.connect(test).withdraw()).to.be.revertedWith('VotingEscrow: condition not met');
    await core.votingEscrow.expire();
    await core.votingEscrow.connect(test).withdraw();
    expect(await core.MainToken.balanceOf(test.address)).to.be.equal(200n * 10n ** 18n);
    expect((await core.votingEscrow.locked(test.address)).amount).to.be.equal(0);
  });
});
