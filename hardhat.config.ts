import { HardhatUserConfig } from "hardhat/config";
import "@nomiclabs/hardhat-etherscan";

/**
 * Solidity 编译优化配置
 * version：指定要使用的 Solidity 编译器版本
 * evmVersion：指定目标的 EVM 版本。这里选择了 'istanbul'，意味着编译后的字节码将与 Istanbul EVM 版本兼容
 * optimizer：控制编译后字节码的优化 
 *    enabled：设置为 true 时，启用优化器，可以显著减小编译后字节码的大小并提高其执行速度
 *    runs：指定优化器应执行的次数。较高的数字意味着更多的优化，但也意味着编译时间更长
 * metadata：包含与编译后合约的元数据相关的设置
 *    bytecodeHash：确定如何在元数据中编码字节码哈希。将其设置为 'none' 意味着元数据中不包含字节码哈希。这可以用于减小元数据的大小，
 *                  但意味着某些功能能，如在 Etherscan 上验证合约的源代码，可能不可用
 */
const LOW_OPTIMIZER_COMPILER_SETTINGS = {
  version: '0.7.6',
  settings: {
    evmVersion: 'istanbul',
    optimizer: {
      enabled: true,
      runs: 2000,
    },
    metadata: {
      bytecodeHash: 'none',
    }
  }
}

const LOWEST_OPTIMIZER_COMPILER_SETTINGS = {
  version: '0.7.6',
  settings: {
    evmVersion: 'istanbul',
    optimizer: {
      enabled: true,
      runs: 1_000,
    },
    metadata: {
      bytecodeHash: 'none',
    },
  },
}

const DEFAULT_COMPILER_SETTINGS = {
  version: '0.7.6',
  settings: {
    evmVersion: 'istanbul',
    optimizer: {
      enabled: true,
      runs: 1_000_000,
    },
    metadata: {
      bytecodeHash: 'none',
    },
  },
}


const config: HardhatUserConfig = {
  networks: {
    hardhat: {
      // 不容许合约大小无限制 EVM限制合约大小不可以超过24kb
      allowUnlimitedContractSize: false
      // 分叉测试配置
      // forking: {
      //   url: "https://eth-mainnet.alchemyapi.io/v2/your-api-key",
      //   blockNumber: 12345678
      // }
    },
    anvil: {
      url : "http://127.0.0.1:8545",
      chainId: 1337   
    },
    sepolia: {
      url : `https://eth-sepolia.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`,
    }


  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY
  },
  solidity: {
    compilers:[DEFAULT_COMPILER_SETTINGS],
    overrides: {
      'contracts/NonfungiblePositionManager.sol': LOW_OPTIMIZER_COMPILER_SETTINGS,
      'contracts/NonfungibleTokenPositionDescriptor.sol': LOWEST_OPTIMIZER_COMPILER_SETTINGS,
      'contracts/libraries/NFTDescriptor.sol': LOWEST_OPTIMIZER_COMPILER_SETTINGS,
    }
  },

};

export default config;
