/**
 * Jupiter API Integration for SNOZCOIN Swap
 * 
 * This module handles all communication with Jupiter's swap API.
 * Jupiter aggregates liquidity from multiple DEXes (Orca, Raydium, etc.)
 * to find the best swap routes.
 * 
 * API Documentation: https://station.jup.ag/docs/apis/swap-api
 */

import { Connection, VersionedTransaction, PublicKey } from '@solana/web3.js';
import { isValidMint, SWAP_CONFIG } from './tokens';

// Jupiter API base URL
const JUPITER_API_URL = process.env.NEXT_PUBLIC_JUPITER_API_URL || 'https://quote-api.jup.ag/v6';

/**
 * Quote response from Jupiter API
 */
export interface JupiterQuote {
  inputMint: string;
  outputMint: string;
  inAmount: string;
  outAmount: string;
  otherAmountThreshold: string;
  swapMode: string;
  slippageBps: number;
  priceImpactPct: string;
  routePlan: RoutePlan[];
  contextSlot: number;
  timeTaken: number;
}

interface RoutePlan {
  swapInfo: {
    ammKey: string;
    label: string;
    inputMint: string;
    outputMint: string;
    inAmount: string;
    outAmount: string;
    feeAmount: string;
    feeMint: string;
  };
  percent: number;
}

/**
 * Swap transaction response from Jupiter API
 */
export interface JupiterSwapResponse {
  swapTransaction: string; // Base64 encoded transaction
  lastValidBlockHeight: number;
  prioritizationFeeLamports: number;
}

/**
 * Error types for better error handling
 */
export class JupiterError extends Error {
  constructor(
    message: string,
    public code: 'QUOTE_FAILED' | 'SWAP_FAILED' | 'INVALID_MINT' | 'RATE_LIMITED' | 'NETWORK_ERROR'
  ) {
    super(message);
    this.name = 'JupiterError';
  }
}

/**
 * Fetch a swap quote from Jupiter
 * 
 * @param inputMint - Token mint address to swap FROM
 * @param outputMint - Token mint address to swap TO
 * @param amount - Amount in smallest units (e.g., lamports for SOL)
 * @param slippageBps - Slippage tolerance in basis points (100 = 1%)
 * @returns Quote with best route and expected output
 */
export async function getQuote(
  inputMint: string,
  outputMint: string,
  amount: string,
  slippageBps: number = SWAP_CONFIG.DEFAULT_SLIPPAGE_BPS
): Promise<JupiterQuote> {
  // Security: Validate mints are in our whitelist
  if (!isValidMint(inputMint) || !isValidMint(outputMint)) {
    throw new JupiterError(
      'Invalid token mint address',
      'INVALID_MINT'
    );
  }

  // Don't fetch quote for zero amounts
  if (amount === '0' || !amount) {
    throw new JupiterError('Amount must be greater than 0', 'QUOTE_FAILED');
  }

  try {
    const params = new URLSearchParams({
      inputMint,
      outputMint,
      amount,
      slippageBps: slippageBps.toString(),
      // Only use direct routes for better security
      onlyDirectRoutes: 'false',
      // Exclude low liquidity DEXes
      excludeDexes: 'Aldrin,Crema,Cropper',
    });

    const response = await fetch(`${JUPITER_API_URL}/quote?${params}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (response.status === 429) {
      throw new JupiterError(
        'Rate limited. Please try again in a few seconds.',
        'RATE_LIMITED'
      );
    }

    if (!response.ok) {
      const error = await response.text();
      throw new JupiterError(
        `Failed to get quote: ${error}`,
        'QUOTE_FAILED'
      );
    }

    const quote: JupiterQuote = await response.json();
    
    // Validate response
    if (!quote.outAmount || quote.outAmount === '0') {
      throw new JupiterError(
        'No route found for this swap',
        'QUOTE_FAILED'
      );
    }

    return quote;
  } catch (error) {
    if (error instanceof JupiterError) {
      throw error;
    }
    throw new JupiterError(
      `Network error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      'NETWORK_ERROR'
    );
  }
}

/**
 * Build a swap transaction from a quote
 * 
 * @param quote - Quote from getQuote()
 * @param userPublicKey - User's wallet public key
 * @param wrapUnwrapSOL - Whether to wrap/unwrap SOL automatically
 * @returns Serialized transaction ready for signing
 */
export async function getSwapTransaction(
  quote: JupiterQuote,
  userPublicKey: string,
  wrapUnwrapSOL: boolean = true
): Promise<JupiterSwapResponse> {
  try {
    const response = await fetch(`${JUPITER_API_URL}/swap`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        quoteResponse: quote,
        userPublicKey,
        wrapAndUnwrapSol: wrapUnwrapSOL,
        // Use dynamic compute unit limit for better success rate
        dynamicComputeUnitLimit: true,
        // Add priority fee for faster confirmation
        prioritizationFeeLamports: SWAP_CONFIG.PRIORITY_FEE_MICROLAMPORTS,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new JupiterError(
        `Failed to build swap transaction: ${error}`,
        'SWAP_FAILED'
      );
    }

    return await response.json();
  } catch (error) {
    if (error instanceof JupiterError) {
      throw error;
    }
    throw new JupiterError(
      `Failed to build transaction: ${error instanceof Error ? error.message : 'Unknown error'}`,
      'SWAP_FAILED'
    );
  }
}

/**
 * Deserialize and send a swap transaction
 * 
 * @param connection - Solana RPC connection
 * @param swapTransaction - Base64 encoded transaction from Jupiter
 * @param signTransaction - Wallet's sign function
 * @returns Transaction signature
 */
export async function executeSwap(
  connection: Connection,
  swapTransaction: string,
  signTransaction: (tx: VersionedTransaction) => Promise<VersionedTransaction>
): Promise<string> {
  try {
    // Deserialize the transaction
    const transactionBuf = Buffer.from(swapTransaction, 'base64');
    const transaction = VersionedTransaction.deserialize(transactionBuf);

    // Get the latest blockhash for transaction
    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed');
    transaction.message.recentBlockhash = blockhash;

    // Sign the transaction with user's wallet
    const signedTransaction = await signTransaction(transaction);

    // Send the signed transaction
    const signature = await connection.sendRawTransaction(
      signedTransaction.serialize(),
      {
        skipPreflight: false,
        preflightCommitment: 'confirmed',
        maxRetries: 3,
      }
    );

    // Wait for confirmation
    const confirmation = await connection.confirmTransaction(
      {
        signature,
        blockhash,
        lastValidBlockHeight,
      },
      'confirmed'
    );

    if (confirmation.value.err) {
      throw new JupiterError(
        `Transaction failed: ${JSON.stringify(confirmation.value.err)}`,
        'SWAP_FAILED'
      );
    }

    return signature;
  } catch (error) {
    if (error instanceof JupiterError) {
      throw error;
    }
    
    // Handle user rejection
    if (error instanceof Error && error.message.includes('User rejected')) {
      throw new JupiterError('Transaction cancelled by user', 'SWAP_FAILED');
    }
    
    throw new JupiterError(
      `Swap execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      'SWAP_FAILED'
    );
  }
}

/**
 * Calculate price impact level for UI styling
 */
export function getPriceImpactLevel(priceImpactPct: string): 'low' | 'medium' | 'high' {
  const impact = parseFloat(priceImpactPct);
  if (impact < 1) return 'low';
  if (impact < 3) return 'medium';
  return 'high';
}

/**
 * Format price impact for display
 */
export function formatPriceImpact(priceImpactPct: string): string {
  const impact = parseFloat(priceImpactPct);
  if (impact < 0.01) return '< 0.01%';
  return `${impact.toFixed(2)}%`;
}

/**
 * Get human-readable route description
 */
export function getRouteDescription(quote: JupiterQuote): string {
  if (!quote.routePlan || quote.routePlan.length === 0) {
    return 'Direct swap';
  }
  
  const dexes = quote.routePlan.map(r => r.swapInfo.label);
  const uniqueDexes = [...new Set(dexes)];
  
  if (uniqueDexes.length === 1) {
    return `via ${uniqueDexes[0]}`;
  }
  
  return `via ${uniqueDexes.join(' → ')}`;
}
