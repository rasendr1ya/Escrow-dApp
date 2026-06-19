import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';

export default function useWallet() {
  const [account, setAccount] = useState('');
  const [chainId, setChainId] = useState(null);
  const [balance, setBalance] = useState('0.0');
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);

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

    setIsConnecting(true);
    try {
      // Initialize ethers BrowserProvider
      const web3Provider = new ethers.BrowserProvider(window.ethereum);
      setProvider(web3Provider);

      // Request accounts
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      if (accounts.length > 0) {
        const activeAccount = accounts[0];
        setAccount(activeAccount);

        const web3Signer = await web3Provider.getSigner();
        setSigner(web3Signer);

        const network = await web3Provider.getNetwork();
        // chainId is a bigint in ethers v6
        setChainId(Number(network.chainId));

        await checkBalance(activeAccount, web3Provider);
      }
    } catch (error) {
      console.error('Failed to connect wallet:', error);
    } finally {
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

  // Listen to accounts and network changes
  useEffect(() => {
    if (typeof window.ethereum === 'undefined') return;

    const handleAccountsChanged = async (accounts) => {
      if (accounts.length > 0) {
        setAccount(accounts[0]);
        if (provider) {
          const web3Signer = await provider.getSigner();
          setSigner(web3Signer);
          await checkBalance(accounts[0], provider);
        } else {
          // Re-initialize if provider is lost
          const web3Provider = new ethers.BrowserProvider(window.ethereum);
          setProvider(web3Provider);
          const web3Signer = await web3Provider.getSigner();
          setSigner(web3Signer);
          await checkBalance(accounts[0], web3Provider);
        }
      } else {
        disconnectWallet();
      }
    };

    const handleChainChanged = (_chainIdHex) => {
      // Ethers recommends reloading page on chain change
      window.location.reload();
    };

    window.ethereum.on('accountsChanged', handleAccountsChanged);
    window.ethereum.on('chainChanged', handleChainChanged);

    // Auto connect on load if already approved
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
  }, [provider, connectWallet, disconnectWallet, checkBalance]);

  // Periodic balance check
  useEffect(() => {
    if (!account || !provider) return;
    const interval = setInterval(() => {
      checkBalance(account, provider);
    }, 10000); // Check balance every 10 seconds

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
