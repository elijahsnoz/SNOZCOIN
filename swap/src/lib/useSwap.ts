/**
 * Main Swap Hook - Manages swap state and logic
 * 
 * This is the core business logic for the swap feature.
 * Handles quotes, transactions, and error states.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import {
  getQuote,
  getSwapTransaction,
  executeSwap,
  JupiterQuote,
  JupiterError,
} from './jupiter';
import {
  SUPPORTED_TOKENS,
  SWAP_CONFIG,
  parseTokenAmount,
  formatTokenAmount,
  TokenInfo,
} from './tokens';
import { useTokenBalances } from './useBalances';

export type SwapStatus = 
  | 'idle'
  | 'fetching-quote'
  | 'quote-ready'
  | 'building-tx'
  | 'awaiting-signature'
  | 'confirming'
  | 'success'
  | 'error';

export interface SwapState {
  // Input state
  inputToken: TokenInfo;
  outputToken: TokenInfo;
  inputAmount: string;
  
  // Quote state
  quote: JupiterQuote | null;
  outputAmount: string;
  priceImpact: string;
  route: string;
  
  // Slippage
  slippageBps: number;
  
  // Status
  status: SwapStatus;
  error: string | null;
  txSignature: string | null;
}

export interface SwapActions {
  setInputToken: (token: TokenInfo) => void;
  setOutputToken: (token: TokenInfo) => void;
  setInputAmount: (amount: string) => void;
  setSlippage: (bps: number) => void;
  switchTokens: () => void;
  refreshQuote: () => Promise<void>;
  executeSwap: () => Promise<void>;
  reset: () => void;
}

const initialState: SwapState = {
  inputToken: SUPPORTED_TOKENS.USDT,
  outputToken: SUPPORTED_TOKENS.SOL,
  inputAmount: '',
  quote: null,
  outputAmount: '',
  priceImpact: '0',
  route: '',
  slippageBps: SWAP_CONFIG.DEFAULT_SLIPPAGE_BPS,
  status: 'idle',
  error: null,
  txSignature: null,
};

export function useSwap(): [SwapState, SwapActions, ReturnType<typeof useTokenBalances>] {
  const { connection } = useConnection();
  const { publicKey, signTransaction } = useWallet();
  const balances = useTokenBalances();
  
  const [state, setState] = useState<SwapState>(initialState);
  
  // Ref to track latest quote request (for debouncing)
  const quoteRequestRef = useRef<number>(0);
  
  // Debounced quote fetching
  const fetchQuote = useCallback(async () => {
    const { inputToken, outputToken, inputAmount, slippageBps } = state;
    
    // Skip if no amount entered
    if (!inputAmount || parseFloat(inputAmount) <= 0) {
      setState(s => ({
        ...s,
        quote: null,
        outputAmount: '',
        priceImpact: '0',
        route: '',
        status: 'idle',
        error: null,
      }));
      return;
    }
    
    // Parse amount to smallest units
    const amountIn = parseTokenAmount(inputAmount, inputToken.decimals);
    if (amountIn === BigInt(0)) {
      return;
    }
    
    // Track this request
    const requestId = ++quoteRequestRef.current;
    
    setState(s => ({ ...s, status: 'fetching-quote', error: null }));
    
    try {
      const quote = await getQuote(
        inputToken.mint,
        outputToken.mint,
        amountIn.toString(),
        slippageBps
      );
      
      // Only update if this is still the latest request
      if (requestId !== quoteRequestRef.current) {
        return;
      }
      
      const outputAmount = formatTokenAmount(
        quote.outAmount,
        outputToken.decimals
      );
      
      setState(s => ({
        ...s,
        quote,
        outputAmount,
        priceImpact: quote.priceImpactPct,
        route: quote.routePlan.map(r => r.swapInfo.label).join(' → '),
        status: 'quote-ready',
        error: null,
      }));
    } catch (err) {
      if (requestId !== quoteRequestRef.current) {
        return;
      }
      
      const message = err instanceof JupiterError 
        ? err.message 
        : 'Failed to fetch quote';
      
      setState(s => ({
        ...s,
        quote: null,
        outputAmount: '',
        status: 'error',
        error: message,
      }));
    }
  }, [state.inputToken, state.outputToken, state.inputAmount, state.slippageBps]);
  
  // Auto-refresh quotes
  useEffect(() => {
    // Debounce input changes
    const debounceTimer = setTimeout(fetchQuote, SWAP_CONFIG.INPUT_DEBOUNCE_MS);
    return () => clearTimeout(debounceTimer);
  }, [state.inputAmount, state.inputToken, state.outputToken, state.slippageBps]);
  
  // Periodic quote refresh
  useEffect(() => {
    if (state.status !== 'quote-ready') return;
    
    const refreshInterval = setInterval(fetchQuote, SWAP_CONFIG.QUOTE_REFRESH_INTERVAL);
    return () => clearInterval(refreshInterval);
  }, [state.status, fetchQuote]);
  
  // Execute swap action
  const doSwap = useCallback(async () => {
    if (!publicKey || !signTransaction || !state.quote) {
      setState(s => ({ ...s, error: 'Wallet not connected' }));
      return;
    }
    
    setState(s => ({ ...s, status: 'building-tx', error: null }));
    
    try {
      // Get swap transaction from Jupiter
      const { swapTransaction } = await getSwapTransaction(
        state.quote,
        publicKey.toString()
      );
      
      setState(s => ({ ...s, status: 'awaiting-signature' }));
      
      // Execute the swap (will prompt wallet signature)
      const signature = await executeSwap(
        connection,
        swapTransaction,
        signTransaction
      );
      
      setState(s => ({ ...s, status: 'confirming' }));
      
      // Success!
      setState(s => ({
        ...s,
        status: 'success',
        txSignature: signature,
        error: null,
      }));
      
      // Refresh balances after swap
      setTimeout(() => balances.refetch(), 2000);
      
    } catch (err) {
      const message = err instanceof JupiterError 
        ? err.message 
        : 'Swap failed';
      
      setState(s => ({
        ...s,
        status: 'error',
        error: message,
      }));
    }
  }, [publicKey, signTransaction, state.quote, connection, balances]);
  
  // Actions
  const actions: SwapActions = {
    setInputToken: (token) => {
      setState(s => ({
        ...s,
        inputToken: token,
        // If same as output, switch them
        outputToken: token.mint === s.outputToken.mint ? s.inputToken : s.outputToken,
        quote: null,
        outputAmount: '',
      }));
    },
    
    setOutputToken: (token) => {
      setState(s => ({
        ...s,
        outputToken: token,
        // If same as input, switch them
        inputToken: token.mint === s.inputToken.mint ? s.outputToken : s.inputToken,
        quote: null,
        outputAmount: '',
      }));
    },
    
    setInputAmount: (amount) => {
      // Only allow valid numeric input
      if (amount && !/^\d*\.?\d*$/.test(amount)) {
        return;
      }
      setState(s => ({
        ...s,
        inputAmount: amount,
        status: 'idle',
      }));
    },
    
    setSlippage: (bps) => {
      const clampedBps = Math.min(
        Math.max(1, bps),
        SWAP_CONFIG.MAX_SLIPPAGE_BPS
      );
      setState(s => ({ ...s, slippageBps: clampedBps }));
    },
    
    switchTokens: () => {
      setState(s => ({
        ...s,
        inputToken: s.outputToken,
        outputToken: s.inputToken,
        inputAmount: s.outputAmount ? s.outputAmount.replace(/,/g, '') : '',
        outputAmount: '',
        quote: null,
      }));
    },
    
    refreshQuote: fetchQuote,
    
    executeSwap: doSwap,
    
    reset: () => {
      setState(initialState);
    },
  };
  
  return [state, actions, balances];
}
