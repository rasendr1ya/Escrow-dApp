import { useState, useCallback, useEffect } from "react";
import { ethers } from "ethers";
import { useWallet } from "./hooks/useWallet";
import { useContract } from "./hooks/useContract";
import { getUserRole } from "./utils/helpers";
import { CONTRACT_ADDRESS, CONTRACT_ABI } from "./utils/contract";

import ConnectWallet from "./components/ConnectWallet";
import EscrowOverview from "./components/EscrowOverview";
import ActionPanel from "./components/ActionPanel";
import NetworkStatusCard from "./components/NetworkStatusCard";
import EscrowDetailsCard from "./components/EscrowDetailsCard";
import SecurityProtocolCard from "./components/SecurityProtocolCard";
import TransactionToast from "./components/TransactionToast";

/**
 * App — Root component Simple Escrow dApp.
 *
 * Layout: 2 kolom di desktop, 1 kolom di mobile.
 *   - Kolom kiri (main): ConnectWallet + EscrowOverview (hero) + ActionPanel
 *   - Kolom kanan (sidebar): NetworkStatus + EscrowDetails + SecurityProtocol
 *
 * Web3 flow:
 *   1. useWallet() → manage MetaMask connection, network, account
 *   2. useContract() → read data dari blockchain, write transaksi
 *   3. getUserRole() → deteksi role (buyer/seller/arbiter/unknown) dari account vs contract
 */
export default function App() {
  // ── Wallet state ────────────────────────────────────────────────────────
  const {
    account,
    chainId,
    isCorrectNetwork,
    isConnecting: walletConnecting,
    error: walletError,
    hasMetaMask,
    connectWallet,
    disconnectWallet,
    switchNetwork,
  } = useWallet();

  // ── Contract state ──────────────────────────────────────────────────────
  const {
    escrowData,
    isLoading: contractLoading,
    readError,
    deposit,
    releaseFunds,
    raiseDispute,
    refundAfterTimeout,
    resolveDispute,
    txStatus,
    txError,
    txSuccessMsg,
    lastAction,
    refreshAllData,
  } = useContract();

  // ── Derived state ───────────────────────────────────────────────────────
  const userRole = getUserRole(account, {
    buyer: escrowData?.buyer,
    seller: escrowData?.seller,
    arbiter: escrowData?.arbiter,
  });

  const [isExpired, setIsExpired] = useState(false);

  // Fetch isExpired setiap kali escrowData berubah
  useEffect(() => {
    const checkExpired = async () => {
      if (!escrowData || !hasMetaMask) return;
      try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
        const expired = await contract.isExpired();
        setIsExpired(expired);
      } catch {
        setIsExpired(false);
      }
    };
    checkExpired();
  }, [escrowData, hasMetaMask]);

  // ── Dismiss toast ───────────────────────────────────────────────────────
  const dismissToast = useCallback(() => {
    // txStatus akan auto-clear dari useContract setelah timeout,
    // tapi kita bisa dismiss manual via tombol close
    // (state internal di useContract tidak bisa di-reset dari luar,
    //  tapi auto-clear sudah cukup — ini placeholder untuk tombol close)
  }, []);

  return (
    <div className="min-h-screen bg-obsidian-bg font-body">
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 bg-obsidian-bg/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-app mx-auto px-4 md:px-margin-desktop py-4 flex items-center justify-between">
          {/* Logo / Title */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-obsidian-neon flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                   stroke="#0A0A0A" strokeWidth="2.5" strokeLinecap="round">
                <rect x="3" y="11" width="18" height="11" rx="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </div>
            <div>
              <h1 className="text-sm font-heading font-bold text-white tracking-tight">
                Simple Escrow
              </h1>
              <p className="text-[10px] font-mono uppercase tracking-[0.15em] text-gray-500">
                Decentralized Trust
              </p>
            </div>
          </div>

          {/* Wallet Connection */}
          <ConnectWallet userRole={userRole} />
        </div>
      </header>

      {/* ── Warning banner (wallet error / wrong network) ──────────────── */}
      {account && !isCorrectNetwork && (
        <div className="bg-red-500/10 border-b border-red-500/20 px-4 py-3">
          <div className="max-w-app mx-auto flex items-center justify-between">
            <p className="text-xs font-mono text-red-400 uppercase tracking-wider">
              Wrong Network — Harap ganti ke Hardhat Localhost (Chain ID: 31337)
            </p>
            <button
              onClick={switchNetwork}
              className="px-4 py-1.5 text-xs font-mono text-red-400 border border-red-400/30
                         rounded-full hover:bg-red-400/10 transition-colors"
            >
              Switch Network
            </button>
          </div>
        </div>
      )}

      {/* ── Main Content ────────────────────────────────────────────────── */}
      <main className="max-w-app mx-auto px-4 md:px-margin-desktop py-8 md:py-12">
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
          {/* ── Kolom Kiri: Escrow Overview + Action Panel ────────────── */}
          <div className="flex-1 lg:max-w-[65%] space-y-6">
            {/* Escrow Overview (hero card) */}
            <EscrowOverview
              escrowData={escrowData}
              isExpired={isExpired}
              userRole={userRole}
              isLoading={contractLoading}
            />

            {/* Action Panel */}
            {account && isCorrectNetwork && (
              <ActionPanel
                userRole={userRole}
                escrowData={escrowData}
                isExpired={isExpired}
                onDeposit={deposit}
                onRelease={releaseFunds}
                onDispute={raiseDispute}
                onRefund={refundAfterTimeout}
                onResolve={resolveDispute}
                txStatus={txStatus}
              />
            )}

            {/* Prompt connect wallet jika belum connect */}
            {!account && (
              <div className="rounded-[2.5rem] bg-obsidian-card border border-white/5 p-10 text-center">
                <p className="text-sm text-gray-400 font-body mb-4">
                  Hubungkan wallet MetaMask Anda untuk melihat dan berinteraksi dengan escrow.
                </p>
                <button
                  onClick={connectWallet}
                  disabled={walletConnecting}
                  className="px-8 py-3 bg-obsidian-neon text-black font-semibold rounded-full
                             text-sm tracking-wide transition-all duration-200
                             hover:bg-obsidian-neon-hover disabled:opacity-50 font-heading"
                >
                  {walletConnecting ? "Connecting..." : "Connect Wallet"}
                </button>
                {walletError && (
                  <p className="text-xs text-red-400 font-mono mt-3">{walletError}</p>
                )}
              </div>
            )}

            {/* Read error */}
            {readError && (
              <div className="rounded-2xl bg-red-500/5 border border-red-500/15 p-4">
                <p className="text-xs font-mono text-red-400 uppercase tracking-wider mb-1">
                  Read Error
                </p>
                <p className="text-sm text-red-300/80 font-body">{readError}</p>
              </div>
            )}
          </div>

          {/* ── Kolom Kanan: Sidebar ──────────────────────────────────── */}
          <div className="lg:w-[35%] space-y-5">
            <NetworkStatusCard
              chainId={chainId}
              isCorrectNetwork={isCorrectNetwork}
              switchNetwork={switchNetwork}
              hasMetaMask={hasMetaMask}
            />
            <EscrowDetailsCard
              escrowData={escrowData}
              isExpired={isExpired}
              isLoading={contractLoading}
            />
            <SecurityProtocolCard />
          </div>
        </div>
      </main>

      {/* ── Transaction Toast ────────────────────────────────────────────── */}
      <TransactionToast
        txStatus={txStatus}
        txError={txError}
        txSuccessMsg={txSuccessMsg}
        lastAction={lastAction}
        onDismiss={dismissToast}
      />

      {/* ── Footer ───────────────────────────────────────────────────────── */}
      <footer className="border-t border-white/5 py-6 mt-12">
        <div className="max-w-app mx-auto px-4 md:px-margin-desktop text-center">
          <p className="text-[10px] font-mono uppercase tracking-[0.15em] text-gray-600">
            Simple Escrow dApp &middot; Blockchain Project 3 &middot; ITS Teknologi Blockchain 2025
          </p>
        </div>
      </footer>
    </div>
  );
}
