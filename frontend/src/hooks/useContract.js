import { useCallback, useMemo } from 'react';
import { ethers } from 'ethers';
import contractsData from '../utils/contracts.json';

export default function useContract(provider, signer, account) {
  // Memoize factory contract instance
  const factoryContract = useMemo(() => {
    if (!provider) return null;
    const address = contractsData.factoryAddress;
    const abi = contractsData.factoryAbi;
    // Use signer if available, otherwise fallback to provider for read-only access
    const runner = signer || provider;
    return new ethers.Contract(address, abi, runner);
  }, [provider, signer]);

  // Create simple escrow instance helper
  const getEscrowContract = useCallback((escrowAddress) => {
    if (!provider) return null;
    const runner = signer || provider;
    return new ethers.Contract(escrowAddress, contractsData.escrowAbi, runner);
  }, [provider, signer]);

  // Create Escrow Transaction
  const createEscrow = useCallback(async (seller, arbiter, durationSeconds, feePercent) => {
    if (!factoryContract) throw new Error('Contract not initialized');
    
    // Call contract
    const tx = await factoryContract.createEscrow(
      seller,
      arbiter,
      durationSeconds,
      feePercent
    );
    const receipt = await tx.wait();
    
    // Parse EscrowCreated event
    const event = receipt.logs
      .map((log) => {
        try {
          return factoryContract.interface.parseLog(log);
        } catch (e) {
          return null;
        }
      })
      .find((parsed) => parsed && parsed.name === 'EscrowCreated');

    return event ? event.args.escrowAddress : null;
  }, [factoryContract]);

  // Fetch escrow contracts associated with the user
  const fetchUserEscrows = useCallback(async () => {
    if (!factoryContract || !account) return [];
    try {
      const addresses = await factoryContract.getEscrowsByUser(account);
      
      const escrowsData = await Promise.all(
        addresses.map(async (address) => {
          try {
            const escrowContract = getEscrowContract(address);
            const details = await escrowContract.getEscrowDetails();
            const bal = await provider.getBalance(address);

            return {
              address,
              buyer: details._buyer,
              seller: details._seller,
              arbiter: details._arbiter,
              balance: ethers.formatEther(bal),
              state: Number(details._state),
              deadline: Number(details._deadline),
              feePercent: Number(details._arbiterFeePercent)
            };
          } catch (err) {
            console.error(`Error fetching details for escrow ${address}:`, err);
            return null;
          }
        })
      );

      // Filter out failed queries and sort by newest first (reverse of array)
      return escrowsData.filter(Boolean).reverse();
    } catch (err) {
      console.error('Error fetching user escrows:', err);
      return [];
    }
  }, [factoryContract, account, getEscrowContract, provider]);

  // Deposit funds into escrow contract
  const deposit = useCallback(async (escrowAddress, amountEth) => {
    const escrowContract = getEscrowContract(escrowAddress);
    if (!escrowContract) throw new Error('Contract not initialized');
    
    const value = ethers.parseEther(amountEth);
    const tx = await escrowContract.deposit({ value });
    return await tx.wait();
  }, [getEscrowContract]);

  // Release funds to Seller (Buyer action)
  const releaseFunds = useCallback(async (escrowAddress) => {
    const escrowContract = getEscrowContract(escrowAddress);
    if (!escrowContract) throw new Error('Contract not initialized');
    
    const tx = await escrowContract.releaseFunds();
    return await tx.wait();
  }, [getEscrowContract]);

  // Raise dispute (Buyer/Seller action)
  const raiseDispute = useCallback(async (escrowAddress) => {
    const escrowContract = getEscrowContract(escrowAddress);
    if (!escrowContract) throw new Error('Contract not initialized');
    
    const tx = await escrowContract.raiseDispute();
    return await tx.wait();
  }, [getEscrowContract]);

  // Refund buyer after timeout
  const refundAfterTimeout = useCallback(async (escrowAddress) => {
    const escrowContract = getEscrowContract(escrowAddress);
    if (!escrowContract) throw new Error('Contract not initialized');
    
    const tx = await escrowContract.refundAfterTimeout();
    return await tx.wait();
  }, [getEscrowContract]);

  // Resolve dispute (Arbiter action)
  const resolveDispute = useCallback(async (escrowAddress, releaseToSeller) => {
    const escrowContract = getEscrowContract(escrowAddress);
    if (!escrowContract) throw new Error('Contract not initialized');
    
    const tx = await escrowContract.resolveDispute(releaseToSeller);
    return await tx.wait();
  }, [getEscrowContract]);

  // Fetch on-chain events for a specific escrow contract
  const fetchEscrowEvents = useCallback(async (escrowAddress) => {
    if (!provider) return [];
    try {
      const escrowContract = getEscrowContract(escrowAddress);
      const filter = {
        address: escrowAddress,
        fromBlock: 0,
        toBlock: 'latest'
      };
      
      const logs = await provider.getLogs(filter);
      
      const parsedLogs = logs.map((log) => {
        try {
          const parsed = escrowContract.interface.parseLog(log);
          return {
            name: parsed.name,
            args: parsed.args,
            blockNumber: Number(log.blockNumber),
            transactionHash: log.transactionHash
          };
        } catch (e) {
          return null;
        }
      }).filter(Boolean);

      return parsedLogs;
    } catch (err) {
      console.error('Error fetching escrow events:', err);
      return [];
    }
  }, [provider, getEscrowContract]);

  return {
    createEscrow,
    fetchUserEscrows,
    deposit,
    releaseFunds,
    raiseDispute,
    refundAfterTimeout,
    resolveDispute,
    fetchEscrowEvents
  };
}
