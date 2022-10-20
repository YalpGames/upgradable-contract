// SPDX-License-Identifier: GPL-3.0-only

pragma solidity 0.8.14;

import './interfaces/IAsset.sol';
import '@openzeppelin/contracts/token/ERC1155/ERC1155.sol';
import '@openzeppelin/contracts/access/Ownable.sol';

contract Asset is IAsset, ERC1155(''), Ownable {
    /**
    **/

    /**
    * @dev contract-level metadata uri, refer to https://docs.opensea.io/docs/contract-level-metadata
    */
    string public contractURI;

    /**
    * @dev current supply, how many a id are minted not.
    */
    mapping(uint256 => uint256) public supply;

    /**
    * @dev max supply, a token id has a max supply cap
    */
    mapping(uint256 => uint256) public maxSupply;
    /**
    * @dev token id index, which will increase one by one
    */
    uint256 private idx = 0;

    // Mapping from token ID to account balances
    mapping(uint256 => mapping(address => uint256)) private _balances;

    // metadata uri
    mapping(uint256 => string) private _uri;

    constructor (string memory _contractURI){
        contractURI = _contractURI;
    }
    
    function create(uint256 amount,string calldata _newUri) public onlyOwner returns(uint256){
        // set tokenId totalSupply
        maxSupply[idx] = amount;
        // set metadata Uri
        _setUri(idx, _newUri);
        // idx increment
        idx += 1;
        return idx - 1;
    }

    /**
    * @dev update token's metadata uri
    * @param id tokenId
    * @param newUri new uri
    */
    function setUri(uint256 id, string calldata newUri) public onlyOwner {
        _setUri(id, newUri);
    }

    function mint(address _to,uint256 _id,uint256 _amount,bytes memory _data)public onlyOwner {
        require(_amount + supply[_id] <= maxSupply[_id], 'Asset: exceed max supply');
        _mint(_to, _id, _amount, _data);
        supply[_id] += _amount;
    }

    /**
    * @dev return token metadata uri
    * @param _id token's id
    * @return uri metadata uri
    */
    function uri(uint256 _id) public view override returns (string memory) {
        require(_id < idx, 'Asset: id not exist');
        return _uri[_id];
    }

    /**
    * @dev set contract-level MetaData
    * @param newContractURI new Contract-level metadata uri
    */
    function setContractURI(string calldata newContractURI) public onlyOwner {
        string memory oldContractURI = contractURI;
        contractURI = newContractURI;
        emit SetContractURI(oldContractURI, contractURI);
    }

    /**
    * @dev set token metadata uri
    * @param id  token id
    * @param newUri metadata uri
    */
    function _setUri(uint256 id, string calldata newUri) private {
        require(id <= idx, 'Asset: id not exist');
        _uri[id] = newUri;
        emit SetUri(id, newUri);
    }



}