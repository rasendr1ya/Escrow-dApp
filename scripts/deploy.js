const { ethers, network } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("=".repeat(50));
  console.log(`  Deploying contracts to network: ${network.name}`);
  console.log("=".repeat(50));

  const signers = await ethers.getSigners();
  const deployer = signers[0];

  console.log("\nDeployer Account:");
  console.log("  Address :", deployer.address);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("  Balance :", ethers.formatEther(balance), "ETH");

  // Deploy factory contract
  console.log("\nDeploying EscrowFactory...");
  const EscrowFactory = await ethers.getContractFactory("EscrowFactory");
  const factory = await EscrowFactory.deploy();
  await factory.waitForDeployment();

  const factoryAddress = await factory.getAddress();
  const factoryDeployTx = factory.deploymentTransaction();
  const factoryReceipt = await factoryDeployTx.wait();

  console.log("\n✅ EscrowFactory deployed successfully!");
  console.log("   Factory Address  :", factoryAddress);
  console.log("   Block Number     :", factoryReceipt.blockNumber);
  console.log("   Gas Used         :", factoryReceipt.gasUsed.toString());

  let sampleEscrowAddress = "0x0000000000000000000000000000000000000000";

  // Hanya jalankan pembuatan sampel jika berada di localhost atau hardhat
  if (network.name === "hardhat" || network.name === "localhost") {
    if (signers.length >= 3) {
      const seller = signers[1];
      const arbiter = signers[2];
      const DURATION_SECONDS = 7 * 24 * 60 * 60; // 7 hari
      const ARBITER_FEE_PERCENT = 5;

      console.log("\nDeploying a sample SimpleEscrow through Factory...");
      const createTx = await factory.createEscrow(
        seller.address,
        arbiter.address,
        DURATION_SECONDS,
        ARBITER_FEE_PERCENT
      );
      const createReceipt = await createTx.wait();

      const event = createReceipt.logs
        .map((log) => {
          try {
            return factory.interface.parseLog(log);
          } catch (e) {
            return null;
          }
        })
        .find((parsed) => parsed && parsed.name === "EscrowCreated");

      sampleEscrowAddress = event.args.escrowAddress;
      console.log("✅ Sample Escrow deployed at:", sampleEscrowAddress);
    } else {
      console.log("\n⚠️ Signers kurang dari 3, melewati pembuatan sample escrow.");
    }
  } else {
    console.log("\nℹ️ Public network dideteksi. Melewati pembuatan sample escrow untuk menghemat gas.");
  }

  // Update frontend contracts.json configuration
  const contractsPath = path.join(__dirname, "../frontend/src/utils/contracts.json");
  if (fs.existsSync(contractsPath)) {
    const contractsData = JSON.parse(fs.readFileSync(contractsPath, "utf8"));
    contractsData.factoryAddress = factoryAddress;
    fs.writeFileSync(contractsPath, JSON.stringify(contractsData, null, 2), "utf8");
    console.log("✅ Updated frontend/src/utils/contracts.json with new factory address!");
  } else {
    console.log("⚠️ File contracts.json tidak ditemukan pada path:", contractsPath);
  }

  console.log("\n" + "=".repeat(50));
  console.log("  Contracts deployment completed.");
  console.log("  EscrowFactory Address:", factoryAddress);
  console.log("=".repeat(50));

  return { factoryAddress, sampleEscrowAddress };
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });