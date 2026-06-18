/**
 * errors.js — Mapping error teknis (revert reason, MetaMask error code)
 * ke pesan user-friendly dalam Bahasa Indonesia.
 *
 * Penting: jangan pernah tampilkan raw error/stack trace ke user.
 * Gunakan fungsi parseContractError() untuk semua error dari transaksi.
 */

// Mapping string error yang mungkin muncul dari MetaMask / ethers.js
const ERROR_MAP = {
  // ── MetaMask / User errors ──────────────────────────────────────────────
  "user rejected": "Transaksi dibatalkan oleh pengguna di MetaMask.",
  "user denied": "Permintaan koneksi wallet ditolak pengguna.",
  "already pending":
    "Tunggu transaksi sebelumnya selesai terlebih dahulu.",

  // ── Network errors ──────────────────────────────────────────────────────
  "network changed": "Jaringan berubah saat transaksi berlangsung.",
  "unsupported network": "Jaringan tidak didukung. Gunakan Hardhat Localhost.",
  "nonce too high":
    "Nonce terlalu tinggi. Coba reset akun di MetaMask Settings > Advanced > Reset Account.",
  "insufficient funds":
    "Saldo ETH tidak cukup untuk membayar gas + jumlah transaksi.",

  // ── Contract revert reasons (harus match dengan require di .sol) ────────
  "Escrow: caller is not the buyer":
    "Hanya buyer yang bisa melakukan aksi ini.",
  "Escrow: caller is not the arbiter":
    "Hanya arbiter yang bisa menyelesaikan sengketa.",
  "Escrow: invalid state for this action":
    "Aksi ini tidak valid untuk status escrow saat ini.",
  "Escrow: deposit amount must be greater than zero":
    "Jumlah deposit harus lebih dari 0 ETH.",
  "Escrow: already deposited":
    "Deposit sudah dilakukan sebelumnya (hanya bisa satu kali).",
  "Escrow: deadline has passed":
    "Deadline sudah terlewati, tidak bisa deposit.",
  "Escrow: no funds deposited":
    "Belum ada dana yang di-deposit ke escrow.",
  "Escrow: deadline has not passed yet":
    "Deadline belum terlewati. Tunggu hingga batas waktu habis untuk refund.",
  "Escrow: no funds to resolve":
    "Tidak ada dana di escrow untuk diselesaikan.",
  "Escrow: buyer and seller cannot be the same":
    "Buyer dan seller tidak boleh alamat yang sama.",
  "Escrow: arbiter fee cannot exceed 10%":
    "Fee arbiter tidak boleh melebihi 10%.",
  "Escrow: seller is zero address":
    "Alamat seller tidak valid (zero address).",
  "Escrow: arbiter is zero address":
    "Alamat arbiter tidak valid (zero address).",

  // ── Generic fallback ────────────────────────────────────────────────────
  "execution reverted":
    "Transaksi gagal di blockchain. Pastikan semua syarat terpenuhi.",

  "call revert exception":
    "Gagal membaca data dari smart contract. Pastikan contract sudah di-deploy.",
};

/**
 * Parse error dari ethers.js / MetaMask menjadi pesan user-friendly (Bahasa Indonesia).
 * Falls back ke pesan generik jika tidak dikenali.
 *
 * @param {Error|string} error - Error object dari ethers.js atau string
 * @returns {string} Pesan error dalam Bahasa Indonesia
 */
export function parseContractError(error) {
  const message = typeof error === "string" ? error.toLowerCase() : "";

  // Cari error message dari error object (ethers.js biasanya punya .reason atau .message)
  const rawMessage = error?.reason
    || error?.error?.message
    || error?.data?.message
    || error?.message
    || error?.toString()
    || "";

  const lowerRaw = rawMessage.toLowerCase();

  // ── Cek MetaMask user rejection terlebih dahulu (kode error khusus) ────
  if (error?.code === "ACTION_REJECTED" || error?.code === 4001) {
    return ERROR_MAP["user rejected"];
  }

  // ── Cek string match terhadap known errors (prioritaskan yang spesifik) ─
  const knownErrors = Object.keys(ERROR_MAP);
  for (const pattern of knownErrors) {
    if (lowerRaw.includes(pattern.toLowerCase()) || message.includes(pattern.toLowerCase())) {
      return ERROR_MAP[pattern];
    }
  }

  // ── Fallback generik ────────────────────────────────────────────────────
  return "Terjadi kesalahan tak terduga. Silakan coba lagi atau refresh halaman.";
}

/**
 * Ambil pesan sukses dalam Bahasa Indonesia berdasarkan jenis aksi
 * @param {string} actionKey - Kunci aksi (deposit, release, dispute, refund, resolveSeller, resolveBuyer)
 * @returns {string}
 */
export function getSuccessMessage(actionKey) {
  const messages = {
    deposit: "Deposit berhasil! Dana telah dikunci di escrow.",
    release: "Dana berhasil dirilis ke seller.",
    dispute: "Sengketa berhasil diajukan. Menunggu keputusan arbiter.",
    refund: "Refund berhasil! Dana telah dikembalikan ke wallet Anda.",
    resolveSeller: "Sengketa diselesaikan: dana dikirim ke seller.",
    resolveBuyer: "Sengketa diselesaikan: dana dikembalikan ke buyer.",
  };
  return messages[actionKey] || "Transaksi berhasil!";
}
