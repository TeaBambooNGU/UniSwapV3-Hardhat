const { fs } = require('fs');
const { promisify } = require('util');
const { ethers } = require('hardhat');
const { env } = require('process');

const artifactsJson = {
    UniswapV3Factory: require('../artifacts/contracts/UniswapV3Factory.sol/UniswapV3Factory.json'),
    SwapRouter: require('../artifacts/contracts/SwapRouter.sol/SwapRouter.json'),
    NonfungiblePositionManager: require('../artifacts/contracts/NonfungiblePositionManager.sol/NonfungiblePositionManager.json'),
    NonfungibleTokenPositionDescriptor: require('../artifacts/contracts/NonfungibleTokenPositionDescriptor.sol/NonfungibleTokenPositionDescriptor.json'),
    NFTDescriptor: require('../artifacts/contracts/NFTDescriptor.sol/NFTDescriptor.json'),

}
// Load assignment owner first to reduce loading times and code redundancy. 
// This method is not needed if createFactory is created directly with the contract name.
const owner = async () => {
    const [owner] = await ethers.getSigners();
    console.log("Deploying Contract with the account:", owner.address);
    return owner;

}

async function deployUniswapV3Factory() {
    // One way to create a contract factory is through abi and bytecode and signer
    const Factory = new ethers.ContractFactory(artifactsJson.UniswapV3Factory.abi, artifactsJson.UniswapV3Factory.bytecode, owner);
    const factory = await Factory.deploy();
    console.log("UniswapV3Factory address:", factory.address);
    return factory;
}

async function deploySwapRouter(factoryAddress, weth9Address) {
    const SwapRouter = new ethers.ContractFactory(artifactsJson.SwapRouter.abi, artifactsJson.SwapRouter.bytecode, owner);
    const swapRouter = await SwapRouter.deploy(factoryAddress, weth9Address);
    console.log("SwapRouter address:", swapRouter.address);
    return swapRouter;   
}

async function deployNFTDescriptor() {
    // other way to create a contract factory is through contract name in hardhat
    const NFTDescriptor = new ethers.ContractFactory("NFTDescriptor");
    const nftDescriptor = await NFTDescriptor.deploy();
    console.log("NFTDescriptor address:", nftDescriptor.address);
    return nftDescriptor;   
}

async function deployNonfungTokenPositionDescriptor(weth9Address,tokenLabel:string) {
    // hardhat does not support libraries in contract deployment, so we need to deploy the contract with the library first
    const nftDescriptor = await deployNFTDescriptor();
    // other way to create a contract factory is through contract name and libraries in hardhat
    const NonfungibleTokenPositionDescriptor = new ethers.ContractFactory("NonfungibleTokenPositionDescriptor", {libraries: {NFTDescriptor: nftDescriptor.address}});
    const nonfungibleTokenPositionDescriptor = await NonfungibleTokenPositionDescriptor.deploy(weth9Address,ethers.utils.formatBytes32String(tokenLabel));
    console.log("NonfungTokenPositionDescriptor address:", nonfungibleTokenPositionDescriptor.address);
    return nonfungibleTokenPositionDescriptor;   
}

async function deployNonfungiblePositionManager(factoryAddress, weth9Address, nonfungibleTokenPositionDescriptorAddress) {
    // other way to create a contract factory is through contract name in hardhat
    const NonfungiblePositionManager = new ethers.ContractFactory("NonfungiblePositionManager");
    const nonfungiblePositionManager = await NonfungiblePositionManager.deploy(factoryAddress,weth9Address,nonfungibleTokenPositionDescriptorAddress);
    console.log("NonfungiblePositionManager address:", nonfungiblePositionManager.address);
    return nonfungiblePositionManager;   
}


