// SPDX-License-Identifier: GPL-3.0-only

pragma solidity 0.8.14;

import '@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol';
import '@openzeppelin/contracts/utils/math/SafeMath.sol';
import '@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol';
import '@openzeppelin/contracts/utils/math/Math.sol';
import '@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol';
import '@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol';
import '@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol';
import '@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol';

import { IRewardVault, RewardVault } from './RewardVault.sol';
import './interfaces/IMineUpgradeable.sol';
import './interfaces/IGaugeController.sol';
import './MineStorage.sol';
import '../token/interfaces/IToken.sol';

contract MineUpgradeable is 
  MineStorage,
  IMineUpgradeable,
  UUPSUpgradeable,
  OwnableUpgradeable,
  ReentrancyGuardUpgradeable,
  PausableUpgradeable
  {
    using SafeERC20Upgradeable for IERC20Upgradeable;
    using Math for uint256;

    uint256 public constant ONE = 10**18;
    uint256 public constant WEEK = 7 * 86400;

    // ============ External ============

    /**
    @notice set new CoinFactory
    @param newCoinFactory address of CoinFactory
    */
    function setMainCoinFactory(address newCoinFactory) external onlyOwner {
        address oldCoinFactory = mainCoinFactory;
        require(newCoinFactory != address(0), 'Mine: CoinFactory cannot be 0');
        mainCoinFactory = newCoinFactory;
        emit SetFactory(oldCoinFactory, newCoinFactory);
    }

    /**
    @notice set new gaugeController
    @param newGaugeController address of gaugeController
    */
    function setGaugeController(IGaugeController newGaugeController) external onlyOwner {
        IGaugeController oldGaugeController = gaugeController;
        require(address(newGaugeController) != address(0), 'Mine: gc cannot be 0');
        gaugeController = newGaugeController;
        emit SetGaugeController(oldGaugeController, newGaugeController);
    }

    function getPoolLength() external view onlyOwner returns(uint256){
        poolInfos.length;
    }

        
    /**
    @notice withdraw token Emergency
    */
    function withdrawEmergency() external  onlyOwner onlyEmergency {
        rewardVault.withdrawEmergency(msg.sender);
    }

    /**
        @notice update checkpoint for poolInfo
        @param lpToken Address of lpToken
    */
    function checkpoint(address lpToken) external {
        uint256 pid = getPid(lpToken);
        _checkpoint(pid);
    }


    // ============ public  ============

    function pause() public onlyOwner {
        _pause();
    }

    function unpause() public onlyOwner {
        _unpause();
    }

    /**
        @notice Contract initialization
        @param _mainToken Address of Token
        @param _mainCoinFactory Address of CoinFactory
        @param _gaugeController address of gaugeController
        @param _delayK delayK_ is a coefficient
        @param _delayB delayB_ is a coefficient
    */
    function initialize(
        address _mainToken,
        address _mainCoinFactory,
        address _gaugeController,
        uint256 _delayK,
        uint256 _delayB,
        uint256 _rate
    ) public initializer {
        require(_mainToken != address(0), 'Mine: Token cannot be 0');
        require(_mainCoinFactory != address(0), 'Mine: CoinFactory cannot be 0');

        mainToken = _mainToken;
        mainCoinFactory = _mainCoinFactory;
        gaugeController = IGaugeController(_gaugeController);
        rewardVault = IRewardVault(new RewardVault(mainToken));
        delayK = _delayK;
        delayB = _delayB;
        rate = _rate;

        __ReentrancyGuard_init();
        __Pausable_init();
        __Ownable_init();
    }

    /**
        @notice get withdraw unlockTimestamp
        @param lpToken Address of lpToken
        @param amount Number of lpToken
    */
    function getWithdrawUnlockTimestamp(address lpToken, uint256 amount) public view  returns (uint256) {
        uint256 pid = getPid(lpToken);
        bytes32 withdrawId = preWithdrawIds[lpToken];
        WithdrawInfo memory withdrawInfo =  withdrawInfos[lpToken][withdrawId];
        uint256 lastUnlockTimestamp = withdrawInfo.unlockTimestamp;
        uint256 currentTimestamp = block.timestamp;
        PoolInfo memory poolInfo = poolInfos[pid];
        uint256 time =  currentTimestamp >= lastUnlockTimestamp ? currentTimestamp : lastUnlockTimestamp;
        uint256 delay = (amount * delayK) / IERC20Upgradeable(poolInfo.lpToken).totalSupply() + delayB;
        uint256 unlockTimestamp = delay + time;
        return unlockTimestamp;
    }

    /**
        @notice Get poolInfo id
        @param lpToken Address of lpToken
    */
    function getPid(address lpToken) public view  returns (uint256) {
        require(lpTokenRegistry[lpToken] > 0, 'Mine: LP Token Not Exist');
        return lpTokenRegistry[lpToken] - 1;
    }
        
    /**
        @notice Get user lpToken balance
        @param lpToken Address of lpToken
        @param user LpToken holder
        @return Get lpToken balance 
    */
    function getUserLpBalance(address lpToken, address user) public view  returns (uint256) {
        uint256 pid = getPid(lpToken);
        return userInfo[pid][user].amount;
    }

    /**
        @notice This method is only used when creating game coin in CoinFactory
        @param lpToken Address of lpToken
        @param gameCoinCreator user of game coin creator
    */
    function addLpTokenInfoForGameCreator(
        address lpToken,
        uint256 amount,
        address gameCoinCreator
    ) public  whenNotPaused onlyCoinFactory {
        createPool(lpToken);
        uint256 pid = getPid(lpToken);
        uint256 totalLpStaked = IERC20Upgradeable(lpToken).balanceOf(address(this));
        PoolInfo storage poolInfo = poolInfos[pid];
        UserInfo storage userInfo = userInfo[pid][gameCoinCreator];
        require(amount <= totalLpStaked - poolInfo.amount && amount > 0, 'Mine: amount not met');
        poolInfo.period += 1;
        poolInfo.amount += amount;
        poolInfo.lpToken = lpToken;
        userInfo.amount += amount;
        userInfo.rewardDebt =  (userInfo.amount * poolInfo.accPerShare) / ONE;
        periodTimestamp[poolInfo.lpToken][poolInfo.period] = block.timestamp;

    }
    // ============ Ownable ============

    /**
        @notice set the isEmergency to true
    */

    function emergency() public  onlyOwner {
        require(!isEmergency, 'Mine: already exists');
        isEmergency = true;
        uint256 delayTime = 86400;
        emergencyUnlockTime = block.timestamp + delayTime;
        emit Emergency(msg.sender, emergencyUnlockTime);
    }

    /**
        @notice Create a new poolInfo
        @param lpToken Address of lpToken
    */
    function createPool(address lpToken) public  whenNotPaused onlyCoinFactory {
        require(lpTokenRegistry[lpToken] == 0, 'Mine: LP Token Already Exist');
        poolInfos.push(PoolInfo({lpToken:lpToken,accPerShare:0,amount:0,period:0}));
        lpTokenRegistry[lpToken] =  poolInfos.length;
        periodTimestamp[lpToken][0] = block.timestamp;
    }

    /**
        @notice Set delayK value 
        @param newDelayK Is a coefficient
        @return Get bool result 
    */
    function setDelayK(uint256 newDelayK) public  onlyOwner returns (bool) {
        uint256 oldDelayK = delayK;
        delayK = newDelayK;
        emit SetDelayK(oldDelayK, delayK);
        return true;
    }

    /**
        @notice Set delayB value 
        @param newDelayB Is a coefficient
        @return Get bool result 
    */
    function setDelayB(uint256 newDelayB) public  onlyOwner returns (bool) {
        uint256 oldDelayB = delayB;
        delayB = newDelayB;
        emit SetDelayB(oldDelayB, delayB);
        return true;
    }

    /**
        @notice set new rate
        @param newRate is  token inflation rate 
    */
    function setRate(uint256 newRate) public  onlyOwner returns (bool) {
        uint256 oldRate = rate;
        rate = newRate;
        checkpointAll();
        emit SetRate(oldRate, newRate);
        return true;
    }


    /**
        @notice update checkpoint for all poolInfo
    */
    function checkpointAll() public  {
        uint256 length = poolInfos.length;
        for (uint256 pid = 0; pid < length; pid++) {
            _checkpoint(pid);
        }
    }

    // ============ Deposit & Withdraw & Claim & ============
    // Deposit & withdraw will also trigger claim

    /**
        @notice Deposit lpToken
        @param lpToken Address of lpToken
        @param amount Number of lpToken
    */
    function deposit(address lpToken, uint256 amount) public  whenNotPaused nonReentrant {
        uint256 pid = getPid(lpToken);
        PoolInfo storage poolInfo = poolInfos[pid];
        UserInfo storage user = userInfo[pid][msg.sender];

        _checkpoint(pid);
        if (user.amount > 0) {
        uint256 pending = (user.amount * poolInfo.accPerShare) / ONE - user.rewardDebt;
            _safeTransfer(msg.sender, pending);
        }
        require(amount != 0, 'Mine: need amount > 0');
        user.amount += amount;
        poolInfo.amount += amount;
        IERC20Upgradeable(poolInfo.lpToken).safeTransferFrom(msg.sender, address(this), amount);
        user.rewardDebt = (user.amount * poolInfo.accPerShare) / ONE;
        emit Deposit(msg.sender, pid, amount, user.amount, poolInfo.amount);
    }

    /**
    @notice Withdraw lpToken delay
    @param lpToken Address of lpToken
    @param amount Number of lpToken
    */
    function queueWithdraw(address lpToken, uint256 amount) public  whenNotPaused nonReentrant {
        uint256 pid = getPid(lpToken);
        PoolInfo memory poolInfo = poolInfos[pid];
        UserInfo memory user = userInfo[pid][msg.sender];
        require(user.amount >= amount, 'Mine: withdraw too much');
        _checkpoint(pid);
        if (user.amount > 0) {
        uint256 pending = (user.amount * poolInfo.accPerShare) / ONE - user.rewardDebt;
        _safeTransfer(msg.sender, pending);
        }

        uint256 unlockTimestamp = getWithdrawUnlockTimestamp(lpToken, amount);
        bytes32 newWithdrawId = _createWithdrawId(lpToken, amount, msg.sender);
        withdrawInfos[lpToken][newWithdrawId] = WithdrawInfo(msg.sender, amount, unlockTimestamp, false);
        user.rewardDebt = (user.amount * poolInfo.accPerShare) / ONE;
        emit QueueWithdraw(msg.sender, pid, amount, newWithdrawId, unlockTimestamp);
    }

    /**
        @notice Get pending rewards
        @param lpToken Address of lpToken
    */
    function claim(address lpToken) public  nonReentrant whenNotPaused {
        uint256 pid = getPid(lpToken);
        require(userInfo[pid][msg.sender].amount > 0, 'Mine: no staked token');
        PoolInfo storage poolInfo = poolInfos[pid];
        UserInfo storage user = userInfo[pid][msg.sender];
        _checkpoint(pid);
        uint256 pending = (user.amount * poolInfo.accPerShare) / ONE - user.rewardDebt;
        user.rewardDebt = (user.amount * poolInfo.accPerShare) / ONE;
        _safeTransfer(msg.sender, pending);
    }

    /**
        @notice Get all pending rewards
    */
    function claimAll() public  nonReentrant whenNotPaused {
        uint256 poolLength =  poolInfos.length;
        uint256 pending = 0;
        for(uint pid = 0; pid < poolLength; pid++){
            if (userInfo[pid][msg.sender].amount == 0) {
                continue; // save gas
            }
            PoolInfo storage poolInfo = poolInfos[pid];
            UserInfo storage user = userInfo[pid][msg.sender];
            _checkpoint(pid);
            pending += (user.amount * poolInfo.accPerShare) / ONE - user.rewardDebt;
            user.rewardDebt = (user.amount * poolInfo.accPerShare) / ONE;
        }
        _safeTransfer(msg.sender, pending);
    }

    
    /**
        @notice Withdraw lpToken
        @param lpToken Address of lpToken
        @param id Withdraw id 
    */
    function executeWithdraw(address lpToken, bytes32 id) public  nonReentrant whenNotPaused {
        WithdrawInfo storage withdrawInfo =  withdrawInfos[lpToken][id];
        require(withdrawInfo.who == address(msg.sender),'msg.sender is not who!');
        require(block.timestamp >= withdrawInfo.unlockTimestamp,'unlockTimestamp not secceseced!');
        require(withdrawInfo.executed == false,'executed is true');
        withdrawInfo.executed = true;
        uint256 pid = getPid(lpToken);
        PoolInfo storage poolInfo =  poolInfos[pid];
        UserInfo storage userInfo = userInfo[pid][withdrawInfo.who];
        require(withdrawInfos[lpToken][id].amount <= userInfo.amount, 'Mine: withdraw too much');
        _checkpoint(pid);
        uint256 pending = (userInfo.amount * poolInfo.accPerShare) / ONE - userInfo.rewardDebt;
        uint256 amount = withdrawInfos[lpToken][id].amount;
        userInfo.amount -= amount;
        poolInfo.amount -= amount;
        userInfo.rewardDebt = (userInfo.amount * poolInfo.accPerShare) / ONE;
        _safeTransfer(withdrawInfo.who, pending);
        IERC20Upgradeable(poolInfo.lpToken).safeTransfer(address(withdrawInfo.who), amount);
        emit ExecuteWithdraw(withdrawInfo.who, pid, amount, userInfo.amount, poolInfo.amount);
    }
        

    /**
    ​    @notice withdraw all lpToken Emergency
        @param lpToken address of lpToken
    */
    function withdrawLpTokenEmergency(address lpToken) public  nonReentrant onlyEmergency {
        uint256 pid = getPid(lpToken);
        PoolInfo storage poolInfo = poolInfos[pid];
        UserInfo storage user = userInfo[pid][msg.sender];
        require(user.amount > 0, 'Mine: without any lpToken');
        uint256 amount = user.amount;
        user.amount = 0;
        user.rewardDebt = 0;
        poolInfo.amount -= amount;
        IERC20Upgradeable(poolInfo.lpToken).safeTransfer(address(msg.sender), amount);
        emit WithdrawLpTokenEmergency(lpToken, amount);
    }

    /**
    ​    @notice withdraw lpToken Emergency
    */

    function withdrawAllLpTokenEmergency() public  {
        uint256 length = poolInfos.length;

        for (uint256 pid = 0; pid < length; pid++) {
        if (userInfo[pid][msg.sender].amount == 0) {
            continue; // save gas
        }
        PoolInfo memory poolInfo = poolInfos[pid];
            withdrawLpTokenEmergency(poolInfo.lpToken);
        }
    }
    // ============ internal  ============    


    /**
        @notice Transfer  to user
        @param  to The address of receiver
        @param amount Number of 
    */
    function _safeTransfer(address to, uint256 amount) internal virtual {
        rewardVault.reward(to, amount);
        realizedReward[to] = realizedReward[to] + amount;
        emit Claim(to, amount);
    }

    /**
        @notice Create withdraw id
        @param lpToken Address of lpToken
        @param amount Number of lpToken
        @param to Address of receiver
        @return hash Get a withdraw Id
    */
    function _createWithdrawId(
        address lpToken,
        uint256 amount,
        address to
    ) internal virtual returns (bytes32 hash) {
        bytes32 preWithdrawId = preWithdrawIds[lpToken];
        bytes32 withdrawId = keccak256(abi.encode(lpToken, amount, to, preWithdrawId));
        preWithdrawIds[lpToken] = withdrawId;
        return withdrawId;
    }

    // ============ checkpoint ============
    
    /**
        @notice update checkpoint for poolInfo
        @param pid Pool Id
    */
    function _checkpoint(uint256 pid) internal virtual whenNotPaused {
        PoolInfo storage poolInfo = poolInfos[pid];
        uint256 _accPerShare = poolInfo.accPerShare;
        uint256 _periodTime = periodTimestamp[poolInfo.lpToken][poolInfo.period];
        gaugeController.checkpointGauge(address(poolInfo.lpToken));
        require(block.timestamp > _periodTime, 'Mine: not time to check');

        if (poolInfo.amount == 0) {
            poolInfo.period += 1;
            periodTimestamp[poolInfo.lpToken][poolInfo.period] = block.timestamp;
            return;
        }
        uint256 prevWeekTime = _periodTime;
        uint256 weekTime = Math.min(((_periodTime + WEEK) / WEEK) * WEEK, block.timestamp);
        for (uint256 i = 0; i < 500; i++) {
            uint256 dt = weekTime - prevWeekTime;
            uint256 w = gaugeController.gaugeRelativeWeight(poolInfo.lpToken, (prevWeekTime / WEEK) * WEEK);
            _accPerShare += (rate * w * dt) / poolInfo.amount;
            if (weekTime == block.timestamp) {
                break;
            }
            prevWeekTime = weekTime;
            weekTime = Math.min(weekTime + WEEK, block.timestamp);
        }
        poolInfo.accPerShare = _accPerShare;
        poolInfo.period += 1;
        periodTimestamp[poolInfo.lpToken][poolInfo.period] = block.timestamp;
        emit Checkpoint(poolInfo.lpToken, poolInfo.amount, poolInfo.accPerShare);
    }

    
    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}

  // ============ Modifiers ============

    // check Emergency
    modifier onlyEmergency() {
        require(isEmergency, 'Mine: no emergency now');
        require(block.timestamp >= emergencyUnlockTime, 'Mine: not unlocked yet');
        _;
    }

    modifier onlyCoinFactory() {
        require(msg.sender == mainCoinFactory,'msg sneder not is mainCoinFactory!');
        _;
    }
}


