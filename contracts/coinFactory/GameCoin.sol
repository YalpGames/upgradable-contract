// SPDX-License-Identifier: GPL-3.0-only
pragma solidity 0.8.14;

import '@openzeppelin/contracts/token/ERC20/ERC20.sol';
import '@openzeppelin/contracts/access/Ownable.sol';
import '@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol';
import './interfaces/IGameCoin.sol';

contract GameCoin is IGameCoin, ERC20, ERC20Burnable, Ownable {
  /**
   * @dev Off-chain data, game id
   */
    string public override gameId;
    /**
   * @dev game coin's logo
   */
    string public override gameCoinUrl;

    constructor(
        string memory _name,
        string memory _symbol,
        string memory _gameId,
        string memory _gameCoinUrl,
        uint256 _amount
    ) ERC20(_name,_symbol){
        gameId = _gameId;
        gameCoinUrl = _gameCoinUrl;
        _mint(msg.sender,_amount);
    }

    function mint(address _to, uint256 _amount) public override onlyOwner {
        _mint(_to, _amount);
    }

  /**
   * @dev transfer function for just a basic transfer with an off-chain account
   * @dev called when a user want to deposit his coin from on-chain to off-chain
   * @param recipient address which receive the coin, usually be custodian address
   * @param account off-chain account
   * @param amount amount of this transfer
   */
  function transferWithAccount(
    address recipient,
    string memory account,
    uint256 amount
  ) external override {
    transfer(recipient, amount);
    emit TransferWithAccount(recipient, account, amount);
  }

}