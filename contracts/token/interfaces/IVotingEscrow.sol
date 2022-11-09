// SPDX-License-Identifier: GPL-3.0-only

pragma solidity 0.8.14;

interface IVotingEscrow {
  function getLastUserSlope(address addr) external returns (int256);
  function createLock(uint256 value, uint256 unlockTime) external;
  function depositFor(address addr, uint256 value) external;

  function lockedEnd(address addr) external returns (uint256);
  function increaseUnlockTime(uint256 unlockTime) external;
  function increaseAmount(uint256 value) external;

  function totalSupplyAt(uint256 blk) external view returns (uint256);
  function totalSupply() external view returns (uint256);
  function balanceOfAt(address addr, uint256 blk) external view returns (int256);
  function balanceOf(address addr) external view returns (int256);
  function withdraw() external;

}
