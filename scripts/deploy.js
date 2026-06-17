const { ethers } = require("hardhat");

async function main() {
  console.log("=".repeat(50));
  console.log("  Deploying SimpleEscrow Contract");
  console.log("=".repeat(50));

  const [deployer, seller, arbiter] = await ethers.getSigners();

  console.log("\nAccounts:");
  console.log("  Buyer   (deployer) :", deployer.address);
  console.log("  Seller             :", seller.address);
  console.log("  Arbiter            :", arbiter.address);

  const buyerBalance = await ethers.provider.getBalance(deployer.address);
  console.log(
    "\n  Buyer balance      :",
    ethers.formatEther(buyerBalance),
    "ETH"
  );

  // Parameter deployment
  const DURATION_SECONDS = 7 * 24 * 60 * 60; // 7 hari
  const ARBITER_FEE_PERCENT = 5; // 5%

  console.log("\nDeployment Parameters:");
  console.log("  Duration    :", DURATION_SECONDS, "seconds (7 days)");
  console.log("  Arbiter Fee :", ARBITER_FEE_PERCENT, "%");

  // Deploy contract
  console.log("\nDeploying...");
  const SimpleEscrow = await ethers.getContractFactory("SimpleEscrow");
  const escrow = await SimpleEscrow.deploy(
    seller.address,
    arbiter.address,
    DURATION_SECONDS,
    ARBITER_FEE_PERCENT
  );
  await escrow.waitForDeployment();

  const contractAddress = await escrow.getAddress();
  const deployTx = escrow.deploymentTransaction();
  const receipt = await deployTx.wait();

  console.log("\n✅ SimpleEscrow deployed successfully!");
  console.log("   Contract Address :", contractAddress);
  console.log("   Block Number     :", receipt.blockNumber);
  console.log("   Gas Used         :", receipt.gasUsed.toString());

  // Verifikasi state awal
  const details = await escrow.getEscrowDetails();
  const deadline = new Date(Number(details._deadline) * 1000).toLocaleString("id-ID");

  console.log("\nInitial State:");
  console.log("  State    :", "AWAITING_DELIVERY");
  console.log("  Deadline :", deadline);
  console.log("  Balance  :", ethers.formatEther(await escrow.getBalance()), "ETH");

  console.log("\n" + "=".repeat(50));
  console.log("  Contract is ready for interaction.");
  console.log("  Run: npx hardhat run scripts/interact.js --network localhost");
  console.log("=".repeat(50));

  return contractAddress;
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
