/**
 * Custom React hooks for wallet balance management
 */

import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { getAccount, getAssociatedTokenAddress } from '@solana/spl-token';
import { useState, useEffect, useCallback } from 'react';
import { SUPPORTED_TOKENS, SOL_MINT } from './tokens';

export interface TokenBalance {
  mint: string;
  balance: bigint;
  uiBalance: number;
  decimals: number;
}

/**
 * Hook to fetch and track token balances
 */
export function useTokenBalances() {
  const { connection } = useConnection();
  const { publicKey } = useWallet();
  
  const [balances, setBalances] = useState<Record<string, TokenBalance>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBalances = useCallback(async () => {
    if (!publicKey) {
      setBalances({});
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const newBalances: Record<string, TokenBalance> = {};

      // Fetch SOL balance
      const solBalance = await connection.getBalance(publicKey);
      newBalances['SOL'] = {
        mint: SOL_MINT,
        balance: BigInt(solBalance),
        uiBalance: solBalance / LAMPORTS_PER_SOL,
        decimals: 9,
      };

      // Fetch SPL token balances
      for (const [symbol, token] of Object.entries(SUPPORTED_TOKENS)) {
        if (symbol === 'SOL') continue;

        try {
          const tokenMint = new PublicKey(token.mint);
          const ata = await getAssociatedTokenAddress(tokenMint, publicKey);
          
          const accountInfo = await getAccount(connection, ata);
          const balance = accountInfo.amount;
          
          newBalances[symbol] = {
            mint: token.mint,
            balance,
            uiBalance: Number(balance) / Math.pow(10, token.decimals),
            decimals: token.decimals,
          };
        } catch (e) {
          // Account doesn't exist = 0 balance
          newBalances[symbol] = {
            mint: token.mint,
            balance: BigInt(0),
            uiBalance: 0,
            decimals: token.decimals,
          };
        }
      }

      setBalances(newBalances);
    } catch (err) {
      setError('Failed to fetch balances');
      console.error('Balance fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [connection, publicKey]);

  // Fetch on mount and when wallet changes
  useEffect(() => {
    fetchBalances();
  }, [fetchBalances]);

  // Refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(fetchBalances, 30000);
    return () => clearInterval(interval);
  }, [fetchBalances]);

  return {
    balances,
    loading,
    error,
    refetch: fetchBalances,
  };
}

/**
 * Hook to check if user has sufficient balance for a swap
 */
export function useBalanceCheck(
  tokenSymbol: string,
  requiredAmount: number
) {
  const { balances } = useTokenBalances();
  
  const balance = balances[tokenSymbol];
  const hasBalance = balance ? balance.uiBalance >= requiredAmount : false;
  const insufficientBy = balance 
    ? Math.max(0, requiredAmount - balance.uiBalance) 
    : requiredAmount;

  return {
    hasBalance,
    currentBalance: balance?.uiBalance || 0,
    insufficientBy,
  };
}
