# UniSwapV3通过Hardhat部署
该工程整合了 v3-core 和 v3-v3-periphery
不添加测试模块 因为官方已经测试过了
## 编译环境安装
```shell
yarn add --dev typescript
yarn add --dev ts-node
yarn add --dev @nomicfoundation/hardhat-toolbox 
yarn add dotenv
```
## UniSwapV3依赖安装
```shell
yarn add @uniswap/v3-core
yarn add @uniswap/v3-periphery
```
## 部署命令
```shell
# ethersV6版本
npx hardhat run --network <networkName> scripts/01_deployV3ContractsV6.ts
```
## TODO
用脚本实现添加新池子和流动性