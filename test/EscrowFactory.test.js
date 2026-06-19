const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("EscrowFactory", function () {
  let factory;
  let buyer, seller, arbiter, other;

  const DURATION = 3 * 24 * 60 * 60; // 3 days
  const ARBITER_FEE = 5; // 5%

  beforeEach(async function () {
    [buyer, seller, arbiter, other] = await ethers.getSigners();

    const EscrowFactory = await ethers.getContractFactory("EscrowFactory");
    factory = await EscrowFactory.connect(buyer).deploy();
    await factory.waitForDeployment();
  });

  describe("Deployment", function () {
    it("should initialize escrowCount as zero", async function () {
      expect(await factory.escrowCount()).to.equal(0n);
    });

    it("should return empty array for user who has no escrows", async function () {
      const escrows = await factory.getEscrowsByUser(buyer.address);
      expect(escrows.length).to.equal(0);
    });
  });

  describe("createEscrow()", function () {
    let tx, receipt, escrowAddress;

    beforeEach(async function () {
      tx = await factory.connect(buyer).createEscrow(
        seller.address,
        arbiter.address,
        DURATION,
        ARBITER_FEE
      );
      receipt = await tx.wait();

      // Find EscrowCreated event
      const event = receipt.logs
        .map((log) => {
          try {
            return factory.interface.parseLog(log);
          } catch (e) {
            return null;
          }
        })
        .find((parsed) => parsed && parsed.name === "EscrowCreated");

      expect(event).to.not.be.null;
      escrowAddress = event.args.escrowAddress;
    });

    it("should increment escrowCount", async function () {
      expect(await factory.escrowCount()).to.equal(1n);
    });

    it("should store escrow address in allEscrows array", async function () {
      expect(await factory.allEscrows(0)).to.equal(escrowAddress);
    });

    it("should map escrowId to escrow address", async function () {
      expect(await factory.idToEscrow(0)).to.equal(escrowAddress);
    });

    it("should add escrow to userToEscrows mapping for buyer, seller, and arbiter", async function () {
      const buyerEscrows = await factory.getEscrowsByUser(buyer.address);
      const sellerEscrows = await factory.getEscrowsByUser(seller.address);
      const arbiterEscrows = await factory.getEscrowsByUser(arbiter.address);
      const otherEscrows = await factory.getEscrowsByUser(other.address);

      expect(buyerEscrows[0]).to.equal(escrowAddress);
      expect(sellerEscrows[0]).to.equal(escrowAddress);
      expect(arbiterEscrows[0]).to.equal(escrowAddress);
      expect(otherEscrows.length).to.equal(0);
    });

    it("should emit EscrowCreated event with correct parameters", async function () {
      // Re-trigger deployment to verify expect(tx).to.emit syntax
      const newTx = factory.connect(buyer).createEscrow(
        seller.address,
        arbiter.address,
        DURATION,
        ARBITER_FEE
      );

      await expect(newTx)
        .to.emit(factory, "EscrowCreated")
        .withArgs(1n, ethers.isAddress, buyer.address, seller.address, arbiter.address);
    });

    it("should deploy a functional SimpleEscrow contract with correct parameters", async function () {
      const SimpleEscrow = await ethers.getContractFactory("SimpleEscrow");
      const escrow = SimpleEscrow.attach(escrowAddress);

      expect(await escrow.buyer()).to.equal(buyer.address);
      expect(await escrow.seller()).to.equal(seller.address);
      expect(await escrow.arbiter()).to.equal(arbiter.address);
      expect(await escrow.arbiterFeePercent()).to.equal(BigInt(ARBITER_FEE));
      expect(await escrow.currentState()).to.equal(0n); // AWAITING_DELIVERY
      expect(await escrow.depositAmount()).to.equal(0n);
    });
  });

  describe("Integration: Interacting with deployed SimpleEscrow", function () {
    let escrow;
    const DEPOSIT_AMOUNT = ethers.parseEther("0.5");

    beforeEach(async function () {
      const tx = await factory.connect(buyer).createEscrow(
        seller.address,
        arbiter.address,
        DURATION,
        ARBITER_FEE
      );
      const receipt = await tx.wait();
      
      const event = receipt.logs
        .map((log) => {
          try {
            return factory.interface.parseLog(log);
          } catch (e) {
            return null;
          }
        })
        .find((parsed) => parsed && parsed.name === "EscrowCreated");

      const SimpleEscrow = await ethers.getContractFactory("SimpleEscrow");
      escrow = SimpleEscrow.attach(event.args.escrowAddress);
    });

    it("should allow buyer to deposit through the deployed instance", async function () {
      await expect(
        escrow.connect(buyer).deposit({ value: DEPOSIT_AMOUNT })
      )
        .to.emit(escrow, "Deposited")
        .withArgs(buyer.address, DEPOSIT_AMOUNT, await escrow.deadline());

      expect(await escrow.getBalance()).to.equal(DEPOSIT_AMOUNT);
      expect(await escrow.depositAmount()).to.equal(DEPOSIT_AMOUNT);
    });

    it("should complete full workflow: deposit, raise dispute, and arbiter resolve", async function () {
      // 1. Deposit
      await escrow.connect(buyer).deposit({ value: DEPOSIT_AMOUNT });
      expect(await escrow.currentState()).to.equal(0n); // AWAITING_DELIVERY

      // 2. Raise Dispute
      await expect(escrow.connect(buyer).raiseDispute())
        .to.emit(escrow, "DisputeRaised")
        .withArgs(buyer.address);
      expect(await escrow.currentState()).to.equal(2n); // DISPUTED

      // 3. Resolve Dispute (seller wins)
      const sellerBalanceBefore = await ethers.provider.getBalance(seller.address);
      
      const expectedFee = (DEPOSIT_AMOUNT * BigInt(ARBITER_FEE)) / 100n;
      const expectedPayout = DEPOSIT_AMOUNT - expectedFee;

      await expect(escrow.connect(arbiter).resolveDispute(true))
        .to.emit(escrow, "DisputeResolved")
        .withArgs(seller.address, expectedPayout, expectedFee);

      expect(await escrow.currentState()).to.equal(1n); // COMPLETE
      expect(await escrow.depositAmount()).to.equal(0n);
      expect(await escrow.getBalance()).to.equal(0n);

      const sellerBalanceAfter = await ethers.provider.getBalance(seller.address);
      expect(sellerBalanceAfter - sellerBalanceBefore).to.equal(expectedPayout);
    });
  });
});
