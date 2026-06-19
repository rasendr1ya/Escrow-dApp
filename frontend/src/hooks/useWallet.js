import { useState, useEffect, useCallback, useRef } from 'react';
import { ethers } from 'ethers';

export default function useWallet() {
  const [account, setAccount] = useState('');
  const [chainId, setChainId] = useState(null);
  const [balance, setBalance] = useState('0.0');
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);

  // Refs — tetap stabil di closure, tidak trigger re-run effect
  const providerRef = useRef(null);
  const accountRef = useRef('');
  const signerRef = useRef(null);
  const connectingRef = useRef(false);

  // Sync refs setiap kali state berubah
  useEffect(() => { providerRef.current = provider; }, [provider]);
  useEffect(() => { accountRef.current = account; }, [account]);
  useEffect(() => { signerRef.current = signer; }, [signer]);

  const checkBalance = useCallback(async (addr, prov) => {
    if (!addr || !prov) return;
    try {
      const bal = await prov.getBalance(addr);
      setBalance(ethers.formatEther(bal));
    } catch (err) {
      console.error('Error fetching balance:', err);
    }
  }, []);

  const connectWallet = useCallback(async () => {
    if (typeof window.ethereum === 'undefined') {
      alert('MetaMask tidak ditemukan! Silakan instal ekstensi MetaMask browser Anda.');
      return;
    }

    // Guard: cegah koneksi ganda (auto-connect + manual click)
    if (connectingRef.current) return;
    connectingRef.current = true;
    setIsConnecting(true);

    try {
      const web3Provider = new ethers.BrowserProvider(window.ethereum);
      setProvider(web3Provider);
      providerRef.current = web3Provider;

      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      if (accounts.length > 0) {
        const activeAccount = accounts[0];
        setAccount(activeAccount);
        accountRef.current = activeAccount;

        const web3Signer = await web3Provider.getSigner();
        setSigner(web3Signer);
        signerRef.current = web3Signer;

        const network = await web3Provider.getNetwork();
        setChainId(Number(network.chainId));

        await checkBalance(activeAccount, web3Provider);
      }
    } catch (error) {
      console.error('Failed to connect wallet:', error);
      alert('Gagal menghubungkan wallet: ' + (error.message || 'Error tidak diketahui'));
    } finally {
      connectingRef.current = false;
      setIsConnecting(false);
    }
  }, [checkBalance]);

  const disconnectWallet = useCallback(() => {
    setAccount('');
    setChainId(null);
    setBalance('0.0');
    setProvider(null);
    setSigner(null);
  }, []);

  // Setup MetaMask listeners — hanya jalan SEKALI saat mount
  useEffect(() => {
    if (typeof window.ethereum === 'undefined') return;

    const handleAccountsChanged = async (accounts) => {
      if (accounts.length > 0) {
        const activeAccount = accounts[0];
        setAccount(activeAccount);

        if (providerRef.current) {
          const web3Signer = await providerRef.current.getSigner();
          setSigner(web3Signer);
          await checkBalance(activeAccount, providerRef.current);
        } else {
          // Fallback: provider belum siap (misal page baru load, MetaMask trigger duluan)
          const web3Provider = new ethers.BrowserProvider(window.ethereum);
          setProvider(web3Provider);
          providerRef.current = web3Provider;
          const web3Signer = await web3Provider.getSigner();
          setSigner(web3Signer);
          await checkBalance(activeAccount, web3Provider);
        }
      } else {
        disconnectWallet();
      }
    };

    const handleChainChanged = (_chainIdHex) => {
      window.location.reload();
    };

    window.ethereum.on('accountsChanged', handleAccountsChanged);
    window.ethereum.on('chainChanged', handleChainChanged);

    // Auto connect on load jika MetaMask sudah approve sebelumnya
    window.ethereum.request({ method: 'eth_accounts' })
      .then((accounts) => {
        if (accounts.length > 0) {
          connectWallet();
        }
      })
      .catch((err) => console.error('Error checking autoconnect:', err));

    return () => {
      if (window.ethereum.removeListener) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Periodic balance check setiap 10 detik
  useEffect(() => {
    if (!account || !provider) return;
    const interval = setInterval(() => {
      checkBalance(account, provider);
    }, 10000);

    return () => clearInterval(interval);
  }, [account, provider, checkBalance]);

  return {
    account,
    chainId,
    balance,
    provider,
    signer,
    isConnecting,
    connectWallet,
    disconnectWallet,
    refreshBalance: () => checkBalance(account, provider)
  };
}
