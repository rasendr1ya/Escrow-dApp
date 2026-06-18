import { useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";
import { EXPECTED_CHAIN_ID, EXPECTED_CHAIN_NAME, EXPECTED_RPC_URL } from "../utils/helpers";

/**
 * useWallet — Mengelola koneksi MetaMask, network detection, dan event listener.
 *
 * State yang dikelola:
 *   - account: address wallet yang terkoneksi (string | null)
 *   - chainId: chain ID saat ini (number | null)
 *   - isCorrectNetwork: apakah wallet di network yang benar (Hardhat localhost 31337)
 *   - isConnecting: sedang proses connect (boolean)
 *   - error: pesan error jika ada (string | null)
 *
 * Event listener:
 *   - accountsChanged: detect user ganti akun di MetaMask → update account
 *   - chainChanged: detect user ganti network → update chainId
 */
export function useWallet() {
  const [account, setAccount] = useState(null);
  const [chainId, setChainId] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState(null);

  // ── Helper: cek apakah MetaMask terinstall ──────────────────────────────
  const hasMetaMask = typeof window !== "undefined" && window.ethereum;

  // ── Connect Wallet ──────────────────────────────────────────────────────
  const connectWallet = useCallback(async () => {
    if (!hasMetaMask) {
      setError("MetaMask tidak terdeteksi. Silakan install MetaMask extension terlebih dahulu.");
      return;
    }

    setIsConnecting(true);
    setError(null);

    try {
      // Request akses akun dari MetaMask
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });

      const currentChainId = await window.ethereum.request({
        method: "eth_chainId",
      });

      setAccount(accounts[0]);
      setChainId(parseInt(currentChainId, 16));
    } catch (err) {
      if (err.code === 4001) {
        setError("Koneksi wallet dibatalkan. Silakan coba lagi.");
      } else {
        setError("Gagal menghubungkan wallet: " + (err.message || "Unknown error"));
      }
    } finally {
      setIsConnecting(false);
    }
  }, [hasMetaMask]);

  // ── Switch ke network yang benar ────────────────────────────────────────
  const switchNetwork = useCallback(async () => {
    if (!hasMetaMask) return;

    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: "0x" + EXPECTED_CHAIN_ID.toString(16) }],
      });
    } catch (switchError) {
      // Jika network belum ada di MetaMask, tambahkan dulu
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: "wallet_addEthereumChain",
            params: [
              {
                chainId: "0x" + EXPECTED_CHAIN_ID.toString(16),
                chainName: EXPECTED_CHAIN_NAME,
                rpcUrls: [EXPECTED_RPC_URL],
                nativeCurrency: {
                  name: "ETH",
                  symbol: "ETH",
                  decimals: 18,
                },
              },
            ],
          });
        } catch (addError) {
          setError("Gagal menambahkan network ke MetaMask.");
        }
      } else {
        setError("Gagal mengganti network di MetaMask.");
      }
    }
  }, [hasMetaMask]);

  // ── Disconnect (reset state) ────────────────────────────────────────────
  const disconnectWallet = useCallback(() => {
    setAccount(null);
    setChainId(null);
    setError(null);
  }, []);

  // ── Event Listeners: accountsChanged & chainChanged ─────────────────────
  useEffect(() => {
    if (!hasMetaMask) return;

    // Saat user mengganti akun di MetaMask
    const handleAccountsChanged = (accounts) => {
      if (accounts.length === 0) {
        // User disconnect semua akun
        disconnectWallet();
      } else {
        setAccount(accounts[0]);
      }
    };

    // Saat user mengganti network di MetaMask
    const handleChainChanged = (newChainId) => {
      setChainId(parseInt(newChainId, 16));
    };

    // Saat user disconnect dari MetaMask
    const handleDisconnect = () => {
      disconnectWallet();
    };

    window.ethereum.on("accountsChanged", handleAccountsChanged);
    window.ethereum.on("chainChanged", handleChainChanged);
    window.ethereum.on("disconnect", handleDisconnect);

    return () => {
      window.ethereum.removeListener("accountsChanged", handleAccountsChanged);
      window.ethereum.removeListener("chainChanged", handleChainChanged);
      window.ethereum.removeListener("disconnect", handleDisconnect);
    };
  }, [hasMetaMask, disconnectWallet]);

  // ── Auto-detect akun yang sudah terkoneksi (saat page load) ─────────────
  useEffect(() => {
    const checkConnection = async () => {
      if (!hasMetaMask) return;

      try {
        const accounts = await window.ethereum.request({
          method: "eth_accounts",
        });
        if (accounts.length > 0) {
          setAccount(accounts[0]);

          const currentChainId = await window.ethereum.request({
            method: "eth_chainId",
          });
          setChainId(parseInt(currentChainId, 16));
        }
      } catch {
        // Silent fail — user akan connect manual nanti
      }
    };

    checkConnection();
  }, [hasMetaMask]);

  // ── Derived: apakah network yang terkoneksi sesuai? ─────────────────────
  const isCorrectNetwork = chainId === EXPECTED_CHAIN_ID;

  return {
    account,
    chainId,
    isCorrectNetwork,
    isConnecting,
    error,
    hasMetaMask,
    connectWallet,
    disconnectWallet,
    switchNetwork,
    setError,
  };
}
