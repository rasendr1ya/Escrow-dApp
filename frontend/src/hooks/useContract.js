import { useState, useCallback, useEffect } from "react";
import { ethers } from "ethers";
import { CONTRACT_ADDRESS, CONTRACT_ABI } from "../utils/contract";
import { parseContractError, getSuccessMessage } from "../utils/errors";

/**
 * useContract — Hook utama untuk interaksi read & write dengan SimpleEscrow.
 *
 * Read operations (pakai Provider — tidak perlu signer / gratis):
 *   - fetchEscrowDetails() → getEscrowDetails()
 *   - fetchBalance()       → getBalance()
 *   - fetchIsExpired()     → isExpired()
 *
 * Write operations (pakai Signer — perlu MetaMask confirm):
 *   - deposit(amountETH)   → deposit()
 *   - releaseFunds()       → releaseFunds()
 *   - raiseDispute()       → raiseDispute()
 *   - refundAfterTimeout() → refundAfterTimeout()
 *   - resolveDispute(releaseToSeller) → resolveDispute(bool)
 *
 * State transaksi:
 *   idle → pending → success/failed
 */
export function useContract() {
  // Escrow data (dari read operations)
  const [escrowData, setEscrowData] = useState(null);
  // Loading untuk read operations
  const [isLoading, setIsLoading] = useState(false);
  // Error untuk read operations
  const [readError, setReadError] = useState(null);

  // Transaction state
  const [txStatus, setTxStatus] = useState("idle"); // "idle" | "pending" | "success" | "failed"
  const [txError, setTxError] = useState(null);
  const [txSuccessMsg, setTxSuccessMsg] = useState(null);
  const [lastAction, setLastAction] = useState(null); // untuk toast

  // ── Helper: dapatkan provider read-only ──────────────────────────────────
  const getProvider = useCallback(() => {
    if (typeof window === "undefined" || !window.ethereum) return null;
    return new ethers.BrowserProvider(window.ethereum);
  }, []);

  // ── Helper: dapatkan signer (untuk write) ───────────────────────────────
  const getSigner = useCallback(async () => {
    if (typeof window === "undefined" || !window.ethereum) return null;
    const provider = new ethers.BrowserProvider(window.ethereum);
    return await provider.getSigner();
  }, []);

  // ── Helper: ambil contract instance (read-only, no signer) ──────────────
  const getReadContract = useCallback(async () => {
    const provider = getProvider();
    if (!provider) return null;
    return new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
  }, [getProvider]);

  // ── Helper: ambil contract instance dengan signer (untuk write) ─────────
  const getWriteContract = useCallback(async () => {
    const signer = await getSigner();
    if (!signer) return null;
    return new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
  }, [getSigner]);

  // ── READ: Fetch escrow details ──────────────────────────────────────────
  const fetchEscrowDetails = useCallback(async () => {
    try {
      setIsLoading(true);
      setReadError(null);

      const contract = await getReadContract();
      if (!contract) {
        setReadError("MetaMask tidak tersedia. Silakan install MetaMask.");
        return null;
      }

      const details = await contract.getEscrowDetails();
      const parsed = {
        buyer: details._buyer,
        seller: details._seller,
        arbiter: details._arbiter,
        depositAmount: details._depositAmount,
        state: Number(details._state),
        deadline: details._deadline,
        arbiterFeePercent: Number(details._arbiterFeePercent),
      };

      setEscrowData(parsed);
      return parsed;
    } catch (err) {
      setReadError(parseContractError(err));
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [getReadContract]);

  // ── READ: Fetch contract balance ────────────────────────────────────────
  const fetchBalance = useCallback(async () => {
    try {
      const contract = await getReadContract();
      if (!contract) return null;
      const balance = await contract.getBalance();
      return balance;
    } catch {
      return null;
    }
  }, [getReadContract]);

  // ── READ: Fetch isExpired ───────────────────────────────────────────────
  const fetchIsExpired = useCallback(async () => {
    try {
      const contract = await getReadContract();
      if (!contract) return false;
      const expired = await contract.isExpired();
      return expired;
    } catch {
      return false;
    }
  }, [getReadContract]);

  // ── Refresh all data (panggil setelah write sukses) ─────────────────────
  const refreshAllData = useCallback(async () => {
    await fetchEscrowDetails();
  }, [fetchEscrowDetails]);

  // ── WRITE: Generic write handler ────────────────────────────────────────
  const executeWrite = useCallback(
    async (actionKey, writeFn) => {
      // Reset state
      setTxStatus("pending");
      setTxError(null);
      setTxSuccessMsg(null);
      setLastAction(actionKey);

      try {
        await writeFn(); // writeFn harus sudah handle await tx.wait()
        setTxStatus("success");
        setTxSuccessMsg(getSuccessMessage(actionKey));

        // Refresh data dari blockchain setelah transaksi berhasil
        await refreshAllData();

        // Auto-clear success toast setelah 6 detik
        setTimeout(() => {
          setTxStatus("idle");
          setTxSuccessMsg(null);
          setLastAction(null);
        }, 6000);
      } catch (err) {
        setTxStatus("failed");
        setTxError(parseContractError(err));

        // Auto-clear error toast setelah 8 detik
        setTimeout(() => {
          setTxStatus("idle");
          setTxError(null);
          setLastAction(null);
        }, 8000);
      }
    },
    [refreshAllData]
  );

  // ── WRITE: Deposit ──────────────────────────────────────────────────────
  const deposit = useCallback(
    async (amountETH) => {
      await executeWrite("deposit", async () => {
        const contract = await getWriteContract();
        if (!contract) throw new Error("MetaMask tidak tersedia");

        const tx = await contract.deposit({
          value: ethers.parseEther(amountETH),
        });
        await tx.wait();
      });
    },
    [executeWrite, getWriteContract]
  );

  // ── WRITE: Release Funds ────────────────────────────────────────────────
  const releaseFunds = useCallback(async () => {
    await executeWrite("release", async () => {
      const contract = await getWriteContract();
      if (!contract) throw new Error("MetaMask tidak tersedia");

      const tx = await contract.releaseFunds();
      await tx.wait();
    });
  }, [executeWrite, getWriteContract]);

  // ── WRITE: Raise Dispute ────────────────────────────────────────────────
  const raiseDispute = useCallback(async () => {
    await executeWrite("dispute", async () => {
      const contract = await getWriteContract();
      if (!contract) throw new Error("MetaMask tidak tersedia");

      const tx = await contract.raiseDispute();
      await tx.wait();
    });
  }, [executeWrite, getWriteContract]);

  // ── WRITE: Refund After Timeout ─────────────────────────────────────────
  const refundAfterTimeout = useCallback(async () => {
    await executeWrite("refund", async () => {
      const contract = await getWriteContract();
      if (!contract) throw new Error("MetaMask tidak tersedia");

      const tx = await contract.refundAfterTimeout();
      await tx.wait();
    });
  }, [executeWrite, getWriteContract]);

  // ── WRITE: Resolve Dispute ──────────────────────────────────────────────
  const resolveDispute = useCallback(
    async (releaseToSeller) => {
      const key = releaseToSeller ? "resolveSeller" : "resolveBuyer";
      await executeWrite(key, async () => {
        const contract = await getWriteContract();
        if (!contract) throw new Error("MetaMask tidak tersedia");

        const tx = await contract.resolveDispute(releaseToSeller);
        await tx.wait();
      });
    },
    [executeWrite, getWriteContract]
  );

  // ── Auto-fetch data saat hook pertama kali mount ────────────────────────
  useEffect(() => {
    fetchEscrowDetails();
  }, [fetchEscrowDetails]);

  return {
    // Read data
    escrowData,
    isLoading,
    readError,

    // Write functions
    deposit,
    releaseFunds,
    raiseDispute,
    refundAfterTimeout,
    resolveDispute,

    // Transaction state
    txStatus,
    txError,
    txSuccessMsg,
    lastAction,

    // Refresh
    refreshAllData,
  };
}
