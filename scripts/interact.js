const { ethers } = require("hardhat");

/**
 * Script interaksi untuk mendemonstrasikan seluruh flow SimpleEscrow.
 * Jalankan setelah deploy.js:
 *   npx hardhat run scripts/interact.js --network localhost
 */
async function main() {
  const [buyer, seller, arbiter] = await ethers.getSigners();

  // ─── Deploy fresh contract untuk demo ──────────────────────────────────
  console.log("=".repeat(60));
  console.log("  SimpleEscrow - Interaction Demo");
  console.log("=".repeat(60));

  const DURATION = 7 * 24 * 60 * 60; // 7 hari
  const ARBITER_FEE = 5; // 5%
  const DEPOSIT = ethers.parseEther("1.0");

  const SimpleEscrow = await ethers.getContractFactory("SimpleEscrow");
  const escrow = await SimpleEscrow.connect(buyer).deploy(
    seller.address,
    arbiter.address,
    DURATION,
    ARBITER_FEE
  );
  await escrow.waitForDeployment();
  const addr = await escrow.getAddress();

  console.log(`\n📄 Contract deployed at: ${addr}`);
  console.log(`   Buyer  : ${buyer.address}`);
  console.log(`   Seller : ${seller.address}`);
  console.log(`   Arbiter: ${arbiter.address}`);

  // ─── Helper print state ─────────────────────────────────────────────────
  const STATE_NAMES = ["AWAITING_DELIVERY", "COMPLETE", "DISPUTED", "REFUNDED"];
  async function printState(label) {
    const state = await escrow.currentState();
    const balance = await escrow.getBalance();
    const deposit = await escrow.depositAmount();
    console.log(`\n[${label}]`);
    console.log(`   State        : ${STATE_NAMES[Number(state)]}`);
    console.log(`   Contract bal : ${ethers.formatEther(balance)} ETH`);
    console.log(`   depositAmount: ${ethers.formatEther(deposit)} ETH`);
  }

  // ═══════════════════════════════════════════════════════════════
  // DEMO 1: Happy Path — buyer deposit → release ke seller
  // ═══════════════════════════════════════════════════════════════
  console.log("\n" + "─".repeat(60));
  console.log("  DEMO 1: Happy Path (Deposit → Release)");
  console.log("─".repeat(60));

  await printState("Before Deposit");

  // Transaksi 1: Buyer deposit
  console.log("\n📥 Buyer depositing 1 ETH...");
  const depositTx = await escrow.connect(buyer).deposit({ value: DEPOSIT });
  const depositReceipt = await depositTx.wait();
  console.log(`   ✅ Deposit TX: ${depositReceipt.hash}`);
  await printState("After Deposit");

  // Transaksi 2: Buyer release ke seller
  const sellerBefore = await ethers.provider.getBalance(seller.address);
  console.log("\n🔓 Buyer releasing funds to seller...");
  const releaseTx = await escrow.connect(buyer).releaseFunds();
  const releaseReceipt = await releaseTx.wait();
  console.log(`   ✅ Release TX: ${releaseReceipt.hash}`);
  const sellerAfter = await ethers.provider.getBalance(seller.address);
  console.log(
    `   Seller received: ${ethers.formatEther(sellerAfter - sellerBefore)} ETH`
  );
  await printState("After Release");

  // ═══════════════════════════════════════════════════════════════
  // DEMO 2: Dispute Path — buyer dispute → arbiter resolves
  // ═══════════════════════════════════════════════════════════════
  console.log("\n" + "─".repeat(60));
  console.log("  DEMO 2: Dispute Path (Deposit → Dispute → Resolve)");
  console.log("─".repeat(60));

  // Deploy escrow baru untuk demo 2
  const escrow2 = await SimpleEscrow.connect(buyer).deploy(
    seller.address,
    arbiter.address,
    DURATION,
    ARBITER_FEE
  );
  await escrow2.waitForDeployment();
  console.log(`\n📄 New contract for dispute demo: ${await escrow2.getAddress()}`);

  // Transaksi 3: Deposit
  console.log("\n📥 Buyer depositing 1 ETH...");
  await (await escrow2.connect(buyer).deposit({ value: DEPOSIT })).wait();

  // Transaksi 4: Raise dispute
  console.log("⚠️  Buyer raising dispute...");
  const disputeTx = await escrow2.connect(buyer).raiseDispute();
  const disputeReceipt = await disputeTx.wait();
  console.log(`   ✅ Dispute TX : ${disputeReceipt.hash}`);
  const stateAfterDispute = await escrow2.currentState();
  console.log(`   State        : ${STATE_NAMES[Number(stateAfterDispute)]}`);

  // Transaksi 5: Arbiter resolve — buyer menang
  const buyerBefore2 = await ethers.provider.getBalance(buyer.address);
  const arbiterBefore = await ethers.provider.getBalance(arbiter.address);
  console.log("\n⚖️  Arbiter resolving dispute (ruling: buyer wins)...");
  const resolveTx = await escrow2.connect(arbiter).resolveDispute(false);
  const resolveReceipt = await resolveTx.wait();
  console.log(`   ✅ Resolve TX : ${resolveReceipt.hash}`);

  const buyerAfter2 = await ethers.provider.getBalance(buyer.address);
  const arbiterAfter = await ethers.provider.getBalance(arbiter.address);
  const fee = (DEPOSIT * BigInt(ARBITER_FEE)) / 100n;

  console.log(`   Buyer refunded  : ~${ethers.formatEther(DEPOSIT - fee)} ETH (minus fee)`);
  console.log(`   Arbiter fee     : ${ethers.formatEther(fee)} ETH`);

  const finalState = await escrow2.currentState();
  console.log(`   Final state     : ${STATE_NAMES[Number(finalState)]}`);

  // ─── Summary ────────────────────────────────────────────────────────────
  console.log("\n" + "=".repeat(60));
  console.log("  ✅ All interactions completed successfully!");
  console.log("  Total transactions demonstrated: 5");
  console.log("  - Deposit (x2)");
  console.log("  - Release to seller (x1)");
  console.log("  - Raise dispute (x1)");
  console.log("  - Arbiter resolve (x1)");
  console.log("=".repeat(60));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
