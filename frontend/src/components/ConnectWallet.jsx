import React from 'react';
import { Wallet, ShieldAlert, CheckCircle2, LogOut } from 'lucide-react';

export default function ConnectWallet({ account, chainId, balance, isConnecting, connectWallet, disconnectWallet }) {
  // Hardhat network id is 31337 (0x7a69), Sepolia is 11155111 (0xaa36a7)
  const isCorrectNetwork = chainId === 31337 || chainId === 11155111 || !account;

  const truncateAddress = (addr) => {
    if (!addr) return '';
    return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;
  };

  const getNetworkName = (id) => {
    if (id === 31337) return 'Hardhat Localhost';
    if (id === 11155111) return 'Sepolia Testnet';
    return 'Unknown Network';
  };

  return (
    <div className="w-full">
      {/* Network Warning Banner */}
      {!isCorrectNetwork && (
        <div className="w-full bg-red-500/10 border-b border-red-500/20 text-[#ef4444] px-4 py-2 text-sm flex items-center justify-center gap-2 backdrop-blur-md animate-pulse">
          <ShieldAlert size={16} />
          <span>Salah Jaringan! Hubungkan ke <strong>Hardhat Localhost</strong> atau <strong>Sepolia Testnet</strong>.</span>
        </div>
      )}

      <header className="glass-card mx-2 my-2 md:mx-4 md:my-4 p-3 md:p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-purple-500 to-indigo-600 flex items-center justify-center text-white font-bold shadow-lg shadow-purple-500/20 font-sans tracking-tight">
            TM
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tighter bg-gradient-to-r from-purple-300 via-indigo-300 to-emerald-300 bg-clip-text text-transparent m-0 font-sans uppercase">
              TRUST MESH
            </h1>
            <span className="text-[10px] text-gray-400 font-mono tracking-widest block uppercase mt-0.5">P2P DECENTRALIZED PROTOCOL</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {account ? (
            <div className="flex items-center gap-3">
              <div className="hidden md:flex flex-col text-right">
                <span className="text-xs text-gray-400 flex items-center gap-1 justify-end">
                  <CheckCircle2 size={12} className="text-green-500" />
                  {getNetworkName(chainId)}
                </span>
                <span className="text-sm font-semibold">{parseFloat(balance).toFixed(4)} ETH</span>
              </div>
              
              <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-4 py-2">
                <Wallet size={16} className="text-purple-400" />
                <span className="text-sm font-mono">{truncateAddress(account)}</span>
                <button 
                  onClick={disconnectWallet}
                  className="ml-2 p-1 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors"
                  title="Disconnect Wallet"
                >
                  <LogOut size={14} />
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={connectWallet}
              disabled={isConnecting}
              className="btn-primary flex items-center gap-2"
            >
              <Wallet size={18} />
              {isConnecting ? 'Menghubungkan...' : 'Hubungkan Dompet'}
            </button>
          )}
        </div>
      </header>
    </div>
  );
}
