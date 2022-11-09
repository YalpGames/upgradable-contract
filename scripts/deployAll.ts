import { ethers, upgrades,network,artifacts } from 'hardhat';
import {
  AssetFactoryUpgradable,
  MineUpgradeable,
  MainToken,
  CoinFactoryUpgradeable,
  GaugeControllerUpgradeable,
  VotingEscrow,
} from '../src/types';
import { Contract } from 'ethers';
import * as compiledUniswapFactory from '@uniswap/v2-core/build/UniswapV2Factory.json';
import * as compiledUniswapRouter from '@uniswap/v2-periphery/build/UniswapV2Router02.json';
import { writeAbiAddr,writeAbiAddrForAbi } from './artifact_saver.js';

export declare type ExternalContract = {
  uniswapFactory: Contract;
  uniswapRouter: Contract;
  weth: Contract;
};

export declare type EconomyContract = {
  MainToken: MainToken;
  CoinFactory: CoinFactoryUpgradeable;
  AssetFactory: AssetFactoryUpgradable;
  Mine: MineUpgradeable;
  gaugeController: GaugeControllerUpgradeable;
  votingEscrow: VotingEscrow;
};

export async function deployExternal(): Promise<ExternalContract> {
    const accounts = await ethers.getSigners();
    const admin = accounts[0];

    // deploy weth
    //   const WETH = new ethers.ContractFactory(compiledWETH.abi, compiledWETH.bytecode, admin);
    //   const weth = await WETH.deploy();

    const WETH9 = await ethers.getContractFactory('WETH9');
    const weth9 = await WETH9.deploy();

    // deploy uniswap
    const UNISWAPV2ROUTER = new ethers.ContractFactory(compiledUniswapRouter.abi, compiledUniswapRouter.bytecode, admin);
    const UNISWAPV2FACTORY = new ethers.ContractFactory(compiledUniswapFactory.interface, compiledUniswapFactory.bytecode, admin);
    const uniswapV2Factory = await UNISWAPV2FACTORY.connect(admin).deploy(admin.address);
    const uniswapV2Router02 = await UNISWAPV2ROUTER.connect(admin).deploy(uniswapV2Factory.address, weth9.address);

    await writeAbiAddr(artifacts, weth9.address, 'WETH9', network.name);
    let artifact = {
    contractName:'uniswapV2Factory',
    abi:compiledUniswapFactory.interface
    };
    await writeAbiAddrForAbi(artifact, uniswapV2Factory.address, network.name);

    let artifact2 = {
    contractName:'uniswapV2Router02',
    abi:compiledUniswapRouter.abi
    };
    await writeAbiAddrForAbi(artifact2, uniswapV2Router02.address, network.name);

    return {
        uniswapFactory: uniswapV2Factory,
        uniswapRouter: uniswapV2Router02,
        weth: weth9,
    };
}

export async function deployEconomyContract(externalContract: ExternalContract): Promise<EconomyContract> {
  const MainTokenF = await ethers.getContractFactory('MainToken');
  const CoinFactoryF = await ethers.getContractFactory('CoinFactoryUpgradeable');
  const AssetFactoryF = await ethers.getContractFactory('AssetFactoryUpgradable');
  const MineF = await ethers.getContractFactory('MineUpgradeable');
  const GaugeController = await ethers.getContractFactory('GaugeControllerUpgradeable');
  const VotingEscrow = await ethers.getContractFactory('VotingEscrow');

  const MainToken = await MainTokenF.deploy('Project Twelve', '', 10000n * 10n ** 18n);
  const CoinFactory = await upgrades.deployProxy(CoinFactoryF, [
    MainToken.address,
    externalContract.uniswapFactory.address,
    externalContract.uniswapRouter.address,
    86400,
    ethers.utils.randomBytes(32),
  ]);
  const AssetFactory = await upgrades.deployProxy(AssetFactoryF, [CoinFactory.address]);
  const votingEscrow = await VotingEscrow.deploy(MainToken.address, 'Vote-escrowed ', 've');
  const gaugeController = await upgrades.deployProxy(GaugeController, [votingEscrow.address, CoinFactory.address]);
  const Mine = await upgrades.deployProxy(MineF, [
    MainToken.address,
    CoinFactory.address,
    gaugeController.address,
    60,
    60,
    5n * 10n ** 17n,
  ]);

  await writeAbiAddr(artifacts, MainToken.address, 'MainToken', network.name);
  await writeAbiAddr(artifacts, CoinFactory.address, 'CoinFactoryUpgradeable', network.name);
  await writeAbiAddr(artifacts, AssetFactory.address, 'AssetFactoryUpgradable', network.name);
  await writeAbiAddr(artifacts, votingEscrow.address, 'VotingEscrow', network.name);
  await writeAbiAddr(artifacts, gaugeController.address, 'GaugeControllerUpgradeable', network.name);
  await writeAbiAddr(artifacts, Mine.address, 'MineUpgradeable', network.name);

  return {
    MainToken: await ethers.getContractAt('MainToken', MainToken.address),
    CoinFactory: await ethers.getContractAt('CoinFactoryUpgradeable', CoinFactory.address),
    AssetFactory: await ethers.getContractAt('AssetFactoryUpgradable', AssetFactory.address),
    votingEscrow: await ethers.getContractAt('VotingEscrow', votingEscrow.address),
    gaugeController: await ethers.getContractAt('GaugeControllerUpgradeable', gaugeController.address),
    Mine: await ethers.getContractAt('MineUpgradeable', Mine.address),
  };
}

export async function setUp(ec: EconomyContract) {
  const accounts = await ethers.getSigners();
  const admin = accounts[0];

  await ec.CoinFactory.setMine(ec.Mine.address);
  await ec.CoinFactory.setGaugeController(ec.gaugeController.address);
  await ec.gaugeController.addType('liquidity', 1n * 10n ** 18n);

}

export async function deployAll(): Promise<EconomyContract & ExternalContract> {
  const ex = await deployExternal();
  const ec = await deployEconomyContract(ex);
  //console.log(ex);
  //console.log(ec);
  await setUp(ec);
  return { ...ex, ...ec };
}

//if (require.main === module) {
  deployAll().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
//}
