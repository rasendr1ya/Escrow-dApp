/**
 * TransactionToast — Feedback notifikasi untuk transaksi.
 *
 * State:
 *   - pending: animasi pulse dengan border glow
 *   - success: badge hijau solid
 *   - failed: badge merah dengan pesan error
 *
 * Props:
 *   - txStatus: "idle" | "pending" | "success" | "failed"
 *   - txError: string | null (pesan error user-friendly)
 *   - txSuccessMsg: string | null (pesan sukses user-friendly)
 *   - lastAction: string | null (jenis aksi terakhir)
 *   - onDismiss: function untuk close manual
 */
export default function TransactionToast({
  txStatus,
  txError,
  txSuccessMsg,
  lastAction,
  onDismiss,
}) {
  if (txStatus === "idle" || !lastAction) return null;

  const isPending = txStatus === "pending";
  const isSuccess = txStatus === "success";
  const isFailed = txStatus === "failed";

  return (
    <div
      className={`fixed bottom-8 left-1/2 -translate-x-1/2 z-50
                  max-w-md w-[calc(100%-2rem)]
                  rounded-2xl p-5
                  animate-fade-in-up

                  /* Background based on status */
                  ${isPending ? "bg-obsidian-card border border-obsidian-neon/30 animate-pulse-glow" : ""}
                  ${isSuccess ? "bg-green-500/5 border border-green-500/20" : ""}
                  ${isFailed ? "bg-red-500/5 border border-red-500/20" : ""}

                  /* Glass effect */
                  backdrop-blur-xl shadow-2xl`}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className="flex-shrink-0 mt-0.5">
          {isPending && (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
                 className="animate-spin text-obsidian-neon">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3"
                      strokeDasharray="32" strokeLinecap="round" />
            </svg>
          )}
          {isSuccess && (
            <div className="w-5 h-5 rounded-full bg-green-400 flex items-center justify-center">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
                   stroke="#000" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
          )}
          {isFailed && (
            <div className="w-5 h-5 rounded-full bg-red-400 flex items-center justify-center">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
                   stroke="#000" strokeWidth="3.5" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className="text-xs font-mono uppercase tracking-[0.15em] mb-1">
            {isPending && (
              <span className="text-obsidian-neon">Transaction Pending</span>
            )}
            {isSuccess && (
              <span className="text-green-400">Transaction Success</span>
            )}
            {isFailed && (
              <span className="text-red-400">Transaction Failed</span>
            )}
          </p>
          <p className="text-sm text-gray-300 font-body">
            {isPending && "Menunggu konfirmasi di MetaMask dan blockchain..."}
            {isSuccess && txSuccessMsg}
            {isFailed && txError}
          </p>
        </div>

        {/* Close button (only for success/failed) */}
        {!isPending && onDismiss && (
          <button
            onClick={onDismiss}
            className="flex-shrink-0 text-gray-500 hover:text-white transition-colors p-1"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                 stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}
