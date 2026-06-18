import { useState } from "react";
import { getAvailableActions } from "../utils/helpers";

/**
 * ActionPanel — Tombol aksi kontekstual berdasarkan role + state.
 *
 * Props:
 *   - userRole: "buyer" | "seller" | "arbiter" | "unknown"
 *   - escrowData: data dari getEscrowDetails()
 *   - isExpired: boolean
 *   - onDeposit: function(amountETH)
 *   - onRelease: function()
 *   - onDispute: function()
 *   - onRefund: function()
 *   - onResolve: function(releaseToSeller)
 *   - txStatus: "idle" | "pending" | "success" | "failed"
 */
export default function ActionPanel({
  userRole,
  escrowData,
  isExpired,
  onDeposit,
  onRelease,
  onDispute,
  onRefund,
  onResolve,
  txStatus,
}) {
  const [depositAmount, setDepositAmount] = useState("");
  const [showDepositInput, setShowDepositInput] = useState(false);
  const isPending = txStatus === "pending";

  // Jika user tidak punya role (unknown / viewer) — tampilkan info read-only
  if (userRole === "unknown" || userRole === "seller") {
    return (
      <div className="rounded-[2.5rem] bg-obsidian-card border border-white/5 p-8 animate-fade-in-up">
        <p className="text-xs font-mono uppercase tracking-[0.15em] text-gray-500 mb-3">
          Actions
        </p>
        <p className="text-sm text-gray-400 font-body">
          {userRole === "seller"
            ? "Anda login sebagai Seller. Tunggu buyer untuk deposit, release, atau dispute."
            : "Hubungkan wallet yang terdaftar sebagai Buyer, Seller, atau Arbiter untuk melakukan aksi."}
        </p>
      </div>
    );
  }

  // Ambil daftar aksi yang tersedia untuk role + state ini
  const state = escrowData?.state ?? 0;
  const actions = getAvailableActions(userRole, state, isExpired);

  // Jika tidak ada aksi tersedia
  if (actions.length === 0) {
    return (
      <div className="rounded-[2.5rem] bg-obsidian-card border border-white/5 p-8 animate-fade-in-up">
        <p className="text-xs font-mono uppercase tracking-[0.15em] text-gray-500 mb-3">
          Actions
        </p>
        <p className="text-sm text-gray-400 font-body">
          Tidak ada aksi yang tersedia untuk role dan status saat ini.
        </p>
      </div>
    );
  }

  // ── Handle aksi ─────────────────────────────────────────────────────────
  const handleAction = (action) => {
    if (action.needsValue) {
      // Deposit — perlu input jumlah ETH
      if (!showDepositInput) {
        setShowDepositInput(true);
        return;
      }
      if (!depositAmount || parseFloat(depositAmount) <= 0) return;
      onDeposit(depositAmount);
      setDepositAmount("");
      setShowDepositInput(false);
    } else if (action.key === "release") {
      onRelease();
    } else if (action.key === "dispute") {
      onDispute();
    } else if (action.key === "refund") {
      onRefund();
    } else if (action.key === "resolveSeller" || action.key === "resolveBuyer") {
      onResolve(action.resolveValue);
    }
  };

  return (
    <div className="rounded-[2.5rem] bg-obsidian-card border border-white/5 p-8 animate-fade-in-up">
      <p className="text-xs font-mono uppercase tracking-[0.15em] text-gray-500 mb-5">
        Actions
      </p>

      <div className="space-y-4">
        {actions.map((action) => (
          <div key={action.key}>
            {/* Deposit input khusus */}
            {action.needsValue && showDepositInput && (
              <div className="mb-4 px-4 py-3 bg-obsidian-surface rounded-2xl border border-white/5">
                <label className="block text-[10px] font-mono uppercase tracking-[0.15em] text-gray-400 mb-2">
                  Jumlah ETH untuk Deposit
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    step="0.001"
                    min="0.001"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    placeholder="0.0"
                    disabled={isPending}
                    className="flex-1 bg-transparent text-2xl font-heading font-bold text-white
                               placeholder-gray-600 outline-none
                               [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none
                               [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  <span className="text-lg font-mono text-obsidian-neon font-medium">ETH</span>
                </div>
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => handleAction(action)}
                    disabled={isPending || !depositAmount || parseFloat(depositAmount) <= 0}
                    className="flex-1 py-3 bg-obsidian-neon text-black font-semibold rounded-full
                               text-sm tracking-wide transition-all duration-200
                               hover:bg-obsidian-neon-hover disabled:opacity-30
                               disabled:cursor-not-allowed font-heading"
                  >
                    {isPending ? (
                      <span className="flex items-center justify-center gap-2">
                        <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                        Depositing...
                      </span>
                    ) : (
                      `Deposit ${depositAmount || "0"} ETH`
                    )}
                  </button>
                  <button
                    onClick={() => setShowDepositInput(false)}
                    disabled={isPending}
                    className="px-4 py-3 text-sm text-gray-400 hover:text-white rounded-full
                               border border-white/10 transition-colors font-mono"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Tombol aksi utama */}
            {!(action.needsValue && showDepositInput) && (
              <button
                onClick={() => handleAction(action)}
                disabled={action.disabled || isPending}
                title={action.description}
                className="group relative w-full py-5 px-6 rounded-[2rem] font-heading font-semibold
                           text-sm tracking-wide transition-all duration-300
                           disabled:opacity-30 disabled:cursor-not-allowed

                           /* Default style (release, dispute, etc.) */
                           bg-obsidian-surface border border-white/5 text-white
                           hover:bg-obsidian-neon hover:text-black hover:border-obsidian-neon

                           /* Khusus resolve — style berbeda untuk attention */
                           data-[resolve=true]:bg-orange-500/10
                           data-[resolve=true]:border-orange-500/20
                           data-[resolve=true]:text-orange-400
                           data-[resolve=true]:hover:bg-orange-500
                           data-[resolve=true]:hover:text-black

                           /* Khusus deposit — primary CTA */
                           data-[deposit=true]:bg-obsidian-neon
                           data-[deposit=true]:text-black
                           data-[deposit=true]:border-obsidian-neon
                           data-[deposit=true]:hover:bg-obsidian-neon-hover"
                data-resolve={
                  action.key === "resolveSeller" || action.key === "resolveBuyer"
                    ? "true"
                    : undefined
                }
                data-deposit={action.key === "deposit" ? "true" : undefined}
              >
                {isPending ? (
                  <span className="flex items-center justify-center gap-2">
                    <span
                      className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"
                    />
                    Processing...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    {action.key === "deposit" && (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                           strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="12" y1="5" x2="12" y2="19"/>
                        <polyline points="19 12 12 19 5 12"/>
                      </svg>
                    )}
                    {action.label}
                  </span>
                )}
              </button>
            )}

            {/* Deskripsi aksi */}
            {!action.disabled && !(action.needsValue && showDepositInput) && (
              <p className="text-xs text-gray-500 mt-1.5 px-2 font-body">{action.description}</p>
            )}
            {action.disabled && (
              <p className="text-xs text-orange-400/50 mt-1.5 px-2 font-body italic">
                {action.description}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
