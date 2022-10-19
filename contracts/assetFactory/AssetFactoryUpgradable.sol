
// SPDX-License-Identifier: GPL-3.0-only
pragma solidity 0.8.15;

import '@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol';
import '@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol';
import '@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol';
import '@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol';

import './interfaces/IAsset.sol';
import './interfaces/IAssetFactoryUpgradable.sol';
import './AssetFactoryStorage.sol';
import '../coinFactory/CoinFactoryUpgradeable.sol';
import './Asset.sol';

contract AssetFactoryUpgradable is
    AssetFactoryStorage,
    IAssetFactoryUpgradable,
    UUPSUpgradeable,
    OwnableUpgradeable,
    ReentrancyGuardUpgradeable,
    PausableUpgradeable
{
    //contract project init
    function initialize(address _coinFactory) public initializer {
        require(_coinFactory != address(0), 'AssetFactory: _coinFactory cannot be 0');
        coinFactory = _coinFactory;

        __ReentrancyGuard_init();
        __Pausable_init();
        __Ownable_init();
    }

    function pause() public onlyOwner {
        _pause();
    }

    function unpause() public onlyOwner {
        _unpause();
    }

    /** upgrade function */
    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}

    //----- external ------

    function setCoinFactory(address newCoinFactory) external onlyOwner {
        address oldCoinFactory = coinFactory;
        coinFactory = newCoinFactory;
        emit SetCoinFactory(oldCoinFactory, newCoinFactory);
    }

    function createCollection(string calldata gameId, string calldata contractURI) external whenNotPaused onlyDeveloper(gameId) returns(IAsset){
        IAsset collection = new Asset(contractURI);
        // record creator
        registry[address(collection)] = gameId;
        emit CollectionCreated(address(collection), msg.sender);
        return collection;

    }

    function createAssetAndMint(
    address collection,
    uint256 amount,
    string calldata _uri
    ) external onlyCollectionDeveloper(collection) whenNotPaused nonReentrant {
        // create
        uint256 tokenId = Asset(collection).create(amount, _uri);
        // mint to developer address
        Asset(collection).mint(msg.sender, tokenId, amount, new bytes(0));

        emit SftCreated(address(collection), tokenId, amount);
    }

    function updateCollectionUri(address collection, string calldata _contracUrl) external onlyCollectionDeveloper(collection) whenNotPaused {
        Asset(collection).setContractURI(_contracUrl);
    }

    function updateSftUri(
    address collection,
    uint256 _id,
    string calldata _uri
    ) external onlyCollectionDeveloper(collection) whenNotPaused{
         Asset(collection).setUri(_id,_uri);
    }


    modifier onlyDeveloper(string memory _gameId){
        require(CoinFactoryUpgradeable(coinFactory).allGames(_gameId) == msg.sender,'not game developer!');
        _;
    }

    modifier onlyCollectionDeveloper(address _collection){
        require(CoinFactoryUpgradeable(coinFactory).allGames(registry[_collection]) == msg.sender,'not collection developer!');
        _;
    }
}