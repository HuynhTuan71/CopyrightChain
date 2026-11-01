const { ethers, network, artifacts } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("=================================================");
  console.log("   TRIỂN KHAI SMART CONTRACT COPYRIGHTCHAIN      ");
  console.log("=================================================");
  console.log(`Đang chạy trên mạng: [ ${network.name} ]`);

  // 1. Kiểm tra biến môi trường khi deploy lên mạng Sepolia
  if (network.name === "sepolia") {
    const rpcUrl = process.env.SEPOLIA_RPC_URL;
    const privateKey = process.env.PRIVATE_KEY;

    const missingVars = [];
    if (!rpcUrl || rpcUrl.trim() === "" || rpcUrl.includes("YOUR_API_KEY")) {
      missingVars.push("SEPOLIA_RPC_URL");
    }
    if (!privateKey || privateKey.trim() === "" || privateKey.includes("your_private_key_here")) {
      missingVars.push("PRIVATE_KEY");
    }

    if (missingVars.length > 0) {
      console.error("\n❌ [LỖI] THIẾU CẤU HÌNH BIẾN MÔI TRƯỜNG CHO SEPOLIA!");
      console.error(`- Các biến chưa được điền đúng trong file .env: ${missingVars.join(", ")}`);
      console.error("\n👉 Hướng dẫn khắc phục:");
      console.error("   1. Sao chép file .env.example thành file .env");
      console.error("   2. Cung cấp URL RPC Sepolia hợp lệ (từ Alchemy, Infura hoặc QuickNode)");
      console.error("   3. Cung cấp PRIVATE_KEY của ví thử nghiệm Sepolia (LƯU Ý: KHÔNG dùng ví tiền thật!)");
      console.error("   4. Đảm bảo ví có đủ Sepolia ETH để thanh toán phí gas deploy.\n");
      process.exit(1);
    }
  }

  // 2. Lấy thông tin ví deployer
  const [deployer] = await ethers.getSigners();
  if (!deployer) {
    console.error("\n❌ [LỖI] Không tìm thấy tài khoản để deploy!");
    process.exit(1);
  }

  console.log(`Ví thực hiện deploy: ${deployer.address}`);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log(`Số dư ví: ${ethers.formatEther(balance)} ETH`);

  if (network.name === "sepolia" && balance === 0n) {
    console.error("\n❌ [LỖI] Số dư ví Sepolia bằng 0 ETH, không đủ phí gas để deploy!");
    console.error("👉 Bạn hãy nhận Sepolia ETH miễn phí từ một trong các faucet sau:");
    console.error("   - https://sepoliafaucet.com");
    console.error("   - https://cloud.google.com/application/web3/faucet/ethereum/sepolia");
    console.error("   - https://faucets.chain.link/sepolia\n");
    process.exit(1);
  }

  // 3. Tiến hành deploy Smart Contract
  console.log("\nĐang gửi transaction deploy contract CopyrightRegistry...");
  const CopyrightRegistry = await ethers.getContractFactory("CopyrightRegistry");
  const copyrightRegistry = await CopyrightRegistry.deploy();

  await copyrightRegistry.waitForDeployment();
  const contractAddress = await copyrightRegistry.getAddress();

  console.log("\n=================================================");
  console.log("🎉 TRIỂN KHAI THÀNH CÔNG CONTRACT COPYRIGHTREGISTRY!");
  console.log(`Địa chỉ Contract: ${contractAddress}`);

  if (network.name === "sepolia") {
    console.log(`Xem trên Etherscan Sepolia: https://sepolia.etherscan.io/address/${contractAddress}`);
  }
  console.log("=================================================\n");

  // 4. Tự động ghi file JSON cấu hình cho frontend
  const targetDir = path.join(__dirname, "..", "frontend", "src", "contract");
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  const contractArtifact = await artifacts.readArtifact("CopyrightRegistry");
  const chainId = network.config.chainId || (network.name === "sepolia" ? 11155111 : 31337);

  const frontendData = {
    address: contractAddress,
    abi: contractArtifact.abi,
    chainId: chainId,
    networkName: network.name,
    deployedAt: new Date().toISOString(),
  };

  const outputPath = path.join(targetDir, "CopyrightRegistry.json");
  fs.writeFileSync(outputPath, JSON.stringify(frontendData, null, 2), "utf-8");

  console.log(`✅ Đã xuất cấu hình Smart Contract cho Frontend:`);
  console.log(`   Đường dẫn: ${outputPath}\n`);
}

main().catch((error) => {
  console.error("Đã xảy ra lỗi trong quá trình thực thi script:", error);
  process.exit(1);
});
