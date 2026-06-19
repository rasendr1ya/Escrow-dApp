import React, { useState } from 'react';
import { Filter, Calendar, Coins, User, ArrowRight } from 'lucide-react';

export default function EscrowList({ escrows, selectedEscrow, onSelectEscrow, account, isLoading }) {
  const [filter, setFilter] = useState('all');

  const getRole = (escrow) => {
    if (!account) return '';
    const acc = account.toLowerCase();
    if (escrow.buyer.toLowerCase() === acc) return 'Buyer';
    if (escrow.seller.toLowerCase() === acc) return 'Seller';
    if (escrow.arbiter.toLowerCase() === acc) return 'Arbiter';
    return '';
  };

  const getFilteredEscrows = () => {
    if (!account) return [];
    const acc = account.toLowerCase();
    return escrows.filter((esc) => {
      const role = getRole(esc);
      const isEnded = esc.state === 1 || esc.state === 3; // COMPLETE or REFUNDED

      if (filter === 'all') return true;
      if (filter === 'buyer') return role === 'Buyer';
      if (filter === 'seller') return role === 'Seller';
      if (filter === 'arbiter') return role === 'Arbiter';
      if (filter === 'ended') return isEnded;
      return true;
    });
  };

  const truncateAddress = (addr) => {
    if (!addr) return '';
    return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;
  };

  const getStateBadge = (state) => {
    // 0: AWAITING_DELIVERY, 1: COMPLETE, 2: DISPUTED, 3: REFUNDED
    switch (state) {
      case 0:
        return <span className="badge badge-awaiting">Awaiting Delivery</span>;
      case 1:
        return <span className="badge badge-complete">Complete</span>;
      case 2:
        return <span className="badge badge-disputed">Disputed</span>;
      case 3:
        return <span className="badge badge-refunded">Refunded</span>;
      default:
        return <span className="badge badge-awaiting">Unknown</span>;
    }
  };

  const filtered = getFilteredEscrows();

  return (
    <div className="w-full">
      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 mb-6 border-b border-white/5 pb-4">
        <span className="text-gray-400 text-sm flex items-center gap-1.5 mr-2">
          <Filter size={14} /> Filter:
        </span>
        {[
          { id: 'all', label: 'Semua' },
          { id: 'buyer', label: 'Sebagai Buyer' },
          { id: 'seller', label: 'Sebagai Seller' },
          { id: 'arbiter', label: 'Sebagai Arbiter' },
          { id: 'ended', label: 'Selesai/Refund' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilter(tab.id)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              filter === tab.id
                ? 'bg-purple-500/20 border border-purple-500/40 text-purple-300'
                : 'bg-white/5 border border-white/5 hover:bg-white/10 text-gray-400 hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Skeleton Loading State */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2].map((i) => (
            <div key={i} className="glass-card p-5 animate-pulse flex flex-col gap-3">
              <div className="flex justify-between items-center">
                <div className="h-4 w-24 bg-white/10 rounded"></div>
                <div className="h-6 w-28 bg-white/10 rounded-full"></div>
              </div>
              <div className="h-5 w-40 bg-white/10 rounded mt-2"></div>
              <div className="h-4 w-full bg-white/10 rounded"></div>
              <div className="h-4 w-full bg-white/10 rounded"></div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass-card p-12 text-center text-gray-400">
          😢 Tidak ada kontrak escrow yang ditemukan untuk filter ini.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((escrow, index) => {
            const role = getRole(escrow);
            const isSelected = selectedEscrow && selectedEscrow.address === escrow.address;
            const isStaggered = index % 2 === 1;
            
            return (
              <div
                key={escrow.address}
                onClick={() => onSelectEscrow(escrow)}
                className={`glass-card p-5 cursor-pointer text-left flex flex-col gap-3 transition-all relative overflow-hidden ${
                  isSelected 
                    ? 'border-purple-500/50 bg-purple-500/5 shadow-md shadow-purple-500/5' 
                    : 'hover:border-white/20'
                } ${escrow.state === 2 ? 'dispute-card-pulse' : ''} ${isStaggered ? 'stagger-odd' : ''}`}
              >
                {/* Accent Role Tag */}
                {role && (
                  <span className={`absolute top-0 right-0 px-3 py-1 text-[10px] font-bold uppercase rounded-bl-lg border-l border-b border-white/5 ${
                    role === 'Buyer' ? 'bg-indigo-500/20 text-indigo-300' :
                    role === 'Seller' ? 'bg-emerald-500/20 text-emerald-300' :
                    'bg-amber-500/20 text-amber-300'
                  }`}>
                    {role}
                  </span>
                )}

                <div className="flex flex-wrap justify-between items-start gap-2 pr-12">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs text-gray-400 font-mono">Contract Address</span>
                    <span className="text-sm font-semibold font-mono">{truncateAddress(escrow.address)}</span>
                  </div>
                  {getStateBadge(escrow.state)}
                </div>

                <div className="grid grid-cols-2 gap-4 border-t border-b border-white/5 py-3 my-1">
                  <div className="flex items-center gap-2">
                    <Coins size={16} className="text-purple-400 shrink-0" />
                    <div className="flex flex-col">
                      <span className="text-[10px] text-gray-400">Escrow Value</span>
                      <span className="text-sm font-bold">{escrow.balance} ETH</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Calendar size={16} className="text-purple-400 shrink-0" />
                    <div className="flex flex-col">
                      <span className="text-[10px] text-gray-400">Deadline</span>
                      <span className="text-xs font-semibold">
                        {new Date(escrow.deadline * 1000).toLocaleDateString('id-ID')}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 mt-1 text-xs">
                  <div className="flex items-center gap-1.5 text-gray-400">
                    <User size={12} />
                    <span>Seller: {truncateAddress(escrow.seller)}</span>
                  </div>
                  <span className="text-purple-400 font-semibold flex items-center gap-1 hover:gap-2 transition-all">
                    Lihat Aksi <ArrowRight size={12} />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
