import React, { useState } from 'react';
import { PlusCircle, Clock, Percent, UserCheck } from 'lucide-react';

export default function CreateEscrowForm({ createEscrow, isCreating }) {
  const [seller, setSeller] = useState('');
  const [arbiter, setArbiter] = useState('');
  const [duration, setDuration] = useState('1'); // default 1 day
  const [durationType, setDurationType] = useState('days'); // days or hours
  const [feePercent, setFeePercent] = useState('5'); // default 5%
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    // Basic Validation
    const isValidAddress = (addr) => /^0x[a-fA-F0-9]{40}$/.test(addr);

    if (!isValidAddress(seller)) {
      setError('Format alamat Seller tidak valid. Harus berupa alamat Ethereum 42-karakter (0x...).');
      return;
    }

    if (!isValidAddress(arbiter)) {
      setError('Format alamat Arbiter tidak valid. Harus berupa alamat Ethereum 42-karakter (0x...).');
      return;
    }

    if (seller.toLowerCase() === arbiter.toLowerCase()) {
      setError('Seller and Arbiter cannot be the same address.');
      return;
    }

    const fee = parseInt(feePercent);
    if (isNaN(fee) || fee < 0 || fee > 10) {
      setError('Arbiter Fee must be between 0% and 10%.');
      return;
    }

    const durVal = parseFloat(duration);
    if (isNaN(durVal) || durVal <= 0) {
      setError('Duration must be greater than zero.');
      return;
    }

    // Convert duration to seconds
    const durationSeconds = Math.floor(
      durationType === 'days'
        ? durVal * 24 * 60 * 60
        : durationType === 'hours'
        ? durVal * 60 * 60
        : durVal * 60
    );

    createEscrow({
      seller,
      arbiter,
      durationSeconds,
      arbiterFeePercent: fee
    });
  };

  return (
    <div className="glass-card asymmetric-card interactive-panel p-4 md:p-6 w-full max-w-lg mx-auto">
      <div className="flex items-center gap-2 mb-6 neon-accent-left">
        <h2 className="text-xl font-bold m-0 bg-gradient-to-r from-purple-200 to-indigo-200 bg-clip-text text-transparent">
          Buat Transaksi Escrow Baru
        </h2>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-[#ef4444] px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        <div className="flex flex-col gap-1 text-left">
          <label className="text-sm font-medium text-gray-300 flex items-center gap-1.5 mb-1">
            <UserCheck size={14} className="text-purple-400" />
            Alamat Seller (Penjual)
          </label>
          <input
            type="text"
            placeholder="0x..."
            value={seller}
            onChange={(e) => setSeller(e.target.value)}
            className="glass-input w-full font-mono text-sm"
            required
          />
        </div>

        <div className="flex flex-col gap-1 text-left">
          <label className="text-sm font-medium text-gray-300 flex items-center gap-1.5 mb-1">
            <UserCheck size={14} className="text-purple-400" />
            Alamat Arbiter (Penengah)
          </label>
          <input
            type="text"
            placeholder="0x..."
            value={arbiter}
            onChange={(e) => setArbiter(e.target.value)}
            className="glass-input w-full font-mono text-sm"
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1 text-left">
            <label className="text-sm font-medium text-gray-300 flex items-center gap-1.5 mb-1">
              <Clock size={14} className="text-purple-400" />
              Masa Tenggang
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                min="0.1"
                step="any"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="glass-input w-2/3 text-center"
                required
              />
              <select
                value={durationType}
                onChange={(e) => setDurationType(e.target.value)}
                className="glass-input w-1/3 bg-transparent text-sm cursor-pointer"
              >
                <option value="days">Hari</option>
                <option value="hours">Jam</option>
                <option value="minutes">Menit</option>
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-1 text-left">
            <label className="text-sm font-medium text-gray-300 flex items-center gap-1.5 mb-1">
              <Percent size={14} className="text-purple-400" />
              Fee Arbiter (Maks 10%)
            </label>
            <div className="flex items-center relative">
              <input
                type="number"
                min="0"
                max="10"
                value={feePercent}
                onChange={(e) => setFeePercent(e.target.value)}
                className="glass-input w-full text-center pr-8"
                required
              />
              <span className="absolute right-3 text-gray-400 text-sm">%</span>
            </div>
          </div>
        </div>

        <div className="text-xs text-gray-400 bg-white/5 border border-white/5 rounded-lg p-3 text-left mt-2 leading-relaxed">
          💡 <strong>Tips</strong>: Pembeli (Buyer) adalah Anda sendiri yang membuat transaksi ini. Setelah dideploy, Anda harus mendepositkan dana ETH ke dalam escrow agar penjual dapat mulai mengirim barang/jasa.
        </div>

        <button
          type="submit"
          disabled={isCreating}
          className="btn-primary w-full mt-4 flex items-center justify-center gap-2"
        >
          {isCreating ? 'Menyebarkan Kontrak...' : 'Buat Escrow Contract'}
        </button>
      </form>
    </div>
  );
}
