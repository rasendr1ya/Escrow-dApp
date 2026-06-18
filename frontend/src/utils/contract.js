/**
 * contract.js — ABI dan alamat contract SimpleEscrow
 *
 * ⚠️ GANTI CONTRACT_ADDRESS setelah deploy:
 *   1. Jalankan `npx hardhat node` (Terminal 1)
 *   2. Jalankan `npx hardhat run scripts/deploy.js --network localhost` (Terminal 2)
 *   3. Copy address dari output, paste di bawah
 */

// ─── Contract Address ──────────────────────────────────────────────────────
// Ganti dengan address hasil deploy (contoh: "0x5FbDB2315678afecb367f032d93F642f64180aa3")
export const CONTRACT_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";

// ─── Contract ABI ──────────────────────────────────────────────────────────
// Di-generate dari SimpleEscrow.sol via `npx hardhat compile`
// ABI berisi deskripsi semua fungsi, event, dan state variable public yang bisa
// dipanggil oleh ethers.js untuk encoding/decoding transaksi dan event.
export const CONTRACT_ABI = [
  // ── Constructor ─────────────────────────────────────────────────────────
  {
    inputs: [
      { internalType: "address", name: "_seller", type: "address" },
      { internalType: "address", name: "_arbiter", type: "address" },
      { internalType: "uint256", name: "_durationSeconds", type: "uint256" },
      { internalType: "uint256", name: "_arbiterFeePercent", type: "uint256" },
    ],
    stateMutability: "nonpayable",
    type: "constructor",
  },

  // ── Events ──────────────────────────────────────────────────────────────
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "address", name: "buyer", type: "address" },
      { indexed: false, internalType: "uint256", name: "amount", type: "uint256" },
      { indexed: false, internalType: "uint256", name: "deadline", type: "uint256" },
    ],
    name: "Deposited",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "address", name: "seller", type: "address" },
      { indexed: false, internalType: "uint256", name: "amount", type: "uint256" },
    ],
    name: "FundsReleased",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "address", name: "buyer", type: "address" },
    ],
    name: "DisputeRaised",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "address", name: "buyer", type: "address" },
      { indexed: false, internalType: "uint256", name: "amount", type: "uint256" },
    ],
    name: "Refunded",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "address", name: "winner", type: "address" },
      { indexed: false, internalType: "uint256", name: "winnerAmount", type: "uint256" },
      { indexed: false, internalType: "uint256", name: "arbiterFee", type: "uint256" },
    ],
    name: "DisputeResolved",
    type: "event",
  },

  // ── Write Functions ─────────────────────────────────────────────────────
  {
    inputs: [],
    name: "deposit",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [],
    name: "releaseFunds",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "raiseDispute",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "refundAfterTimeout",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "bool", name: "releaseToSeller", type: "bool" },
    ],
    name: "resolveDispute",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },

  // ── Read Functions ──────────────────────────────────────────────────────
  {
    inputs: [],
    name: "getBalance",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "isExpired",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getEscrowDetails",
    outputs: [
      { internalType: "address", name: "_buyer", type: "address" },
      { internalType: "address", name: "_seller", type: "address" },
      { internalType: "address", name: "_arbiter", type: "address" },
      { internalType: "uint256", name: "_depositAmount", type: "uint256" },
      { internalType: "uint8", name: "_state", type: "uint8" },
      { internalType: "uint256", name: "_deadline", type: "uint256" },
      { internalType: "uint256", name: "_arbiterFeePercent", type: "uint256" },
    ],
    stateMutability: "view",
    type: "function",
  },

  // ── Public State Variables (auto-generated getters) ─────────────────────
  {
    inputs: [],
    name: "buyer",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "seller",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "arbiter",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "depositAmount",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "currentState",
    outputs: [{ internalType: "uint8", name: "", type: "uint8" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "deadline",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "arbiterFeePercent",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
];
