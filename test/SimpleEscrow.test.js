const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("SimpleEscrow", function () {
  // ─── Fixtures & Setup ────────────────────────────────────────────────────

  let escrow;
  let buyer, seller, arbiter, other;

  const DEPOSIT_AMOUNT = ethers.parseEther("1.0"); // 1 ETH
  const DURATION = 7 * 24 * 60 * 60; // 7 hari dalam detik
  const ARBITER_FEE = 5; // 5%

  beforeEach(async function () {
    [buyer, seller, arbiter, other] = await ethers.getSigners();

    const SimpleEscrow = await ethers.getContractFactory("SimpleEscrow");
    // buyer adalah parameter pertama yang dikirim
    escrow = await SimpleEscrow.connect(buyer).deploy(
      buyer.address,
      seller.address,
      arbiter.address,
      DURATION,
      ARBITER_FEE
    );
    await escrow.waitForDeployment();
  });

  // ─── 1. Deployment ───────────────────────────────────────────────────────

  describe("Deployment", function () {
    it("should set correct buyer (deployer)", async function () {
      expect(await escrow.buyer()).to.equal(buyer.address);
    });

    it("should set correct seller address", async function () {
      expect(await escrow.seller()).to.equal(seller.address);
    });

    it("should set correct arbiter address", async function () {
      expect(await escrow.arbiter()).to.equal(arbiter.address);
    });

    it("should initialize state as AWAITING_DELIVERY (0)", async function () {
      expect(await escrow.currentState()).to.equal(0);
    });

    it("should initialize depositAmount as zero", async function () {
      expect(await escrow.depositAmount()).to.equal(0n);
    });

    it("should set deadline correctly", async function () {
      const deployTx = await escrow.deploymentTransaction();
      const block = await ethers.provider.getBlock(deployTx.blockNumber);
      const expectedDeadline = BigInt(block.timestamp) + BigInt(DURATION);
      expect(await escrow.deadline()).to.equal(expectedDeadline);
    });

    it("should revert if buyer and seller are the same address", async function () {
      const SimpleEscrow = await ethers.getContractFactory("SimpleEscrow");
      await expect(
        SimpleEscrow.connect(buyer).deploy(
          buyer.address,
          buyer.address, // same as buyer
          arbiter.address,
          DURATION,
          ARBITER_FEE
        )
      ).to.be.revertedWith("Escrow: buyer and seller cannot be the same");
    });

    it("should revert if arbiter fee exceeds 10%", async function () {
      const SimpleEscrow = await ethers.getContractFactory("SimpleEscrow");
      await expect(
        SimpleEscrow.connect(buyer).deploy(
          buyer.address,
          seller.address,
          arbiter.address,
          DURATION,
          11 // > 10%
        )
      ).to.be.revertedWith("Escrow: arbiter fee cannot exceed 10%");
    });
  });

  // ─── 2. Deposit ──────────────────────────────────────────────────────────

  describe("deposit()", function () {
    it("should allow buyer to deposit ETH", async function () {
      await expect(
        escrow.connect(buyer).deposit({ value: DEPOSIT_AMOUNT })
      ).to.not.be.reverted;

      expect(await escrow.depositAmount()).to.equal(DEPOSIT_AMOUNT);
      expect(await escrow.getBalance()).to.equal(DEPOSIT_AMOUNT);
    });

    it("should emit Deposited event with correct args", async function () {
      await expect(
        escrow.connect(buyer).deposit({ value: DEPOSIT_AMOUNT })
      )
        .to.emit(escrow, "Deposited")
        .withArgs(buyer.address, DEPOSIT_AMOUNT, await escrow.deadline());
    });

    it("should revert if non-buyer tries to deposit", async function () {
      await expect(
        escrow.connect(other).deposit({ value: DEPOSIT_AMOUNT })
      ).to.be.revertedWith("Escrow: caller is not the buyer");
    });

    it("should revert if deposit amount is zero", async function () {
      await expect(
        escrow.connect(buyer).deposit({ value: 0 })
      ).to.be.revertedWith("Escrow: deposit amount must be greater than zero");
    });

    it("should revert if buyer tries to deposit twice", async function () {
      await escrow.connect(buyer).deposit({ value: DEPOSIT_AMOUNT });
      await expect(
        escrow.connect(buyer).deposit({ value: DEPOSIT_AMOUNT })
      ).to.be.revertedWith("Escrow: already deposited");
    });

    it("should revert if deadline has passed", async function () {
      await time.increase(DURATION + 1);
      await expect(
        escrow.connect(buyer).deposit({ value: DEPOSIT_AMOUNT })
      ).to.be.revertedWith("Escrow: deadline has passed");
    });
  });

  // ─── 3. Release Funds ────────────────────────────────────────────────────

  describe("releaseFunds()", function () {
    beforeEach(async function () {
      await escrow.connect(buyer).deposit({ value: DEPOSIT_AMOUNT });
    });

    it("should transfer full deposit to seller", async function () {
      const sellerBalanceBefore = await ethers.provider.getBalance(seller.address);
      await escrow.connect(buyer).releaseFunds();
      const sellerBalanceAfter = await ethers.provider.getBalance(seller.address);

      expect(sellerBalanceAfter - sellerBalanceBefore).to.equal(DEPOSIT_AMOUNT);
    });

    it("should set state to COMPLETE (1)", async function () {
      await escrow.connect(buyer).releaseFunds();
      expect(await escrow.currentState()).to.equal(1); // COMPLETE
    });

    it("should emit FundsReleased event", async function () {
      await expect(escrow.connect(buyer).releaseFunds())
        .to.emit(escrow, "FundsReleased")
        .withArgs(seller.address, DEPOSIT_AMOUNT);
    });

    it("should revert if non-buyer tries to release funds", async function () {
      await expect(
        escrow.connect(seller).releaseFunds()
      ).to.be.revertedWith("Escrow: caller is not the buyer");
    });

    it("should revert if called twice (state no longer AWAITING_DELIVERY)", async function () {
      await escrow.connect(buyer).releaseFunds();
      await expect(
        escrow.connect(buyer).releaseFunds()
      ).to.be.revertedWith("Escrow: invalid state for this action");
    });

    it("should reset depositAmount to zero after release", async function () {
      await escrow.connect(buyer).releaseFunds();
      expect(await escrow.depositAmount()).to.equal(0n);
    });

    it("should revert if transfer to seller fails", async function () {
      const Rejector = await ethers.getContractFactory("Rejector");
      const rejector = await Rejector.deploy();
      await rejector.waitForDeployment();
      const rejectorAddress = await rejector.getAddress();

      const SimpleEscrow = await ethers.getContractFactory("SimpleEscrow");
      const failingEscrow = await SimpleEscrow.connect(buyer).deploy(
        buyer.address,
        rejectorAddress,
        arbiter.address,
        DURATION,
        ARBITER_FEE
      );
      await failingEscrow.waitForDeployment();

      await failingEscrow.connect(buyer).deposit({ value: DEPOSIT_AMOUNT });
      await expect(
        failingEscrow.connect(buyer).releaseFunds()
      ).to.be.revertedWith("Escrow: Transfer to seller failed");
    });
  });

  // ─── 4. Dispute ──────────────────────────────────────────────────────────

  describe("raiseDispute()", function () {
    beforeEach(async function () {
      await escrow.connect(buyer).deposit({ value: DEPOSIT_AMOUNT });
    });

    it("should set state to DISPUTED (2)", async function () {
      await escrow.connect(buyer).raiseDispute();
      expect(await escrow.currentState()).to.equal(2); // DISPUTED
    });

    it("should emit DisputeRaised event", async function () {
      await expect(escrow.connect(buyer).raiseDispute())
        .to.emit(escrow, "DisputeRaised")
        .withArgs(buyer.address);
    });

    it("should keep funds locked in contract after dispute", async function () {
      await escrow.connect(buyer).raiseDispute();
      expect(await escrow.getBalance()).to.equal(DEPOSIT_AMOUNT);
    });

    it("should revert if non-buyer raises dispute", async function () {
      await expect(
        escrow.connect(seller).raiseDispute()
      ).to.be.revertedWith("Escrow: caller is not the buyer");
    });

    it("should revert if no deposit has been made", async function () {
      // Deploy fresh contract tanpa deposit
      const SimpleEscrow = await ethers.getContractFactory("SimpleEscrow");
      const freshEscrow = await SimpleEscrow.connect(buyer).deploy(
        buyer.address,
        seller.address,
        arbiter.address,
        DURATION,
        ARBITER_FEE
      );
      await expect(
        freshEscrow.connect(buyer).raiseDispute()
      ).to.be.revertedWith("Escrow: no funds deposited");
    });
  });

  // ─── 5. Resolve Dispute ──────────────────────────────────────────────────

  describe("resolveDispute()", function () {
    beforeEach(async function () {
      await escrow.connect(buyer).deposit({ value: DEPOSIT_AMOUNT });
      await escrow.connect(buyer).raiseDispute();
    });

    it("should release funds to seller when arbiter rules in seller's favor", async function () {
      const sellerBalanceBefore = await ethers.provider.getBalance(seller.address);

      await escrow.connect(arbiter).resolveDispute(true);

      const sellerBalanceAfter = await ethers.provider.getBalance(seller.address);
      const expectedFee = (DEPOSIT_AMOUNT * BigInt(ARBITER_FEE)) / 100n;
      const expectedPayout = DEPOSIT_AMOUNT - expectedFee;

      expect(sellerBalanceAfter - sellerBalanceBefore).to.equal(expectedPayout);
    });

    it("should refund buyer when arbiter rules in buyer's favor", async function () {
      const buyerBalanceBefore = await ethers.provider.getBalance(buyer.address);

      await escrow.connect(arbiter).resolveDispute(false);

      const buyerBalanceAfter = await ethers.provider.getBalance(buyer.address);
      const expectedFee = (DEPOSIT_AMOUNT * BigInt(ARBITER_FEE)) / 100n;
      const expectedPayout = DEPOSIT_AMOUNT - expectedFee;

      // Buyer menerima refund (dikurangi fee)
      expect(buyerBalanceAfter - buyerBalanceBefore).to.be.closeTo(
        expectedPayout,
        ethers.parseEther("0.01") // toleransi gas
      );
    });

    it("should pay arbiter fee when resolving dispute", async function () {
      const arbiterBalanceBefore = await ethers.provider.getBalance(arbiter.address);

      const tx = await escrow.connect(arbiter).resolveDispute(true);
      const receipt = await tx.wait();
      const gasUsed = receipt.gasUsed * receipt.gasPrice;

      const arbiterBalanceAfter = await ethers.provider.getBalance(arbiter.address);
      const expectedFee = (DEPOSIT_AMOUNT * BigInt(ARBITER_FEE)) / 100n;

      // Net change = fee received - gas spent
      expect(arbiterBalanceAfter - arbiterBalanceBefore + gasUsed).to.equal(expectedFee);
    });

    it("should emit DisputeResolved event with correct args (seller wins)", async function () {
      const expectedFee = (DEPOSIT_AMOUNT * BigInt(ARBITER_FEE)) / 100n;
      const expectedPayout = DEPOSIT_AMOUNT - expectedFee;

      await expect(escrow.connect(arbiter).resolveDispute(true))
        .to.emit(escrow, "DisputeResolved")
        .withArgs(seller.address, expectedPayout, expectedFee);
    });

    it("should emit DisputeResolved event with correct args (buyer wins)", async function () {
      const expectedFee = (DEPOSIT_AMOUNT * BigInt(ARBITER_FEE)) / 100n;
      const expectedPayout = DEPOSIT_AMOUNT - expectedFee;

      await expect(escrow.connect(arbiter).resolveDispute(false))
        .to.emit(escrow, "DisputeResolved")
        .withArgs(buyer.address, expectedPayout, expectedFee);
    });

    it("should set state to COMPLETE when seller wins", async function () {
      await escrow.connect(arbiter).resolveDispute(true);
      expect(await escrow.currentState()).to.equal(1); // COMPLETE
    });

    it("should set state to REFUNDED when buyer wins", async function () {
      await escrow.connect(arbiter).resolveDispute(false);
      expect(await escrow.currentState()).to.equal(3); // REFUNDED
    });

    it("should revert if non-arbiter tries to resolve dispute", async function () {
      await expect(
        escrow.connect(buyer).resolveDispute(true)
      ).to.be.revertedWith("Escrow: caller is not the arbiter");
    });

    it("should revert if called when not in DISPUTED state", async function () {
      // Reset ke state AWAITING_DELIVERY (escrow baru)
      const SimpleEscrow = await ethers.getContractFactory("SimpleEscrow");
      const freshEscrow = await SimpleEscrow.connect(buyer).deploy(
        buyer.address,
        seller.address,
        arbiter.address,
        DURATION,
        ARBITER_FEE
      );
      await freshEscrow.connect(buyer).deposit({ value: DEPOSIT_AMOUNT });
      // Belum raiseDispute, langsung coba resolve
      await expect(
        freshEscrow.connect(arbiter).resolveDispute(true)
      ).to.be.revertedWith("Escrow: invalid state for this action");
    });

    it("should revert if transfer to seller fails when arbiter rules in seller's favor", async function () {
      const Rejector = await ethers.getContractFactory("Rejector");
      const rejector = await Rejector.deploy();
      await rejector.waitForDeployment();
      const rejectorAddress = await rejector.getAddress();

      const SimpleEscrow = await ethers.getContractFactory("SimpleEscrow");
      const failingEscrow = await SimpleEscrow.connect(buyer).deploy(
        buyer.address,
        rejectorAddress,
        arbiter.address,
        DURATION,
        ARBITER_FEE
      );
      await failingEscrow.waitForDeployment();

      await failingEscrow.connect(buyer).deposit({ value: DEPOSIT_AMOUNT });
      await failingEscrow.connect(buyer).raiseDispute();

      await expect(
        failingEscrow.connect(arbiter).resolveDispute(true)
      ).to.be.revertedWith("Escrow: Transfer to seller failed");
    });

    it("should revert if refund to buyer fails when arbiter rules in buyer's favor", async function () {
      const Rejector = await ethers.getContractFactory("Rejector");
      const rejector = await Rejector.deploy();
      await rejector.waitForDeployment();
      const rejectorAddress = await rejector.getAddress();

      const SimpleEscrow = await ethers.getContractFactory("SimpleEscrow");
      const failingEscrow = await SimpleEscrow.connect(buyer).deploy(
        rejectorAddress,
        seller.address,
        arbiter.address,
        DURATION,
        ARBITER_FEE
      );
      await failingEscrow.waitForDeployment();

      const depositData = failingEscrow.interface.encodeFunctionData("deposit");
      const raiseDisputeData = failingEscrow.interface.encodeFunctionData("raiseDispute");

      await rejector.execute(await failingEscrow.getAddress(), depositData, DEPOSIT_AMOUNT, { value: DEPOSIT_AMOUNT });
      await rejector.execute(await failingEscrow.getAddress(), raiseDisputeData, 0, { value: 0 });

      await expect(
        failingEscrow.connect(arbiter).resolveDispute(false)
      ).to.be.revertedWith("Escrow: Refund to buyer failed");
    });

    it("should revert if fee transfer to arbiter fails", async function () {
      const Rejector = await ethers.getContractFactory("Rejector");
      const rejector = await Rejector.deploy();
      await rejector.waitForDeployment();
      const rejectorAddress = await rejector.getAddress();

      const SimpleEscrow = await ethers.getContractFactory("SimpleEscrow");
      const failingEscrow = await SimpleEscrow.connect(buyer).deploy(
        buyer.address,
        seller.address,
        rejectorAddress,
        DURATION,
        ARBITER_FEE
      );
      await failingEscrow.waitForDeployment();

      await failingEscrow.connect(buyer).deposit({ value: DEPOSIT_AMOUNT });
      await failingEscrow.connect(buyer).raiseDispute();

      const resolveData = failingEscrow.interface.encodeFunctionData("resolveDispute", [true]);
      
      await expect(
        rejector.execute(await failingEscrow.getAddress(), resolveData, 0, { value: 0 })
      ).to.be.revertedWith("Escrow: Fee transfer to arbiter failed");
    });

    it("should not transfer fee if arbiter fee is zero", async function () {
      const SimpleEscrow = await ethers.getContractFactory("SimpleEscrow");
      const zeroFeeEscrow = await SimpleEscrow.connect(buyer).deploy(
        buyer.address,
        seller.address,
        arbiter.address,
        DURATION,
        0
      );
      await zeroFeeEscrow.waitForDeployment();

      await zeroFeeEscrow.connect(buyer).deposit({ value: DEPOSIT_AMOUNT });
      await zeroFeeEscrow.connect(buyer).raiseDispute();

      const arbiterBalanceBefore = await ethers.provider.getBalance(arbiter.address);
      const tx = await zeroFeeEscrow.connect(arbiter).resolveDispute(true);
      const receipt = await tx.wait();
      const gasUsed = receipt.gasUsed * receipt.gasPrice;
      const arbiterBalanceAfter = await ethers.provider.getBalance(arbiter.address);

      expect(arbiterBalanceBefore - arbiterBalanceAfter).to.equal(gasUsed);
    });
  });

  // ─── 6. Timeout Refund ───────────────────────────────────────────────────

  describe("refundAfterTimeout()", function () {
    beforeEach(async function () {
      await escrow.connect(buyer).deposit({ value: DEPOSIT_AMOUNT });
    });

    it("should refund buyer after deadline passes", async function () {
      // Maju waktu melewati deadline
      await time.increase(DURATION + 1);

      const buyerBalanceBefore = await ethers.provider.getBalance(buyer.address);
      const tx = await escrow.connect(buyer).refundAfterTimeout();
      const receipt = await tx.wait();
      const gasUsed = receipt.gasUsed * receipt.gasPrice;
      const buyerBalanceAfter = await ethers.provider.getBalance(buyer.address);

      expect(buyerBalanceAfter - buyerBalanceBefore + gasUsed).to.equal(DEPOSIT_AMOUNT);
    });

    it("should set state to REFUNDED (3)", async function () {
      await time.increase(DURATION + 1);
      await escrow.connect(buyer).refundAfterTimeout();
      expect(await escrow.currentState()).to.equal(3); // REFUNDED
    });

    it("should emit Refunded event", async function () {
      await time.increase(DURATION + 1);
      await expect(escrow.connect(buyer).refundAfterTimeout())
        .to.emit(escrow, "Refunded")
        .withArgs(buyer.address, DEPOSIT_AMOUNT);
    });

    it("should revert if deadline has not passed yet", async function () {
      await expect(
        escrow.connect(buyer).refundAfterTimeout()
      ).to.be.revertedWith("Escrow: deadline has not passed yet");
    });

    it("should revert if non-buyer calls refundAfterTimeout", async function () {
      await time.increase(DURATION + 1);
      await expect(
        escrow.connect(other).refundAfterTimeout()
      ).to.be.revertedWith("Escrow: caller is not the buyer");
    });

    it("should revert if transfer to buyer fails", async function () {
      const Rejector = await ethers.getContractFactory("Rejector");
      const rejector = await Rejector.deploy();
      await rejector.waitForDeployment();
      const rejectorAddress = await rejector.getAddress();

      const SimpleEscrow = await ethers.getContractFactory("SimpleEscrow");
      const failingEscrow = await SimpleEscrow.connect(buyer).deploy(
        rejectorAddress,
        seller.address,
        arbiter.address,
        DURATION,
        ARBITER_FEE
      );
      await failingEscrow.waitForDeployment();

      const depositData = failingEscrow.interface.encodeFunctionData("deposit");
      await rejector.execute(await failingEscrow.getAddress(), depositData, DEPOSIT_AMOUNT, { value: DEPOSIT_AMOUNT });

      await time.increase(DURATION + 1);

      const refundData = failingEscrow.interface.encodeFunctionData("refundAfterTimeout");
      await expect(
        rejector.execute(await failingEscrow.getAddress(), refundData, 0, { value: 0 })
      ).to.be.revertedWith("Escrow: Refund to buyer failed");
    });
  });

  // ─── 7. View Functions ───────────────────────────────────────────────────

  describe("View Functions", function () {
    it("getBalance() should return 0 before deposit", async function () {
      expect(await escrow.getBalance()).to.equal(0n);
    });

    it("getBalance() should return correct amount after deposit", async function () {
      await escrow.connect(buyer).deposit({ value: DEPOSIT_AMOUNT });
      expect(await escrow.getBalance()).to.equal(DEPOSIT_AMOUNT);
    });

    it("isExpired() should return false before deadline", async function () {
      expect(await escrow.isExpired()).to.equal(false);
    });

    it("isExpired() should return true after deadline", async function () {
      await time.increase(DURATION + 1);
      expect(await escrow.isExpired()).to.equal(true);
    });

    it("getEscrowDetails() should return all correct values", async function () {
      await escrow.connect(buyer).deposit({ value: DEPOSIT_AMOUNT });

      const details = await escrow.getEscrowDetails();
      expect(details._buyer).to.equal(buyer.address);
      expect(details._seller).to.equal(seller.address);
      expect(details._arbiter).to.equal(arbiter.address);
      expect(details._depositAmount).to.equal(DEPOSIT_AMOUNT);
      expect(details._state).to.equal(0); // AWAITING_DELIVERY
      expect(details._arbiterFeePercent).to.equal(BigInt(ARBITER_FEE));
    });
  });

  // ─── 8. Access Control ───────────────────────────────────────────────────

  describe("Access Control", function () {
    it("should allow only buyer to call deposit()", async function () {
      await expect(
        escrow.connect(seller).deposit({ value: DEPOSIT_AMOUNT })
      ).to.be.revertedWith("Escrow: caller is not the buyer");

      await expect(
        escrow.connect(arbiter).deposit({ value: DEPOSIT_AMOUNT })
      ).to.be.revertedWith("Escrow: caller is not the buyer");
    });

    it("should allow only buyer to call releaseFunds()", async function () {
      await escrow.connect(buyer).deposit({ value: DEPOSIT_AMOUNT });
      await expect(
        escrow.connect(seller).releaseFunds()
      ).to.be.revertedWith("Escrow: caller is not the buyer");
    });

    it("should allow only arbiter to call resolveDispute()", async function () {
      await escrow.connect(buyer).deposit({ value: DEPOSIT_AMOUNT });
      await escrow.connect(buyer).raiseDispute();

      await expect(
        escrow.connect(buyer).resolveDispute(true)
      ).to.be.revertedWith("Escrow: caller is not the arbiter");

      await expect(
        escrow.connect(seller).resolveDispute(true)
      ).to.be.revertedWith("Escrow: caller is not the arbiter");
    });
  });
});
