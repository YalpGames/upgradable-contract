// SPDX-License-Identifier: GPL-3.0-only
pragma solidity 0.8.15;

import './IAsset.sol';
interface IAssetFactoryUpgradable {
  /**
   * @dev record a new Collection Created
   */
  event CollectionCreated(address indexed collection, address indexed developer);

  /**
   * @dev record a new Sft created, sft is semi-fungible token, as it's in a ERC1155 contract
   */
  event SftCreated(address indexed collection, uint256 indexed tokenId, uint256 amount);

  event SetCoinFactory(address oldCoinFactory, address newCoinFactory);

  function setCoinFactory(address newCoinFactory) external;

  function createCollection(string calldata gameId, string calldata contractURI) external returns(IAsset);

  function createAssetAndMint(
    address,
    uint256,
    string calldata
  ) external;

  function updateCollectionUri(address, string calldata) external;

  function updateSftUri(
    address,
    uint256,
    string calldata
  ) external;
}
