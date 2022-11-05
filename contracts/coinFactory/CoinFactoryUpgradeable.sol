// SPDX-License-Identifier: GPL-3.0-only
pragma solidity 0.8.14;

import '@uniswap/v2-periphery/contracts/interfaces/IUniswapV2Router02.sol';
import '@uniswap/v2-core/contracts/interfaces/IUniswapV2Factory.sol';
import '@uniswap/v2-core/contracts/interfaces/IUniswapV2Pair.sol';
import '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import '@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol';
import '@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol';
import '@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol';
import '@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol';
import '@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol';
import '@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol';

import './interfaces/ICoinFactoryUpgradeable.sol';
import './interfaces/IGameCoin.sol';
import '../staking/interfaces/IMineUpgradeable.sol';
import '../staking/interfaces/IGaugeController.sol';
import './CoinFactoryStorage.sol';
import './GameCoin.sol';

contract CoinFactoryUpgradeable is 
    CoinFactoryStorage,
    UUPSUpgradeable,
    ICoinFactoryUpgradeable,
    OwnableUpgradeable,
    ReentrancyGuardUpgradeable,
    PausableUpgradeable
{
    using SafeERC20Upgradeable for IERC20Upgradeable;
    
    // register gameId =>developer
    function register(string memory gameId,address developer) external onlyOwner {
        allGames[gameId] = developer;
        emit RegisterGame(gameId,developer);
    }

    function setMainCoin(address newMainTokenAddress) external onlyOwner {
        require(newMainTokenAddress != address(0), 'mainCoin: address cannot be 0');
        address oldMainTokenAddress = mainCoin;
        mainCoin =  newMainTokenAddress;
        emit SetMainsToken(oldMainTokenAddress, newMainTokenAddress);
    }

    function setDev(address newDev) external onlyOwner{
        require(newDev != address(0),'newDev: address cannot be 0s');
        address oldDev = dev;
        dev = newDev;
        emit SetDev(oldDev,dev);
    }
    
    function setUniswapFactory(IUniswapV2Factory newUniswapFactory) external onlyOwner {
        require(address(newUniswapFactory) != address(0),'newUniswapFactory: address cannot be 0s');
        IUniswapV2Factory oldUniswapFactory = newUniswapFactory;
        uniswapFactory =  newUniswapFactory;
        emit SetUniswapFactory(oldUniswapFactory,newUniswapFactory);
    }

    function setUniswapRouter(IUniswapV2Router02 newUniswapRouter) external onlyOwner {
        require(address(newUniswapRouter) != address(0),'newUniswapRouter: address cannot be 0s');
        IUniswapV2Router02 oldUniswapRouterAddresss = uniswapRouter;
        uniswapRouter =  newUniswapRouter;
        emit SetUniswapRouter(oldUniswapRouterAddresss,newUniswapRouter);
    }

    function setMine(IMineUpgradeable newMine) external onlyOwner{
        require(address(newMine) != address(0),'newMine: address cannot be 0s');
        IMineUpgradeable oldMine =  mine;
        mine = newMine;
        emit SetMine(oldMine,newMine);
    }
    
    function setGaugeController(IGaugeController newGaugeController) external onlyOwner{
         require(address(newGaugeController) != address(0),'newGaugeController: address cannot be 0s');
         IGaugeController oldGaugeController =  gaugeController;
         gaugeController = newGaugeController;
         emit SetGaugeController(oldGaugeController,newGaugeController);
    }

    function setDelayK(uint256 newDelayK) external onlyOwner returns (bool) {
        uint256 oldDelayK = delayK;
        delayK = newDelayK;
        emit SetDelayK(oldDelayK,newDelayK);
        return true;
    }

    function setDelayB(uint256 newDelayB) external onlyOwner returns (bool){
        uint256 oldDelayB = delayB;
        delayB = newDelayB;
        emit SetDelayB(oldDelayB,newDelayB);
        return true;
    }

    // mint game coin
    function create(
        string memory name,
        string memory symbol,
        string memory gameId,
        string memory gameCoinUrl,
        uint256 amountGameCoin,
        uint256 amountMain
    )external virtual override nonReentrant whenNotPaused returns(IGameCoin gameCoinAddress){
        require(allGames[gameId] == msg.sender,'create account not developer!');
        require(amountMain > 0 ,'amountMain not enough !');

        gameCoinAddress = new GameCoin(name, symbol, gameId, gameCoinUrl, amountGameCoin);
        uint256 amountGameCoinDesired = amountGameCoin / 2;
        IERC20(mainCoin).transferFrom(msg.sender , address(this), amountMain);
        IERC20(mainCoin).approve(address(uniswapRouter), ~uint256(0));
        IERC20(address(gameCoinAddress)).approve(address(uniswapRouter),~uint256(0));
        uint256 liquidity0;
        (,,liquidity0) = uniswapRouter.addLiquidity(
            mainCoin,
            address(gameCoinAddress),
            amountMain,
            amountGameCoinDesired,
            amountMain,
            amountGameCoinDesired,
            address(mine),
            getBlockTimestamp() + addLiquidityEffectiveTime
        );

        //get Lp address 
        address pair = uniswapFactory.getPair(mainCoin, address(gameCoinAddress));
        require(pair != address(0),'pair address error !');
        //get lp token values
        uint256 liquidity1 =  IUniswapV2Pair(pair).balanceOf(address(mine));
        require(liquidity0 == liquidity1, 'Factory: liquidities not =');

        // add pair address to Controller,100 is init weight
        gaugeController.addGauge(pair, 0, 100);

        // create a new pool and add staking info
        mine.addLpTokenInfoForGameCreator(pair, liquidity1, msg.sender);

        allGameCoins[gameCoinAddress] = gameId;
        emit CreateGameCoin(gameCoinAddress, gameId, amountMain);
        return IGameCoin(gameCoinAddress);
    }

  //  mint coin and Launch a statement
    function queueMintCoin(string memory gameId, IGameCoin gameCoinAddress, uint256 amountGameCoin) nonReentrant whenNotPaused external returns(bool){
        require(msg.sender == allGames[gameId],'msg sender not gameid developer!');
        require(address(gameCoinAddress) != address(0),'gameCoin address error!');
        require(compareStrings(allGameCoins[gameCoinAddress], gameId), 'Factory: wrong game id');
        
        uint256 currentTimestamp = getBlockTimestamp();
        uint256 mintIdTime = coinMintRecords[gameCoinAddress][preMintIds[gameCoinAddress]].unlockTimestamp;
        uint256 time;
        if(currentTimestamp > mintIdTime){
            time = currentTimestamp;
        }else{
            time = mintIdTime;
        }
        //get maincoin fee
        uint256 mainCoinAmount = getMintFee(gameCoinAddress,amountGameCoin);
        IERC20Upgradeable(mainCoin).safeTransferFrom(msg.sender,address(this),mainCoinAmount);
        //get mintId
        bytes32 mintId = _hashOperation(gameCoinAddress, msg.sender, amountGameCoin, time, initHash);
        //get delay time
        uint256 delayD = getMintDelay(gameCoinAddress, amountGameCoin);
        
        MintCoinInfo memory mintCoinInfo;
        mintCoinInfo.amount = amountGameCoin;
        mintCoinInfo.unlockTimestamp = time + delayD;
        mintCoinInfo.executed = false;
        coinMintRecords[gameCoinAddress][mintId]= mintCoinInfo;

        emit QueueMintCoin(mintId, gameCoinAddress, amountGameCoin, delayD + time, mainCoinAmount);
        return true;
    }

  //// execute Mint coin
    function executeMintCoin(IGameCoin gameCoinAddress, bytes32 mintId) nonReentrant whenNotPaused external returns(bool){
        require(address(gameCoinAddress) !=  address(0),'gameCoinAddress error!');
        require(coinMintRecords[gameCoinAddress][mintId].executed == false,'mintId is minted!');
        uint256 blockTime = getBlockTimestamp();
        require(coinMintRecords[gameCoinAddress][mintId].unlockTimestamp < blockTime,'unlockTimestamp not to mint');
           // Modify status
        coinMintRecords[gameCoinAddress][mintId].executed = true;

        IGameCoin(gameCoinAddress).mint(address(this),coinMintRecords[gameCoinAddress][mintId].amount);
        emit ExecuteMintCoin(mintId, gameCoinAddress, msg.sender);
        return true;
    }

  //withdraw
    function withdraw(address userAddress, IGameCoin gameCoinAddress,uint256 amountGameCoin) external returns(bool){
        require(address(gameCoinAddress) !=  address(0),'gameCoinAddress cannot be 0');
        require(amountGameCoin > 0,'amountGameCoin should be > 0 ');
        require(IGameCoin(gameCoinAddress).balanceOf(address(this)) > amountGameCoin , 'user Address balance not enugh');
        IERC20Upgradeable(address(gameCoinAddress)).safeTransfer(userAddress, amountGameCoin);
        emit Withdraw(userAddress, gameCoinAddress, amountGameCoin);
        return true;
    }

    /**public */
    function pause() public onlyOwner {
        _pause();
    }

    function unpause() public onlyOwner {
        _unpause();
    }

    function initialize(
        address _mainCoin,
        address _uniswapFactory,
        address _uniswapRouter,
        uint256 _effectiveTime,
        bytes32 _initHash
    ) public initializer {
        require(_mainCoin != address(0), 'GameCoin: main token cannot be 0');
        require(address(_uniswapFactory) != address(0), 'GameCoin: uniswapF cannot be 0');
        require(address(_uniswapRouter) != address(0), 'GameCoin: uniswapR cannot be 0');

        mainCoin = _mainCoin;
        uniswapFactory = IUniswapV2Factory(_uniswapFactory);
        uniswapRouter = IUniswapV2Router02(_uniswapRouter);
        initHash = _initHash;
        addLiquidityEffectiveTime = _effectiveTime;
        //IERC20Upgradeable(mainCoin).safeApprove(address(uniswapRouter), type(uint256).max);

        __ReentrancyGuard_init();
        __Pausable_init();
        __Ownable_init();
    }

     //get mint delay 
    function getMintDelay(IGameCoin gameCoinAddress, uint256 amountGameCoin) public view returns(uint256){
        uint256 time = (amountGameCoin * delayK) / (IGameCoin(gameCoinAddress).totalSupply()) + delayB;
        return time;
    }

 /**
   * @dev get mint free
   */
  function getMintFee(IGameCoin gameCoinAddress, uint256 amountGameCoin) public view returns (uint256 amountMainCoin){
    uint256 gameCoinReserved;
    uint256 mainReserved;
    if (mainCoin < address(gameCoinAddress)) {
      (mainReserved, gameCoinReserved, ) = IUniswapV2Pair(uniswapFactory.getPair(address(gameCoinAddress), mainCoin)).getReserves();
    } else {
      (gameCoinReserved, mainReserved, ) = IUniswapV2Pair(uniswapFactory.getPair(address(gameCoinAddress), mainCoin)).getReserves();
    }

    // overflow when Reserved * amountGameCoin > 2^256 ~= 10^77
    amountMainCoin = (mainReserved * amountGameCoin) / (gameCoinReserved * 100);

    return amountMainCoin;
  }

     /**
   * @dev get current block's timestamp
   */
    function getBlockTimestamp() internal view virtual returns (uint256) {
        return block.timestamp;
    }

  /**
   * @dev hash function to general mintId
   * @param gameCoinAddress game coin address
   * @param declarer address which declare to mint game coin
   * @param amount how much to mint
   * @param timestamp time when declare
   * @param salt a random bytes32
   * @return hash mintId
   */
  function _hashOperation(
    IGameCoin gameCoinAddress,
    address declarer,
    uint256 amount,
    uint256 timestamp,
    bytes32 salt
  ) internal virtual returns (bytes32 hash) {
    bytes32 preMintId = preMintIds[gameCoinAddress];

    bytes32 preMintIdNew = keccak256(abi.encode(gameCoinAddress, declarer, amount, timestamp, preMintId, salt));
    preMintIds[gameCoinAddress] = preMintIdNew;
    return preMintIdNew;
  }

   /**
   * @dev compare two string and judge whether they are the same
   */
  function compareStrings(string memory a, string memory b) internal pure virtual returns (bool) {
    return (keccak256(abi.encodePacked((a))) == keccak256(abi.encodePacked((b))));
  }

  function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}

}