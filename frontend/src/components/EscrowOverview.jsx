import { STATE_LABELS, STATE_COLORS, formatETH, formatDeadline } from "../utils/helpers";

/**
 * EscrowOverview — Hero card utama menampilkan:
 *   - Jumlah ETH yang di-deposit (angka besar)
 *   - Status chip (AWAITING_DELIVERY / DISPUTED / COMPLETE / REFUNDED)
 *   - Countdown deadline
 *   - Role badge wallet yang terkoneksi
 *
 * Props:
 *   - escrowData: hasil dari getEscrowDetails() (object atau null)
 *   - isExpired: boolean apakah deadline sudah lewat
 *   - userRole: "buyer" | "seller" | "arbiter" | "unknown"
 *   - isLoading: boolean loading state
 */
export default function EscrowOverview({ escrowData, isExpired, userRole, isLoading }) {
  // ── Loading state ───────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="relative overflow-hidden rounded-[3rem] bg-obsidian-card border border-white/5 p-10 md:p-14">
        <div className="animate-pulse space-y-6">
          <div className="h-4 w-32 bg-obsidian-surface rounded-full" />
          <div className="h-20 w-64 bg-obsidian-surface rounded-3xl" />
          <div className="h-3 w-48 bg-obsidian-surface rounded-full" />
        </div>
      </div>
    );
  }

  // ── Empty state (belum ada data / contract belum di-deploy) ────────────
  if (!escrowData) {
    return (
      <div className="relative overflow-hidden rounded-[3rem] bg-obsidian-card border border-white/5 p-10 md:p-14">
        <p className="text-gray-500 font-mono text-sm uppercase tracking-wider">
          No escrow data available
        </p>
        <p className="text-gray-600 text-xs mt-2 font-body">
          Pastikan contract sudah di-deploy dan CONTRACT_ADDRESS sudah diisi di utils/contract.js
        </p>
      </div>
    );
  }

  const stateInfo = STATE_COLORS[escrowData.state] || STATE_COLORS[0];
  const formattedDeadline = formatDeadline(escrowData.deadline);
  const hasDeposit = escrowData.depositAmount && escrowData.depositAmount > 0n;

  return (
    <div className="relative overflow-hidden rounded-[3rem] bg-obsidian-card border border-white/5 p-10 md:p-14 animate-fade-in-up">
      {/* Neon accent glow di top-right */}
      <div
        className="absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl opacity-[0.03] pointer-events-none"
        style={{ background: "radial-gradient(circle, #E1FF4A, transparent)" }}
      />

      {/* ── Header: label + status ─────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
        <span className="text-xs font-mono uppercase tracking-[0.15em] text-gray-500">
          Escrow Overview
        </span>
        <span
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border
                       text-xs font-mono uppercase tracking-wider
                       ${stateInfo.bg} ${stateInfo.text} ${stateInfo.border}`}
        >
          <span className={`w-2 h-2 rounded-full ${stateInfo.text.replace("text-", "bg-")}`} />
          {STATE_LABELS[escrowData.state]}
        </span>
      </div>

      {/* ── Hero amount ────────────────────────────────────────────────── */}
      <div className="mb-6">
        <p className="text-xs font-mono uppercase tracking-[0.15em] text-gray-500 mb-2">
          Locked Amount
        </p>
        <div className="flex items-baseline gap-2">
          <span className="text-6xl md:text-7xl font-heading font-bold text-white text-glow tracking-tight">
            {formatETH(escrowData.depositAmount)}
          </span>
          <span className="text-2xl md:text-3xl font-mono text-obsidian-neon font-medium">
            ETH
          </span>
        </div>
        {!hasDeposit && escrowData.state === 0 && (
          <p className="text-sm text-orange-400/70 font-body mt-2">
            Belum ada dana di-deposit. Buyer harus deposit untuk memulai escrow.
          </p>
        )}
      </div>

      {/* ── Deadline countdown ─────────────────────────────────────────── */}
      <div className="flex items-center gap-6 flex-wrap">
        <div>
          <p className="text-[10px] font-mono uppercase tracking-[0.15em] text-gray-500 mb-1">
            Deadline
          </p>
          <p className="text-sm font-body text-gray-300">
            {formattedDeadline.dateStr}
          </p>
        </div>
        <div>
          <p className="text-[10px] font-mono uppercase tracking-[0.15em] text-gray-500 mb-1">
            Countdown
          </p>
          <p
            className={`text-sm font-mono font-medium ${
              isExpired ? "text-red-400" : "text-obsidian-neon"
            }`}
          >
            {isExpired ? "EXPIRED" : formattedDeadline.relativeStr}
          </p>
        </div>
        {escrowData.arbiterFeePercent > 0 && (
          <div>
            <p className="text-[10px] font-mono uppercase tracking-[0.15em] text-gray-500 mb-1">
              Arbiter Fee
            </p>
            <p className="text-sm font-mono text-gray-400">
              {escrowData.arbiterFeePercent}%
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
