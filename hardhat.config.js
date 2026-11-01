require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

// Đọc các biến môi trường cấu hình cho mạng Sepolia
const SEPOLIA_RPC_URL = process.env.SEPOLIA_RPC_URL || "";
let PRIVATE_KEY = process.env.PRIVATE_KEY || "";

// Đảm bảo private key có định dạng hợp lệ (có tiền tố 0x) nếu người dùng cung cấp
if (PRIVATE_KEY && !PRIVATE_KEY.startsWith("0x")) {
  PRIVATE_KEY = `0x${PRIVATE_KEY}`;
}

const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY || "";

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    // Mạng local mặc định của Hardhat để chạy test và thử nghiệm
    hardhat: {
      chainId: 31337,
    },
    // Mạng Ethereum Sepolia Testnet
    sepolia: {
      url: SEPOLIA_RPC_URL,
      accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [],
      chainId: 11155111,
    },
  },
  // Cấu hình verify mã nguồn contract trên Etherscan
  etherscan: {
    apiKey: ETHERSCAN_API_KEY,
  },
};
