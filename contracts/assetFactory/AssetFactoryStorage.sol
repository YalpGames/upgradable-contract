// SPDX-License-Identifier: GPL-3.0-only
pragma solidity 0.8.14;

contract AssetFactoryStorage {
  /**
    @dev collection address => gameId
  */
  mapping(address => string) public registry;

  /**
   * CoinFactory address, for reading game and developer relationship
   */
  address public coinFactory;

  uint256[49] private __gap;
}
