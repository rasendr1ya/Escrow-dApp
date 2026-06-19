import React, { useState, useEffect, useCallback, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';
import ConnectWallet from './components/ConnectWallet';
import CreateEscrowForm from './components/CreateEscrowForm';
import EscrowList from './components/EscrowList';
import EscrowDetail from './components/EscrowDetail';
import useWallet from './hooks/useWallet';
import useContract from './hooks/useContract';

function App() {
  // Real Web3 wallet hook
  const {
    account,
    chainId,
    balance,
    provider,
    signer,
    isConnecting,
    connectWallet,
    disconnectWallet,
    refreshBalance
  } = useWallet();

  // Real Web3 contract hooks
  const {
    createEscrow,
    fetchUserEscrows,
    deposit,
    releaseFunds,
    raiseDispute,
    refundAfterTimeout,
    resolveDispute,
    fetchEscrowEvents
  } = useContract(provider, signer, account);

  // States
  const [escrows, setEscrows] = useState([]);
  const [selectedEscrow, setSelectedEscrow] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isActionPending, setIsActionPending] = useState(false);
  const [isLoadingEscrows, setIsLoadingEscrows] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [selectedEscrowEvents, setSelectedEscrowEvents] = useState([]);

  // Toast helper
  const addToast = useCallback((type, message) => {
    const id = Date.now() + Math.random().toString(36).substr(2, 9);
    setToasts((prev) => [...prev, { id, type, message }]);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  }, []);

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Fetch all escrows for the connected wallet
  const loadEscrows = useCallback(async (showLoading = false) => {
    if (!account) {
      setEscrows([]);
      return;
    }
    if (showLoading) setIsLoadingEscrows(true);
    try {
      const data = await fetchUserEscrows();
      setEscrows(data);
      
      // If we have a selected escrow, refresh its details too
      if (selectedEscrow) {
        const updated = data.find((esc) => esc.address.toLowerCase() === selectedEscrow.address.toLowerCase());
        if (updated) {
          setSelectedEscrow(updated);
        }
      }
    } catch (err) {
      console.error('Error loading escrows:', err);
      addToast('error', 'Gagal memuat daftar transaksi escrow dari blockchain.');
    } finally {
      if (showLoading) setIsLoadingEscrows(false);
    }
  }, [account, fetchUserEscrows, selectedEscrow, addToast]);

  const loadEscrowsRef = useRef(loadEscrows);
  loadEscrowsRef.current = loadEscrows;

  // Initial loading when account/network changes
  useEffect(() => {
    if (account) {
      loadEscrowsRef.current(true);
    } else {
      setEscrows([]);
      setSelectedEscrow(null);
    }
  }, [account, chainId]);
  
  // Load events for selected escrow
  useEffect(() => {
    let active = true;
    const loadEvents = async () => {
      if (!selectedEscrow) {
        setSelectedEscrowEvents([]);
        return;
      }
      try {
        const events = await fetchEscrowEvents(selectedEscrow.address);
        if (active) setSelectedEscrowEvents(events);
      } catch (err) {
        console.error('Failed to load escrow events:', err);
      }
    };
    loadEvents();
    return () => { active = false; };
  }, [selectedEscrow, fetchEscrowEvents]);

  // Handle Escrow creation
  const handleCreateEscrow = async (params) => {
    setIsCreating(true);
    addToast('info', 'Meminta persetujuan pembuatan Escrow di MetaMask...');
    try {
      const newEscrowAddress = await createEscrow(
        params.seller,
        params.arbiter,
        params.durationSeconds,
        params.arbiterFeePercent
      );
      
      if (newEscrowAddress) {
        addToast('success', `Escrow berhasil dibuat di alamat: ${newEscrowAddress.substring(0, 10)}...`);
        // Refresh the list
        await loadEscrows(true);
      } else {
        addToast('error', 'Gagal mendapatkan alamat escrow yang baru dibuat.');
      }
    } catch (err) {
      console.error('Error creating escrow:', err);
      const msg = err.message || '';
      if (msg.includes('user rejected')) {
        addToast('error', 'Transaksi dibatalkan oleh pengguna.');
      } else {
        addToast('error', 'Terjadi kesalahan saat membuat Escrow contract.');
      }
    } finally {
      setIsCreating(false);
    }
  };

  // Handle Escrow actions (deposit, release, dispute, refund, resolve)
  const handleEscrowAction = async (actionType, args) => {
    if (!selectedEscrow) return;
    setIsActionPending(true);
    addToast('info', `Memproses transaksi ${actionType}... Hubungkan MetaMask.`);

    try {
      let receipt;
      if (actionType === 'deposit') {
        receipt = await deposit(selectedEscrow.address, args.value);
        addToast('success', `Dana sebesar ${args.value} ETH berhasil didepositkan.`);
      } else if (actionType === 'releaseFunds') {
        receipt = await releaseFunds(selectedEscrow.address);
        addToast('success', 'Dana berhasil dirilis ke Penjual.');
      } else if (actionType === 'raiseDispute') {
        receipt = await raiseDispute(selectedEscrow.address);
        addToast('success', 'Sengketa berhasil diajukan. Status diubah menjadi DISPUTED.');
      } else if (actionType === 'refundAfterTimeout') {
        receipt = await refundAfterTimeout(selectedEscrow.address);
        addToast('success', 'Dana berhasil di-refund kembali ke dompet Pembeli.');
      } else if (actionType === 'resolveDispute') {
        receipt = await resolveDispute(selectedEscrow.address, args.releaseToSeller);
        addToast('success', `Keputusan sengketa berhasil dieksekusi: ${args.releaseToSeller ? 'Diberikan ke Seller' : 'Refund ke Buyer'}.`);
      }

      // Refresh wallet balance and contract state
      await refreshBalance();
      await loadEscrows(false);
      
      // Refresh events
      if (selectedEscrow) {
        const events = await fetchEscrowEvents(selectedEscrow.address);
        setSelectedEscrowEvents(events);
      }
    } catch (err) {
      console.error(`Error executing action ${actionType}:`, err);
      const msg = err.message || '';
      if (msg.includes('user rejected')) {
        addToast('error', 'Transaksi dibatalkan oleh pengguna.');
      } else {
        addToast('error', `Transaksi gagal: ${err.reason || 'Terjadi error pada blockchain.'}`);
      }
    } finally {
      setIsActionPending(false);
    }
  };

  return (
    <div className="container min-h-screen flex flex-col justify-start">
      {/* Decorative Glowing Blobs */}
      <div className="glow-blob-purple"></div>
      <div className="glow-blob-green"></div>
      <div className="watermark-bg">Trust Mesh</div>

      {/* Floating Toast Notification System */}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-3 max-w-sm w-full pointer-events-none">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, y: -10 }}
              className={`glass-toast p-4 rounded-xl border pointer-events-auto shadow-lg flex items-start justify-between gap-3 ${
                toast.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300' :
                toast.type === 'error' ? 'bg-red-500/10 border-red-500/20 text-red-300' :
                toast.type === 'info' ? 'bg-purple-500/10 border-purple-500/20 text-purple-300' :
                'bg-white/10 border-white/20 text-gray-200'
              }`}
            >
              <div className="flex items-center gap-2 mt-0.5 shrink-0">
                {toast.type === 'success' && <CheckCircle size={16} className="text-emerald-400" />}
                {toast.type === 'error' && <AlertCircle size={16} className="text-red-400" />}
                {toast.type === 'info' && <Info size={16} className="text-purple-400" />}
              </div>
              <div className="text-xs font-semibold leading-relaxed flex-grow text-left">
                {toast.message}
              </div>
              <button
                onClick={() => removeToast(toast.id)}
                className="text-gray-400 hover:text-white transition-colors shrink-0"
              >
                <X size={14} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Connect Wallet / Navbar */}
      <ConnectWallet
        account={account}
        chainId={chainId}
        balance={balance}
        isConnecting={isConnecting}
        connectWallet={connectWallet}
        disconnectWallet={disconnectWallet}
      />

      {!account ? (
        <div className="flex-grow flex flex-col justify-center items-center py-16 px-4 text-center max-w-4xl mx-auto z-10 relative">
          <div className="mb-4 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs font-mono tracking-wider uppercase animate-pulse">
            ⚡ Decentralized P2P Escrow Protocol
          </div>
          
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight bg-gradient-to-r from-purple-400 via-indigo-300 to-emerald-400 bg-clip-text text-transparent mb-6 uppercase font-sans">
            TRUST MESH
          </h1>
          
          <p className="text-base md:text-lg text-gray-300 leading-relaxed mb-10 max-w-2xl font-light">
            Secure peer-to-peer exchanges with zero-trust smart contracts. Lock your funds, verify the delivery, and resolve disputes transparently using on-chain arbiters.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full mb-12 text-left">
            <div className="glass-card p-6 border-l-2 border-l-indigo-500 asymmetric-card interactive-panel">
              <div className="h-8 w-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400 mb-4 font-mono font-bold">
                01
              </div>
              <h3 className="text-lg font-bold text-gray-100 mb-2 font-sans">Buyer</h3>
              <p className="text-xs text-gray-400 leading-relaxed">
                Membuat kontrak escrow, mendepositkan dana ETH secara aman, dan merilisnya ke Penjual setelah barang/jasa diterima dengan baik.
              </p>
            </div>

            <div className="glass-card p-6 border-l-2 border-l-emerald-500 asymmetric-card interactive-panel">
              <div className="h-8 w-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400 mb-4 font-mono font-bold">
                02
              </div>
              <h3 className="text-lg font-bold text-gray-100 mb-2 font-sans">Seller</h3>
              <p className="text-xs text-gray-400 leading-relaxed">
                Menerima notifikasi dana terkunci di blockchain, mengirimkan barang/jasa dengan aman, dan menerima ETH setelah rilis dana.
              </p>
            </div>

            <div className="glass-card p-6 border-l-2 border-l-amber-500 asymmetric-card interactive-panel">
              <div className="h-8 w-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-400 mb-4 font-mono font-bold">
                03
              </div>
              <h3 className="text-lg font-bold text-gray-100 mb-2 font-sans">Arbiter</h3>
              <p className="text-xs text-gray-400 leading-relaxed">
                Pihak ketiga independen yang ditunjuk untuk menganalisis sengketa dan merilis dana ke pemenang sengketa secara adil.
              </p>
            </div>
          </div>

          <button
            onClick={connectWallet}
            disabled={isConnecting}
            className="btn-primary px-8 py-4 text-sm flex items-center gap-3 font-semibold shadow-lg shadow-purple-500/30 hover:scale-105 transition-all duration-300"
          >
            <X size={16} className="rotate-45" />
            {isConnecting ? 'Menghubungkan MetaMask...' : 'Mulai Hubungkan Dompet'}
          </button>
        </div>
      ) : (
        <main className="w-full flex-grow grid grid-cols-1 lg:grid-cols-12 gap-6 px-4 py-4">
          {/* Left Side: Create Form & List */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            {account && (
              <CreateEscrowForm 
                createEscrow={handleCreateEscrow} 
                isCreating={isCreating} 
              />
            )}

            <div className="glass-card asymmetric-card p-6 flex flex-col gap-4">
              <div className="flex justify-between items-center mb-2">
                <h2 className="text-xl font-bold m-0 bg-gradient-to-r from-purple-200 to-indigo-200 bg-clip-text text-transparent">
                  Daftar Transaksi Escrow Anda
                </h2>
                {account && (
                  <button
                    onClick={() => loadEscrows(true)}
                    className="text-xs text-purple-400 hover:text-purple-300 font-semibold bg-white/5 border border-white/5 px-3 py-1.5 rounded-xl hover:bg-white/10 transition-colors"
                  >
                    Segarkan Data
                  </button>
                )}
              </div>
              <EscrowList
                escrows={escrows}
                selectedEscrow={selectedEscrow}
                onSelectEscrow={setSelectedEscrow}
                account={account}
                isLoading={isLoadingEscrows}
              />
            </div>
          </div>

          {/* Right Side: Detail View */}
          <div className="lg:col-span-5">
            <EscrowDetail
              escrow={selectedEscrow}
              account={account}
              onAction={handleEscrowAction}
              isActionPending={isActionPending}
              events={selectedEscrowEvents}
            />
          </div>
        </main>
      )}

      <footer className="mt-12 mb-6 text-center text-xs text-gray-500 border-t border-white/5 pt-4">
        &copy; {new Date().getFullYear()} Simple Escrow dApp. Build for Blockchain Technology course final project.
      </footer>
    </div>
  );
}

export default App;
