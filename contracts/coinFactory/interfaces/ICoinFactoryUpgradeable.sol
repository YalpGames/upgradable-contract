// SPDX-License-Identifier: GPL-3.0-only
pragma solidity 0.8.14;

import '@uniswap/v2-periphery/contracts/interfaces/IUniswapV2Router02.sol';
import '@uniswap/v2-core/contracts/interfaces/IUniswapV2Factory.sol';

import '../../staking/interfaces/IMineUpgradeable.sol';
import '../../staking/interfaces/IGaugeController.sol';
import './IGameCoin.sol';

interface ICoinFactoryUpgradeable {

  // register gameId =>developer
    function register(string memory gameId,address developer) external;
  // mint game coin
    function create(
        string memory name,
        string memory symbol,
        string memory gameId,
        string memory gameCoinUrl,
        uint256 amountGameCoin,
        uint256 amountMain
    )external returns(IGameCoin);

  //  mint coin and Launch a statement
    function queueMintCoin(string memory gameId, IGameCoin gameCoinAddress, uint256 amountGameCoin) external returns(bool);
  //// execute Mint coin
    function executeMintCoin(IGameCoin gameCoinAddress, bytes32 mintId) external returns(bool);
  //withdraw
    function withdraw(address userAddress, IGameCoin gamrCoinAddress,uint256 amountGameCoin) external returns(bool);
    
    function setDev(address newDev) external;

    function setMainCoin(address mainTokenAddress) external;

    function setUniswapFactory(IUniswapV2Factory newUniswapFactory) external;

    function setUniswapRouter(IUniswapV2Router02 newUniswapRouter) external;

    function setMine(IMineUpgradeable newMine) external;

    // function setGaugeController(IGaugeController newGaugeController) external;

    function setDelayK(uint256 newDelayK) external returns(bool);

    function setDelayB(uint256 newDelayB) external returns(bool);

    //get mint free
    function getMintFee(IGameCoin gameCoinAddress, uint256 amountGameCoin) external returns(uint256);
     //get mint delay 
    function getMintDelay(IGameCoin gameCoinAddress, uint256 amountGameCoin) external returns(uint256);

    // register Game developer log
    event RegisterGame(string gameId, address indexed developer);

    // register Game coin log
    event CreateGameCoin(IGameCoin indexed gameCoinAddress, string gameId, uint256 amount);

    // mint coin in future log
    event QueueMintCoin(
        bytes32 indexed mintId,
        IGameCoin indexed gameCoinAddress,
        uint256 mintAmount,
        uint256 unlockTimestamp,
        uint256 amount
    );

    // mint coin success log
    event ExecuteMintCoin(bytes32 indexed mintId, IGameCoin indexed gameCoinAddress, address indexed executor);

    // game player withdraw gameCoin
    event Withdraw(address userAddress, IGameCoin gameCoinAddress, uint256 amountGameCoin);

    event SetDev(address oldDev, address newDev);

    event SetMainsToken(address oldMainToken, address newMainToken);

    event SetUniswapFactory(IUniswapV2Factory oldUniswapFactory,IUniswapV2Factory newUniswapFactory);

    event SetUniswapRouter(IUniswapV2Router02 oldUniswapRouter,IUniswapV2Router02 newUniswapRouter);

    event SetMine(IMineUpgradeable oldMine,IMineUpgradeable newMine);
    
    event SetGaugeController(IGaugeController oldGaugeController, IGaugeController newGaugeController);

    // change delayB log
    event SetDelayB(uint256 oldDelayB, uint256 newDelayB);

    // change delayK log
    event SetDelayK(uint256 oldDelayK, uint256 newDelayK);

}