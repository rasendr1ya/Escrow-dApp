/**
 * SecurityProtocolCard — Static info card for sidebar.
 *
 * Menampilkan fitur keamanan escrow contract secara informatif:
 *   - Role-based access control
 *   - Time-locked refund
 *   - Dispute resolution
 */
export default function SecurityProtocolCard() {
  const features = [
    {
      icon: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
             strokeWidth="2" strokeLinecap="round" className="text-obsidian-neon">
          <rect x="3" y="11" width="18" height="11" rx="2" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          <circle cx="12" cy="16" r="1" />
        </svg>
      ),
      title: "Role-Based Access",
      desc: "Buyer, seller, dan arbiter memiliki hak akses terpisah yang di-enforce oleh smart contract.",
    },
    {
      icon: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
             strokeWidth="2" strokeLinecap="round" className="text-obsidian-neon">
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
      ),
      title: "Time-Locked Refund",
      desc: "Buyer bisa klaim refund otomatis setelah deadline terlewati tanpa perlu persetujuan seller.",
    },
    {
      icon: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
             strokeWidth="2" strokeLinecap="round" className="text-obsidian-neon">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      ),
      title: "Dispute Resolution",
      desc: "Arbiter independen dapat menyelesaikan sengketa dengan memutuskan pihak yang berhak menerima dana.",
    },
  ];

  return (
    <div className="rounded-[2.5rem] bg-obsidian-card border border-white/5 p-7 animate-slide-in-right">
      {/* Header */}
      <div className="flex items-center gap-2 mb-5">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
             strokeWidth="2" strokeLinecap="round" className="text-gray-500">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
        <span className="text-xs font-mono uppercase tracking-[0.15em] text-gray-500">
          Security Protocol
        </span>
      </div>

      <div className="space-y-4">
        {features.map(({ icon, title, desc }) => (
          <div key={title} className="flex gap-3">
            <div className="flex-shrink-0 mt-0.5">{icon}</div>
            <div>
              <p className="text-xs font-heading font-semibold text-gray-300 mb-0.5">
                {title}
              </p>
              <p className="text-[11px] text-gray-500 leading-relaxed font-body">
                {desc}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
