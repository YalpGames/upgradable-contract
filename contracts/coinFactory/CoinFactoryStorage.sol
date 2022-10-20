// SPDX-License-Identifier: GPL-3.0-only
pragma solidity 0.8.14;

import '@uniswap/v2-periphery/contracts/interfaces/IUniswapV2Router02.sol';
import '@uniswap/v2-core/contracts/interfaces/IUniswapV2Factory.sol';
import '../staking/interfaces/IMineUpgradeable.sol';
import '../staking/interfaces/IGaugeController.sol';
import './interfaces/IGameCoin.sol';

contract CoinFactoryStorage {
  /**
   * @dev  main ERC20 address
   */
  address public mainCoin;
  /**
   * @dev uniswap v2 Router address
   */
  IUniswapV2Router02 public uniswapRouter;
  /**
   * @dev uniswap v2 Factory address
   */
  IUniswapV2Factory public uniswapFactory;
  /**
   * @dev length of cast delay time is a linear function of percentage of additional issues,
   * @dev delayK and delayB is the linear function's parameter which could be changed later
   */
  uint256 public delayK;
  uint256 public delayB;

  /**
   * @dev a random hash value for calculate mintId
   */
  bytes32 internal initHash;

  uint256 public addLiquidityEffectiveTime;

  /**
   * @dev  staking contract
   */
  IMineUpgradeable public mine;

  address public dev;
  IGaugeController public gaugeController;

  uint256[40] private __gap;

  // gameId => developer address
  mapping(string => address) public allGames;
  // gameCoinAddress => gameId
  mapping(IGameCoin => string) public allGameCoins;
  // gameCoinAddress => declareMintId => MintCoinInfo
  mapping(IGameCoin => mapping(bytes32 => MintCoinInfo)) public coinMintRecords;
  // gameCoinAddress => declareMintId
  mapping(IGameCoin => bytes32) public preMintIds;

  /**
   * @dev struct of each mint request
   */
  struct MintCoinInfo {
    uint256 amount;
    uint256 unlockTimestamp;
    bool executed;
  }
}
