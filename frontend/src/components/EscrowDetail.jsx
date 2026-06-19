import React, { useState } from 'react';
import { ShieldCheck, Info, User, ArrowRightLeft, Calendar, Coins, Scale, CheckCircle2, ShieldAlert } from 'lucide-react';

export default function EscrowDetail({ escrow, account, onAction, isActionPending, events = [] }) {
  const [depositAmount, setDepositAmount] = useState('0.1'); // default deposit input
  const [ruling, setRuling] = useState(true); // true = release to seller, false = refund buyer

  if (!escrow) {
    return (
      <div className="glass-card p-8 text-center text-gray-400 h-full flex flex-col justify-center items-center">
        <Info size={32} className="text-purple-400/50 mb-3" />
        <span>Pilih transaksi escrow dari daftar di sebelah kiri untuk melihat detail interaksi dan panel aksi.</span>
      </div>
    );
  }

  const isBuyer = account && account.toLowerCase() === escrow.buyer.toLowerCase();
  const isSeller = account && account.toLowerCase() === escrow.seller.toLowerCase();
  const isArbiter = account && account.toLowerCase() === escrow.arbiter.toLowerCase();

  const isExpired = Math.floor(Date.now() / 1000) >= escrow.deadline;

  const truncateAddress = (addr) => {
    if (!addr) return '';
    return `${addr.substring(0, 10)}...${addr.substring(addr.length - 8)}`;
  };

  const getStateName = (state) => {
    switch (state) {
      case 0: return 'AWAITING_DELIVERY';
      case 1: return 'COMPLETE';
      case 2: return 'DISPUTED';
      case 3: return 'REFUNDED';
      default: return 'UNKNOWN';
    }
  };

  return (
    <div className={`glass-card asymmetric-card p-4 md:p-6 w-full text-left flex flex-col gap-6 relative overflow-hidden ${
      escrow.state === 0 ? 'border-l-2 border-l-amber-500' :
      escrow.state === 1 ? 'border-l-2 border-l-emerald-500' :
      escrow.state === 2 ? 'border-l-2 border-l-red-500 dispute-card-pulse' :
      'border-l-2 border-l-blue-500'
    }`}>
      {/* Background glowing blob */}
      <div className="absolute top-0 right-0 h-40 w-40 bg-purple-500/10 rounded-full filter blur-3xl pointer-events-none"></div>

      {/* Header Info */}
      <div className="flex flex-col gap-1 border-b border-white/5 pb-4">
        <div className="flex justify-between items-center">
          <span className="text-xs text-gray-400 font-mono">Contract Address</span>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
            escrow.state === 0 ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' :
            escrow.state === 1 ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' :
            escrow.state === 2 ? 'bg-red-500/10 border-red-500/20 text-red-400' :
            'bg-blue-500/10 border-blue-500/20 text-blue-400'
          }`}>
            {getStateName(escrow.state)}
          </span>
        </div>
        <h2 className="text-sm md:text-md font-mono font-bold text-gray-200 mt-1 break-all">
          {escrow.address}
        </h2>
      </div>

      {/* General Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white/5 border border-white/5 rounded-xl p-3 flex flex-col gap-0.5">
          <span className="text-[10px] text-gray-400 flex items-center gap-1">
            <Coins size={12} className="text-purple-400" /> Deposit Value
          </span>
          <span className="text-lg font-bold">{escrow.balance} ETH</span>
        </div>

        <div className="bg-white/5 border border-white/5 rounded-xl p-3 flex flex-col gap-0.5">
          <span className="text-[10px] text-gray-400 flex items-center gap-1">
            <Calendar size={12} className="text-purple-400" /> Deadline
          </span>
          <span className="text-sm font-semibold mt-0.5">
            {new Date(escrow.deadline * 1000).toLocaleString('id-ID')}
          </span>
        </div>

        <div className="bg-white/5 border border-white/5 rounded-xl p-3 flex flex-col gap-0.5">
          <span className="text-[10px] text-gray-400 flex items-center gap-1">
            <Scale size={12} className="text-purple-400" /> Arbiter Fee
          </span>
          <span className="text-lg font-bold">{escrow.feePercent}%</span>
        </div>
      </div>

      {/* Parties Addresses */}
      <div className="flex flex-col gap-3 bg-white/2 border border-white/5 rounded-xl p-4">
        <h3 className="text-xs font-bold text-purple-300 uppercase tracking-wider mb-1">Pihak Terkait</h3>
        
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-400 flex items-center gap-1.5">
            <User size={14} className="text-indigo-400" /> Buyer (Pembeli)
          </span>
          <span className="font-mono text-gray-200 font-semibold" title={escrow.buyer}>
            {truncateAddress(escrow.buyer)} {isBuyer && '(Anda)'}
          </span>
        </div>

        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-400 flex items-center gap-1.5">
            <User size={14} className="text-emerald-400" /> Seller (Penjual)
          </span>
          <span className="font-mono text-gray-200 font-semibold" title={escrow.seller}>
            {truncateAddress(escrow.seller)} {isSeller && '(Anda)'}
          </span>
        </div>

        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-400 flex items-center gap-1.5">
            <User size={14} className="text-amber-400" /> Arbiter (Penengah)
          </span>
          <span className="font-mono text-gray-200 font-semibold" title={escrow.arbiter}>
            {truncateAddress(escrow.arbiter)} {isArbiter && '(Anda)'}
          </span>
        </div>
      </div>

      {/* Role Action Panel */}
      <div className="border-t border-white/5 pt-5">
        <h3 className="text-sm font-bold text-gray-200 mb-4 flex items-center gap-2">
          <ShieldCheck size={18} className="text-purple-400" /> Panel Aksi Interaksi
        </h3>

        {/* 1. Buyer Panel */}
        {isBuyer && (
          <div className="flex flex-col gap-4">
            {/* If balance is 0 and status is Awaiting, buyer needs to deposit */}
            {parseFloat(escrow.balance) === 0 && escrow.state === 0 && (
              <div className="flex flex-col gap-3 bg-purple-500/5 border border-purple-500/10 p-4 rounded-xl">
                <span className="text-sm text-purple-200 font-medium">Dana Belum Ter-deposit</span>
                <p className="text-xs text-gray-400 leading-relaxed mb-1">
                  Kontrak escrow telah deployed. Anda wajib memasukkan dana ETH yang disepakati untuk mengunci transaksi ini.
                </p>
                <div className="flex flex-col md:flex-row gap-2">
                  <input
                    type="number"
                    step="0.01"
                    min="0.001"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    className="glass-input w-full md:w-2/3"
                    disabled={isActionPending}
                  />
                  <button
                    onClick={() => onAction('deposit', { value: depositAmount })}
                    disabled={isActionPending}
                    className="btn-primary w-full md:w-1/3 text-sm"
                  >
                    Deposit ETH
                  </button>
                </div>
              </div>
            )}

            {/* If balance is deposited and state is Awaiting, buyer can release, raise dispute, or request refund if expired */}
            {parseFloat(escrow.balance) > 0 && escrow.state === 0 && (
              <div className="flex flex-col gap-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <button
                    onClick={() => onAction('releaseFunds')}
                    disabled={isActionPending}
                    className="btn-primary flex items-center justify-center gap-1.5 py-3 text-sm bg-gradient-to-r from-emerald-500 to-green-600 hover:shadow-emerald-500/20"
                  >
                    Rilis Dana ke Seller
                  </button>
                  <button
                    onClick={() => onAction('raiseDispute')}
                    disabled={isActionPending}
                    className="btn-secondary flex items-center justify-center gap-1.5 py-3 text-sm text-red-400 border-red-500/20 hover:bg-red-500/5 hover:border-red-500/30"
                  >
                    Ajukan Sengketa
                  </button>
                </div>

                {isExpired && (
                  <button
                    onClick={() => onAction('refundAfterTimeout')}
                    disabled={isActionPending}
                    className="btn-secondary w-full py-3 text-sm border-blue-500/20 text-blue-400 hover:bg-blue-500/5 hover:border-blue-500/30 mt-1"
                  >
                    Klaim Refund (Timeout)
                  </button>
                )}
              </div>
            )}

            {/* If state is complete, refund, or disputed, show final state info */}
            {(escrow.state === 1 || escrow.state === 3 || escrow.state === 2) && (
              <div className="bg-white/5 border border-white/5 p-4 rounded-xl text-center text-gray-400 text-sm">
                ℹ️ Transaksi ini bertindak sebagai **Buyer**. Transaksi sedang dalam status **{getStateName(escrow.state)}** dan tidak memerlukan aksi lanjutan dari Anda.
              </div>
            )}
          </div>
        )}

        {/* 2. Seller Panel */}
        {isSeller && (
          <div className="flex flex-col gap-3 bg-emerald-500/5 border border-emerald-500/10 p-4 rounded-xl">
            <span className="text-sm text-emerald-300 font-medium flex items-center gap-1.5">
              <CheckCircle2 size={16} /> Status Sebagai Penjual
            </span>
            {escrow.state === 0 && parseFloat(escrow.balance) === 0 && (
              <p className="text-xs text-gray-400 leading-relaxed m-0">
                Menunggu pembeli melakukan **deposit dana** ke kontrak escrow. Mohon jangan mengirimkan barang/jasa sebelum dana ter-deposit.
              </p>
            )}
            {escrow.state === 0 && parseFloat(escrow.balance) > 0 && (
              <p className="text-xs text-gray-400 leading-relaxed m-0">
                Dana sebesar **{escrow.balance} ETH** telah dikunci di dalam contract. Silakan kirimkan barang/jasa kepada pembeli. Pembeli akan merilis dana setelah menerimanya.
              </p>
            )}
            {escrow.state === 1 && (
              <p className="text-xs text-gray-400 leading-relaxed m-0">
                🎉 Transaksi selesai! Dana telah berhasil dikirimkan ke dompet Anda.
              </p>
            )}
            {escrow.state === 2 && (
              <p className="text-xs text-gray-400 leading-relaxed m-0 text-red-400">
                ⚠️ Pembeli mengajukan **sengketa (dispute)**. Dana terkunci di contract sampai Arbiter memutuskan pembagian dana.
              </p>
            )}
            {escrow.state === 3 && (
              <p className="text-xs text-gray-400 leading-relaxed m-0 text-blue-400">
                💸 Dana telah dikembalikan (refund) ke pembeli karena masa tenggang kedaluwarsa atau keputusan Arbiter.
              </p>
            )}
          </div>
        )}

        {/* 3. Arbiter Panel */}
        {isArbiter && (
          <div className="flex flex-col gap-4">
            {escrow.state === 2 ? (
              <div className="flex flex-col gap-3 bg-amber-500/5 border border-amber-500/10 p-4 rounded-xl">
                <span className="text-sm text-amber-300 font-medium flex items-center gap-1.5">
                  <ShieldAlert size={16} /> Panel Keputusan Sengketa (Dispute Resolution)
                </span>
                <p className="text-xs text-gray-400 leading-relaxed mb-2">
                  Transaksi bermasalah dan dana sedang ditahan. Sebagai Arbiter, Anda wajib mengambil keputusan pembagian dana (akan dikurangi fee penengah sebesar {escrow.feePercent}%).
                </p>

                <div className="flex flex-col gap-2 bg-white/2 p-3 rounded-lg border border-white/5">
                  <span className="text-xs font-semibold text-gray-300 mb-1">Pilih Pihak yang Menang:</span>
                  <label className="flex items-center gap-2 cursor-pointer text-xs text-gray-300">
                    <input
                      type="radio"
                      name="ruling"
                      checked={ruling === true}
                      onChange={() => setRuling(true)}
                      className="accent-purple-500 cursor-pointer"
                    />
                    <span>Menangkan Seller (Kirim ETH ke Seller)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-xs text-gray-300 mt-1">
                    <input
                      type="radio"
                      name="ruling"
                      checked={ruling === false}
                      onChange={() => setRuling(false)}
                      className="accent-purple-500 cursor-pointer"
                    />
                    <span>Menangkan Buyer (Refund ETH ke Buyer)</span>
                  </label>
                </div>

                <button
                  onClick={() => onAction('resolveDispute', { releaseToSeller: ruling })}
                  disabled={isActionPending}
                  className="btn-primary w-full py-2.5 text-xs bg-gradient-to-r from-amber-500 to-orange-600 hover:shadow-amber-500/20"
                >
                  Eksekusi Keputusan
                </button>
              </div>
            ) : (
              <div className="bg-white/5 border border-white/5 p-4 rounded-xl text-center text-gray-400 text-sm">
                ℹ️ Anda bertindak sebagai **Arbiter**. Tidak ada sengketa aktif pada kontrak escrow ini saat ini.
              </div>
            )}
          </div>
        )}

        {/* 4. Non-Participant Panel */}
        {!isBuyer && !isSeller && !isArbiter && account && (
          <div className="bg-white/5 border border-white/5 p-4 rounded-xl text-center text-gray-400 text-sm flex items-center justify-center gap-2">
            <Info size={16} />
            <span>Anda bukan merupakan partisipan (Buyer / Seller / Arbiter) dalam transaksi escrow ini.</span>
          </div>
        )}

        {/* 5. Wallet Not Connected Panel */}
        {!account && (
          <div className="bg-white/5 border border-white/5 p-4 rounded-xl text-center text-gray-400 text-sm flex items-center justify-center gap-2">
            <ShieldAlert size={16} />
            <span>Koneksikan dompet MetaMask Anda di bagian atas untuk melakukan interaksi.</span>
          </div>
        )}
      </div>

      {/* Event Logs Timeline */}
      {account && events.length > 0 && (
        <div className="border-t border-white/5 pt-5 mt-2">
          <h3 className="text-sm font-bold text-gray-200 mb-4 flex items-center gap-2">
            <ArrowRightLeft size={18} className="text-purple-400" /> Riwayat Peristiwa Kontrak
          </h3>
          <div className="relative pl-6 border-l-2 border-white/10 flex flex-col gap-6 font-sans mt-4 ml-2">
            {events.map((evt, idx) => (
              <div key={idx} className="relative text-xs leading-normal text-left">
                {/* Node dot centered on the vertical line */}
                <div className="absolute -left-[31px] top-1.5 h-3 w-3 rounded-full bg-purple-500 border-2 border-[#020617] flex items-center justify-center z-10 shadow-sm shadow-purple-500/50"></div>
                
                <div className="bg-white/2 border border-white/5 rounded-xl p-3 hover:border-white/10 transition-colors">
                  <span className="font-semibold text-gray-200 block text-xs">
                    {evt.name === 'Deposited' && '📥 Dana Didepositkan'}
                    {evt.name === 'FundsReleased' && '🔓 Dana Dirilis'}
                    {evt.name === 'DisputeRaised' && '⚠️ Sengketa Diajukan'}
                    {evt.name === 'DisputeResolved' && '⚖️ Sengketa Diselesaikan'}
                    {evt.name === 'Refunded' && '💸 Dana Di-refund'}
                  </span>
                  <span className="text-[10px] text-gray-400 mt-1 block font-mono">
                    Block: #{evt.blockNumber} | Tx: {evt.transactionHash.substring(0, 10)}...{evt.transactionHash.substring(evt.transactionHash.length - 8)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
