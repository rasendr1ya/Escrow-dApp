import { useState } from "react";
import { formatAddress, formatDeadline } from "../utils/helpers";

/**
 * EscrowDetailsCard — Sidebar yang menampilkan detail escrow on-chain.
 *
 * Menampilkan:
 *   - Asset: ETH
 *   - Amount: jumlah deposit
 *   - Buyer / Seller / Arbiter address (truncated + copy button)
 *   - Deadline (tanggal + countdown)
 *   - Status escrow
 *
 * Props:
 *   - escrowData: object dari getEscrowDetails()
 *   - isExpired: boolean
 *   - isLoading: boolean
 */
export default function EscrowDetailsCard({ escrowData, isExpired, isLoading }) {
  const [copied, setCopied] = useState(null);

  // Fungsi copy address ke clipboard
  const copyAddress = (address, label) => {
    navigator.clipboard.writeText(address).then(() => {
      setCopied(label);
      setTimeout(() => setCopied(null), 2000);
    });
  };

  if (isLoading) {
    return (
      <div className="rounded-[2.5rem] bg-obsidian-card border border-white/5 p-7">
        <div className="animate-pulse space-y-4">
          <div className="h-3 w-24 bg-obsidian-surface rounded-full" />
          <div className="h-3 w-48 bg-obsidian-surface rounded-full" />
          <div className="h-3 w-36 bg-obsidian-surface rounded-full" />
          <div className="h-3 w-40 bg-obsidian-surface rounded-full" />
          <div className="h-3 w-32 bg-obsidian-surface rounded-full" />
        </div>
      </div>
    );
  }

  if (!escrowData) return null;

  const deadlineInfo = formatDeadline(escrowData.deadline);

  const details = [
    { label: "Asset", value: "ETH", mono: true },
    {
      label: "Amount",
      value: `${parseFloat(escrowData.depositAmount > 0n ? escrowData.depositAmount : 0) / 1e18} ETH`,
      mono: true,
    },
    ...(escrowData.arbiterFeePercent > 0
      ? [{ label: "Arbiter Fee", value: `${escrowData.arbiterFeePercent}%`, mono: true }]
      : []),
    { label: "Deadline", value: deadlineInfo.dateStr, mono: false },
    {
      label: "Expired",
      value: isExpired ? "Yes" : "No",
      mono: true,
      isExpired,
    },
  ];

  return (
    <div className="rounded-[2.5rem] bg-obsidian-card border border-white/5 p-7 animate-slide-in-right">
      {/* Header */}
      <div className="flex items-center gap-2 mb-5">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
             strokeWidth="2" strokeLinecap="round" className="text-gray-500">
          <rect x="3" y="3" width="18" height="18" rx="3" />
          <line x1="3" y1="9" x2="21" y2="9" />
          <line x1="9" y1="21" x2="9" y2="9" />
        </svg>
        <span className="text-xs font-mono uppercase tracking-[0.15em] text-gray-500">
          Escrow Details
        </span>
      </div>

      <div className="space-y-4">
        {details.map(({ label, value, mono, isExpired: expired }) => (
          <div key={label} className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase tracking-[0.1em] text-gray-500">
              {label}
            </span>
            <span
              className={`text-xs ${mono ? "font-mono" : "font-body"} ${
                expired ? "text-red-400" : "text-gray-300"
              }`}
            >
              {value}
            </span>
          </div>
        ))}

        {/* Divider */}
        <div className="border-t border-white/5 pt-4 mt-2">
          <span className="text-[10px] font-mono uppercase tracking-[0.15em] text-gray-500 mb-4 block">
            Addresses
          </span>

          {/* Address rows */}
          {[
            { label: "Buyer", addr: escrowData.buyer },
            { label: "Seller", addr: escrowData.seller },
            { label: "Arbiter", addr: escrowData.arbiter },
          ].map(({ label, addr }) => (
            <div key={label} className="flex items-center justify-between py-1.5">
              <span className="text-[10px] font-mono uppercase tracking-[0.1em] text-gray-500 w-14">
                {label}
              </span>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-mono text-gray-400">
                  {formatAddress(addr)}
                </span>
                <button
                  onClick={() => copyAddress(addr, label)}
                  className="p-1 text-gray-600 hover:text-obsidian-neon transition-colors rounded-md"
                  title="Copy address"
                >
                  {copied === label ? (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
                         stroke="currentColor" strokeWidth="3" strokeLinecap="round"
                         strokeLinejoin="round" className="text-green-400">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  ) : (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
                         stroke="currentColor" strokeWidth="2" strokeLinecap="round"
                         strokeLinejoin="round">
                      <rect x="9" y="9" width="13" height="13" rx="2" />
                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
