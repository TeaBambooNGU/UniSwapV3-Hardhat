import fs from 'fs';
import hre from 'hardhat';
import { ethers } from 'hardhat';
import { env } from 'process';
require('dotenv').config();

const artifactsJson = {
    UniswapV3Factory: require('../artifacts/contracts/UniswapV3Factory.sol/UniswapV3Factory.json'),
    SwapRouter: require('../artifacts/contracts/SwapRouter.sol/SwapRouter.json'),
    NonfungiblePositionManager: require('../artifacts/contracts/NonfungiblePositionManager.sol/NonfungiblePositionManager.json'),
    NonfungibleTokenPositionDescriptor: require('../artifacts/contracts/NonfungibleTokenPositionDescriptor.sol/NonfungibleTokenPositionDescriptor.json'),
    NFTDescriptor: require('../artifacts/contracts/libraries/NFTDescriptor.sol/NFTDescriptor.json'),
    WETHContract: require('../WETH9.json')
}


const linkLibraries = ({ bytecode, linkReferences }, libraries) => {
    Object.keys(linkReferences).forEach((fileName) => {
      Object.keys(linkReferences[fileName]).forEach((contractName) => {
        if (!libraries.hasOwnProperty(contractName)) {
          throw new Error(`Missing link library name ${contractName}`)
        }
        const address = ethers
          .getAddress(libraries[contractName])
          .toLowerCase()
          .slice(2)
        linkReferences[fileName][contractName].forEach(
          ({ start, length }) => {
            const start2 = 2 + start * 2
            const length2 = length * 2
            bytecode = bytecode
              .slice(0, start2)
              .concat(address)
              .concat(bytecode.slice(start2 + length2, bytecode.length))
          }
        )
      })
    })
    return bytecode
  }

async function deployUniswapV3Factory() {
    const [owner] = await ethers.getSigners();
    console.log("Deploying UniswapV3Factory with the account:", owner.address)
    // One way to create a contract factory is through abi and bytecode and signer
    const Factory = new ethers.ContractFactory(artifactsJson.UniswapV3Factory.abi, artifactsJson.UniswapV3Factory.bytecode, owner);
    const factory = await Factory.deploy();
    console.log("UniswapV3Factory address:", factory.target);
    return factory;
}

async function deploySwapRouter(factoryAddress:string, weth9Address:string) {
    const [owner] = await ethers.getSigners();
    console.log("Deploying SwapRouter with the account:", owner.address)
    const SwapRouter = new ethers.ContractFactory(artifactsJson.SwapRouter.abi, artifactsJson.SwapRouter.bytecode, owner);
    const swapRouter = await SwapRouter.deploy(factoryAddress, weth9Address);
    console.log("SwapRouter address:", swapRouter.target);
    return swapRouter;   
}

async function deployNFTDescriptor() {
    const [owner] = await ethers.getSigners();
    console.log("Deploying NFTDescriptor with the account:", owner.address)
    const NFTDescriptor = new ethers.ContractFactory(artifactsJson.NFTDescriptor.abi, artifactsJson.NFTDescriptor.bytecode,owner);
    const nftDescriptor = await NFTDescriptor.deploy();
    console.log("NFTDescriptor address:", nftDescriptor.target);
    return nftDescriptor;   
}

async function deployNonfungibleTokenPositionDescriptor(weth9Address:string,tokenLabel:string) {
    const [owner] = await ethers.getSigners();
    console.log("Deploying NonfungibleTokenPositionDescriptor with the account:", owner.address)
    // hardhat does not support libraries in contract deployment, so we need to deploy the contract with the library first
    const nftDescriptor = await deployNFTDescriptor();
    const linkedBytecode = linkLibraries(
        {
          bytecode: artifactsJson.NonfungibleTokenPositionDescriptor.bytecode,
          linkReferences: {
            "NFTDescriptor.sol": {
              NFTDescriptor: [
                {
                  length: 20,
                  start: 1681,
                },
              ],
            },
          },
        },
        {
          NFTDescriptor: nftDescriptor.target,
        }
      );
    

    const NonfungibleTokenPositionDescriptor = new ethers.ContractFactory(artifactsJson.NonfungibleTokenPositionDescriptor.abi, linkedBytecode,owner);
    const nonfungibleTokenPositionDescriptor = await NonfungibleTokenPositionDescriptor.deploy(weth9Address,ethers.encodeBytes32String(tokenLabel));
    console.log("NonfungTokenPositionDescriptor address:", nonfungibleTokenPositionDescriptor.target);
    return nonfungibleTokenPositionDescriptor;   
}

async function deployNonfungiblePositionManager(factoryAddress:string, weth9Address:string, nonfungibleTokenPositionDescriptorAddress:string) {
    const [owner] = await ethers.getSigners();
    console.log("Deploying NonfungiblePositionManager with the account:", owner.address)
    const NonfungiblePositionManager = new ethers.ContractFactory(artifactsJson.NonfungiblePositionManager.abi, artifactsJson.NonfungiblePositionManager.bytecode,owner);
    const nonfungiblePositionManager = await NonfungiblePositionManager.deploy(factoryAddress,weth9Address,nonfungibleTokenPositionDescriptorAddress);
    console.log("NonfungiblePositionManager address:", nonfungiblePositionManager.target);
    return nonfungiblePositionManager;   
}

async function deployWETHContract() {
    const [owner] = await ethers.getSigners();
    const WETHContract = new ethers.ContractFactory(artifactsJson.WETHContract.abi, artifactsJson.WETHContract.bytecode, owner);
    const wethContract = await WETHContract.deploy();
    console.log("WETHContract address:", wethContract.target)
    return wethContract;
}



async function main() {
    // Calibrating Environment Variables Eliminating ts Error Messages
    if (env.ALCHEMY_API_KEY === undefined) {
        throw new Error("ALCHEMY_API_KEY is not set in the environment variable");
    }
    if (env.SEPOLIA_WALLET === undefined) {
        throw new Error("SEPOLIA_WALLET is not set in the environment variable");
    }
    if(env.SEPOLIA_WALLET_PRIVATE_KEY === undefined){
        throw new Error("SEPOLIA_WALLET_PRIVATE_KEY is not set in the environment variable");
    }
    if (env.ANVIL_WALLET === undefined) {
        throw new Error("ANVIL_WALLET is not set in the environment variable");
    }
    if(env.ANVIL_WALLET_PRIVATE_KEY === undefined){
        throw new Error("ANVIL_WALLET_PRIVATE_KEY is not set in the environment variable");
    }
    if (env.ETHERSCAN_API_KEY === undefined) {
        throw new Error("ETHERSCAN_API_KEY is not set in the environment variable");
    }
    if(env.WETH9_ADDRESS === undefined){
        throw new Error("WETH9_ADDRESS is not set in the environment variable");
    }

    let startBalance = ethers.getBigInt(0);
    let wallet ;
    let weth9Address;
    let rpcUrl = "";
    let provider = ethers.getDefaultProvider();


    
    // Choose the WETH9 address based on the network, if it is a sepolia network, use the address in the environment variable, otherwise deploy the WETH contract
    if (hre.network.name === "sepolia") {

        wallet = new ethers.Wallet(env.SEPOLIA_WALLET_PRIVATE_KEY);
        provider = new ethers.JsonRpcProvider(`https://eth-sepolia.g.alchemy.com/v2/${env.ALCHEMY_API_KEY}`);
        startBalance = await provider.getBalance(env.SEPOLIA_WALLET);
        if (env.WETH9_ADDRESS === undefined) {
            throw new Error("WETH9_ADDRESS is not set in the environment variable");
        }
        weth9Address = env.WETH9_ADDRESS;
    } else if (hre.network.name === "anvil") {
        wallet = new ethers.Wallet(env.ANVIL_WALLET_PRIVATE_KEY);
        startBalance = await provider.getBalance(env.ANVIL_WALLET);
        const wethContract = await deployWETHContract();
        weth9Address = await wethContract.getAddress();
    } else if (hre.network.name === "hardhat") {
        wallet = (await ethers.getSigners())[0];
        const wethContract = await deployWETHContract();
        weth9Address = await wethContract.getAddress();
    }else{
        throw new Error("Unsupported network");
    }

    const factory = await deployUniswapV3Factory();
    const swapRouter = await deploySwapRouter(await factory.getAddress(), weth9Address);
    const nonfungibleTokenPositionDescriptor = await deployNonfungibleTokenPositionDescriptor(weth9Address,"WETH");
    const nonfungiblePositionManager = await deployNonfungiblePositionManager(await factory.getAddress(), weth9Address, await nonfungibleTokenPositionDescriptor.getAddress());


    const deployCost = startBalance - ((await provider.getBalance(wallet.address)))

    const blockNum = await provider.getBlockNumber();

    const output = {
        "networkName": hre.network.name,
        "blockNum": blockNum,
        "deployCost": ethers.formatEther(deployCost),
        "UniswapV3Factory": factory.target,
        "SwapRouter": swapRouter.target,
        "NonfungiblePositionManager": nonfungiblePositionManager.target,
        "NonfungibleTokenPositionDescriptor": nonfungibleTokenPositionDescriptor.target,
        "WETH9": weth9Address
    }

    const outfile = "./deployInfo.json";
    const jsonStr = JSON.stringify(output, undefined, 2);
    fs.writeFileSync(outfile, jsonStr, { encoding: "utf-8" });

    console.log(`
    ===============================================================
    networkName:    ${hre.network.name}
    Deployer:       ${wallet.address}
    Depoly Cost:    ${ethers.formatEther(deployCost)}ETH
    Depoly block number: ${blockNum}

    Contract Addresses:
    ===============================================================
    UniswapV3Factory:              ${factory.target ?? "Not Deployed"}
    ---------------------------------------------------------------
    SwapRouter:   ${swapRouter.target ?? "Not Deployed"}
    ---------------------------------------------------------------
    NonfungiblePositionManager:    ${nonfungiblePositionManager.target ?? "Not Deployed"}
    ---------------------------------------------------------------
    NonfungibleTokenPositionDescriptor:    ${nonfungibleTokenPositionDescriptor.target ?? "Not Deployed"}
    ---------------------------------------------------------------
    WETH9:       ${weth9Address ?? "Not Deployed"}
    ---------------------------------------------------------------

    ===============================================================
`);

}
// npx hardhat run --network <networkName> scripts/01_deployV3Contracts.ts
main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });
