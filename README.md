# Upgradeable Contract

# About
Smart contracts to support game developers minting tokens

![License: GPL](https://img.shields.io/badge/license-GPLv3-blue)


# Contracts

合约处于开发测试阶段，目前在Fork主网私链上进行部署测试，一些将在部署到主网之前进行修改，简要说明如下：

assetFactory - AssetFactoryUpgradable contract


> 游戏道具创建工厂，游戏创建者根据GameId 进行游戏道具创建，一个GameId会创建一个Collection合约，collection实现了ERC1155协议，对道具NFT进行创建和管理。


coinFactory - CoinFactoryUpgradeable contract

> GameCoin 创建工厂，提供游戏创建者进行GameCoin创建功能，并且绑定developer -> GameId, 并且创建 mainToken和GameCoin的LP 提供初始流动性。并且将流动性质押到 mine 和 gaugeController 进行流动性挖矿和投票权重计算。对developer提供GameCoin Mint和withdrew功能，功能存在延迟交互功能，延迟曲线由用户投票决定 项目方进行设置。

Token

- Token contract

> MainToken 创建合约 完全支持ERC20协议 ，由项目方进行mint

- RewardVault contract

> 投票托管合约 创建 veMToken代币, veMToken代币 是一种非标准的 ERC20 实现，不能转移。获得 veMToken 的唯一方法是锁定 MainToken 。最长锁定时间为四年。一个锁定四年的 MainToken 提供一个 veMToken 的初始余额。通过质押的amount计算斜率，质押结束区块和当前区块时间差为乘数计算得到。如质押 1000 个mainToken一年 可以得到 250个veMToken

staking

- MineUpgradaderable contract 

> 流动性挖矿合约，质押mainToken-GameCoin LP 进行流动性挖矿，经济模型使用 sushi： _accPerShare += (rate * w * dt) / poolInfo.amount 模型计算当前每个Lp的点数 ，由 uint256 pending = (user.amount * poolInfo.accPerShare) / ONE - user.rewardDebt;计算user lp当前实际领取的代币数量，rewardDebt为添加流动性时已经提取的数量。矿池内mainToken数量由 RewardVault合约统一管理，每个区块的挖矿数量由_rate进行设置，每个LP 池子的占比由 GaugeController 合约投票决定。

- GaugeControllerUpgradaderable contract

> 

# Get Started

Requirement:

- Node >= 16
- yarn(recommend)

Clone the repository

```shell
$ git clone https://github.com/ProjectTwelve/contracts
```

Install dependencies

```shell
$ yarn -D
```

Run all test

```shell
$ yarn test
```

# Copyright

Licensed under [GPL-3.0](LICENSE)
