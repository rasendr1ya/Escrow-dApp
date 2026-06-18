/**
 * NetworkStatusCard — Sidebar card untuk network detection.
 *
 * Menampilkan:
 *   - Chain ID yang terdeteksi
 *   - Status: Connected to Hardhat Localhost (hijau) ATAU Wrong Network (merah)
 *   - Tombol "Switch Network" kalau salah network
 *   - Status MetaMask (installed / not installed)
 *
 * Props:
 *   - chainId: number | null (dari useWallet)
 *   - isCorrectNetwork: boolean
 *   - switchNetwork: function
 *   - hasMetaMask: boolean
 */
export default function NetworkStatusCard({
  chainId,
  isCorrectNetwork,
  switchNetwork,
  hasMetaMask,
}) {
  return (
    <div className="rounded-[2.5rem] bg-obsidian-card border border-white/5 p-7 animate-slide-in-right">
      {/* Header */}
      <div className="flex items-center gap-2 mb-5">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
             strokeWidth="2" strokeLinecap="round" className="text-gray-500">
          <circle cx="12" cy="12" r="10" />
          <line x1="2" y1="12" x2="22" y2="12" />
          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
        </svg>
        <span className="text-xs font-mono uppercase tracking-[0.15em] text-gray-500">
          Network Status
        </span>
      </div>

      {/* Status indicator */}
      <div className="space-y-4">
        {/* Network info */}
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-mono uppercase tracking-[0.1em] text-gray-500">
            Chain ID
          </span>
          <span className="text-sm font-mono text-gray-300">
            {chainId ? chainId : "—"}
          </span>
        </div>

        {/* Network name */}
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-mono uppercase tracking-[0.1em] text-gray-500">
            Network
          </span>
          <span className="text-sm font-mono text-gray-300">
            {chainId === 31337 ? "Hardhat Localhost" : chainId ? "Unknown" : "—"}
          </span>
        </div>

        {/* MetaMask status */}
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-mono uppercase tracking-[0.1em] text-gray-500">
            MetaMask
          </span>
          <span
            className={`text-xs font-mono uppercase tracking-wider ${
              hasMetaMask ? "text-green-400" : "text-red-400"
            }`}
          >
            {hasMetaMask ? "Installed" : "Not Found"}
          </span>
        </div>

        {/* Connection status badge */}
        <div
          className={`flex items-center gap-3 px-4 py-3 rounded-2xl border ${
            isCorrectNetwork
              ? "bg-green-500/5 border-green-500/15"
              : "bg-red-500/5 border-red-500/15"
          }`}
        >
          <span
            className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
              isCorrectNetwork ? "bg-green-400 animate-pulse" : "bg-red-400"
            }`}
          />
          <div>
            <p
              className={`text-xs font-mono uppercase tracking-wider ${
                isCorrectNetwork ? "text-green-400" : "text-red-400"
              }`}
            >
              {isCorrectNetwork ? "Connected" : "Wrong Network"}
            </p>
            <p className="text-[10px] text-gray-500 font-body mt-0.5">
              {isCorrectNetwork
                ? "Hardhat Localhost (31337)"
                : "Harap ganti ke Hardhat Localhost"}
            </p>
          </div>
        </div>

        {/* Switch Network button */}
        {!isCorrectNetwork && hasMetaMask && (
          <button
            onClick={switchNetwork}
            className="w-full py-3 text-xs font-mono uppercase tracking-wider
                       text-obsidian-neon border border-obsidian-neon/30 rounded-full
                       hover:bg-obsidian-neon/5 transition-colors duration-200"
          >
            Switch Network
          </button>
        )}
      </div>
    </div>
  );
}
