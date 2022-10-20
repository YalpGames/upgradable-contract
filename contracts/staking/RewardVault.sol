// SPDX-License-Identifier: GPL-3.0-only

pragma solidity 0.8.14;

import '@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol';
import '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import '@openzeppelin/contracts/access/Ownable.sol';
import '../token/interfaces/IToken.sol';
import './interfaces/IRewardVault.sol';

contract RewardVault is Ownable, IRewardVault {
    using SafeERC20 for IERC20;
    address public mainToken;

    constructor(address _token){
        require(_token != address(0), 'P12RV: address cannot be 0');
        mainToken = _token;
    }

    /**
    @notice Send reward to user
    @param to The address of awards 
    @param amount number of awards 
    */
    function reward(address to, uint256 amount) external onlyOwner{
        IERC20(mainToken).safeTransfer(to,amount);
    } // send reward

    /**
    @notice withdraw token Emergency
    */
    function withdrawEmergency(address to) external onlyOwner{
        require(address(to) != address(0),'address is error!');
        IERC20(mainToken).safeTransfer(to,IERC20(mainToken).balanceOf(address(this)));
        emit WithdrawEmergency(to, IERC20(mainToken).balanceOf(address(this)));
    }

}