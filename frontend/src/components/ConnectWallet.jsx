import { useWallet } from "../hooks/useWallet";
import { formatAddress } from "../utils/helpers";

/**
 * ConnectWallet — Komponen wallet connection.
 *
 * Tiga state utama:
 * 1. MetaMask tidak terinstall → pesan install
 * 2. Belum connect → tombol connect
 * 3. Sudah connect → tampilkan address + role badge + disconnect
 *
 * Role ditentukan di level App.jsx dengan membandingkan account vs address
 * di contract (buyer/seller/arbiter).
 */
export default function ConnectWallet({ userRole }) {
  const {
    account,
    connectWallet,
    disconnectWallet,
    isConnecting,
    hasMetaMask,
    error,
  } = useWallet();

  // ── State 1: MetaMask tidak terdeteksi ──────────────────────────────────
  if (!hasMetaMask) {
    return (
      <div className="flex items-center gap-3 px-5 py-3 bg-red-500/10 border border-red-500/20 rounded-full">
        <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
        <span className="text-red-400 text-sm font-mono tracking-wide uppercase">
          Install MetaMask
        </span>
      </div>
    );
  }

  // ── State 2: Belum connect ──────────────────────────────────────────────
  if (!account) {
    return (
      <div className="flex items-center gap-3">
        {error && (
          <span className="text-red-400 text-xs font-mono mr-2">{error}</span>
        )}
        <button
          onClick={connectWallet}
          disabled={isConnecting}
          className="px-6 py-3 bg-obsidian-neon text-black font-semibold rounded-full
                     text-sm tracking-wide transition-all duration-200
                     hover:bg-obsidian-neon-hover disabled:opacity-50
                     disabled:cursor-not-allowed font-heading"
        >
          {isConnecting ? (
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
              Connecting...
            </span>
          ) : (
            "Connect Wallet"
          )}
        </button>
      </div>
    );
  }

  // ── State 3: Connected ──────────────────────────────────────────────────
  const roleLabels = {
    buyer: "Buyer",
    seller: "Seller",
    arbiter: "Arbiter",
    unknown: "Viewer",
  };

  const roleColors = {
    buyer: "bg-obsidian-neon/10 text-obsidian-neon border-obsidian-neon/30",
    seller: "bg-blue-400/10 text-blue-400 border-blue-400/30",
    arbiter: "bg-purple-400/10 text-purple-400 border-purple-400/30",
    unknown: "bg-gray-400/10 text-gray-400 border-gray-400/30",
  };

  return (
    <div className="flex items-center gap-3">
      {/* Role badge */}
      <span
        className={`px-3 py-1.5 text-xs font-mono uppercase tracking-wider
                     rounded-full border ${roleColors[userRole] || roleColors.unknown}`}
      >
        {roleLabels[userRole]}
      </span>

      {/* Address display */}
      <div className="flex items-center gap-2 px-4 py-2 bg-obsidian-surface rounded-full border border-white/5">
        <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
        <span className="text-sm font-mono text-gray-300">
          {formatAddress(account)}
        </span>
      </div>

      {/* Disconnect button */}
      <button
        onClick={disconnectWallet}
        className="px-3 py-2 text-xs font-mono text-gray-500 hover:text-red-400
                   transition-colors duration-200 rounded-full hover:bg-red-500/5"
        title="Disconnect wallet"
      >
        ✕
      </button>
    </div>
  );
}
