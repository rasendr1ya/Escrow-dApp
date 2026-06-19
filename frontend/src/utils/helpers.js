import { ethers } from "ethers";

// ─── State enum mapping (harus match dengan Solidity) ────────────────────────
// enum State { AWAITING_DELIVERY, COMPLETE, DISPUTED, REFUNDED }
export const STATE_LABELS = {
  0: "Awaiting Delivery",
  1: "Complete",
  2: "Disputed",
  3: "Refunded",
};

// Map state ke warna Tailwind untuk status chip
export const STATE_COLORS = {
  0: { bg: "bg-obsidian-neon/10", text: "text-obsidian-neon", border: "border-obsidian-neon/30" },
  1: { bg: "bg-green-500/10", text: "text-green-400", border: "border-green-500/30" },
  2: { bg: "bg-orange-500/10", text: "text-orange-400", border: "border-orange-500/30" },
  3: { bg: "bg-red-500/10", text: "text-red-400", border: "border-red-500/30" },
};

// ─── Network Config ──────────────────────────────────────────────────────────
// Chain ID yang didukung (Hardhat localhost)
export const EXPECTED_CHAIN_ID = 31337;
export const EXPECTED_CHAIN_NAME = "Hardhat Localhost";
export const EXPECTED_RPC_URL = "http://127.0.0.1:8545";

/**
 * Format alamat Ethereum menjadi truncated (0x1234...abcd)
 * @param {string} address - Full 42-char Ethereum address
 * @param {number} start - Jumlah karakter di awal (default 6)
 * @param {number} end - Jumlah karakter di akhir (default 4)
 * @returns {string}
 */
export function formatAddress(address, start = 6, end = 4) {
  if (!address || address.length < 10) return address;
  return `${address.slice(0, start)}...${address.slice(-end)}`;
}

/**
 * Format wei ke ETH string dengan presisi tertentu
 * @param {bigint|string} wei - Nilai dalam wei
 * @param {number} decimals - Jumlah desimal (default 4)
 * @returns {string}
 */
export function formatETH(wei, decimals = 4) {
  if (!wei || wei === 0n || wei === "0") return "0";
  try {
    const eth = ethers.formatEther(wei);
    const num = parseFloat(eth);
    if (num === 0) return "0";
    if (num < 0.0001) return "< 0.0001";
    return num.toFixed(decimals);
  } catch {
    return "0";
  }
}

/**
 * Format Unix timestamp ke tanggal dan waktu lokal (Bahasa Indonesia)
 * @param {number|bigint} timestamp - Unix timestamp dalam detik
 * @returns {{ dateStr: string, relativeStr: string }}
 */
export function formatDeadline(timestamp) {
  const ts = Number(timestamp) * 1000; // ke milidetik
  const date = new Date(ts);

  const dateStr = date.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  // Relative time
  const now = Date.now();
  const diff = ts - now;

  if (diff <= 0) {
    return { dateStr, relativeStr: "Expired" };
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  let relativeStr = "";
  if (days > 0) relativeStr += `${days}d `;
  if (hours > 0) relativeStr += `${hours}h `;
  if (days === 0 && hours < 10) relativeStr += `${minutes}m`;
  relativeStr = relativeStr.trim();

  return { dateStr, relativeStr };
}

/**
 * Tentukan role wallet yang sedang connect berdasarkan address
 * @param {string} account - Address wallet terkoneksi (lowercase)
 * @param {{ buyer: string, seller: string, arbiter: string }} escrowAddresses
 * @returns {string} "buyer" | "seller" | "arbiter" | "unknown"
 */
export function getUserRole(account, escrowAddresses) {
  if (!account || !escrowAddresses) return "unknown";
  const acc = account.toLowerCase();
  if (escrowAddresses.buyer && acc === escrowAddresses.buyer.toLowerCase()) return "buyer";
  if (escrowAddresses.seller && acc === escrowAddresses.seller.toLowerCase()) return "seller";
  if (escrowAddresses.arbiter && acc === escrowAddresses.arbiter.toLowerCase()) return "arbiter";
  return "unknown";
}

/**
 * Cek apakah suatu aksi write valid berdasarkan role + state
 * Mengembalikan array objek aksi yang tersedia
 */
export function getAvailableActions(role, state, isExpired) {
  const actions = [];

  if (role === "buyer") {
    if (state === 0) {
      // AWAITING_DELIVERY
      actions.push({
        key: "deposit",
        label: "Deposit Funds",
        description: "Kirim ETH ke escrow contract untuk memulai transaksi",
        disabled: false,
        needsValue: true, // deposit butuh msg.value (jumlah ETH)
      });
      actions.push({
        key: "release",
        label: "Release Funds",
        description: "Konfirmasi barang diterima & lepas dana ke seller",
        disabled: false,
        needsValue: false,
      });
      actions.push({
        key: "dispute",
        label: "Raise Dispute",
        description: "Ajukan sengketa karena barang/jasa tidak sesuai",
        disabled: false,
        needsValue: false,
      });
      actions.push({
        key: "refund",
        label: "Refund After Timeout",
        description: isExpired
          ? "Deadline sudah lewat — dana bisa dikembalikan"
          : "Menunggu deadline terlewati untuk refund otomatis",
        disabled: !isExpired,
        needsValue: false,
      });
    }
  }

  if (role === "arbiter") {
    if (state === 2) {
      // DISPUTED — arbiter bisa resolve
      actions.push({
        key: "resolveSeller",
        label: "Resolve: Release to Seller",
        description: "Putuskan seller yang benar — dana dikirim ke seller",
        disabled: false,
        needsValue: false,
        resolveValue: true, // releaseToSeller = true
      });
      actions.push({
        key: "resolveBuyer",
        label: "Resolve: Refund to Buyer",
        description: "Putuskan buyer yang benar — dana dikembalikan ke buyer",
        disabled: false,
        needsValue: false,
        resolveValue: false, // releaseToSeller = false
      });
    }
  }

  return actions;
}
