/**
 * Token Constants for SNOZCOIN Swap
 * 
 * These are the official Solana mainnet token mint addresses.
 * NEVER change these without verifying on Solana Explorer.
 */

// Native SOL wrapped as SPL token
export const SOL_MINT = 'So11111111111111111111111111111111111111112';

// USDT on Solana (official Tether mint)
export const USDT_MINT = 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB';

// USDC on Solana (optional, for future expansion)
export const USDC_MINT = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';

/**
 * Token metadata for display
 */
export interface TokenInfo {
  symbol: string;
  name: string;
  mint: string;
  decimals: number;
  logoURI: string;
}

export const SUPPORTED_TOKENS: Record<string, TokenInfo> = {
  SOL: {
    symbol: 'SOL',
    name: 'Solana',
    mint: SOL_MINT,
    decimals: 9,
    logoURI: 'https://assets.coingecko.com/coins/images/4128/small/solana.png',
  },
  USDT: {
    symbol: 'USDT',
    name: 'Tether USD',
    mint: USDT_MINT,
    decimals: 6,
    logoURI: 'https://assets.coingecko.com/coins/images/325/small/Tether.png',
  },
  USDC: {
    symbol: 'USDC',
    name: 'USD Coin',
    mint: USDC_MINT,
    decimals: 6,
    logoURI: 'https://assets.coingecko.com/coins/images/6319/small/usdc.png',
  },
};

/**
 * Default swap configuration
 */
export const SWAP_CONFIG = {
  // Default slippage in basis points (50 = 0.5%)
  DEFAULT_SLIPPAGE_BPS: 50,
  
  // Maximum allowed slippage (10%)
  MAX_SLIPPAGE_BPS: 1000,
  
  // Quote refresh interval in milliseconds
  QUOTE_REFRESH_INTERVAL: 10000,
  
  // Debounce delay for input changes
  INPUT_DEBOUNCE_MS: 300,
  
  // Transaction confirmation timeout
  TX_CONFIRMATION_TIMEOUT: 60000,
  
  // Priority fee in microlamports (for faster confirmation)
  PRIORITY_FEE_MICROLAMPORTS: 50000,
};

/**
 * Validate that a mint address is in our whitelist
 * Security: Prevents swapping to malicious tokens
 */
export function isValidMint(mint: string): boolean {
  return Object.values(SUPPORTED_TOKENS).some(token => token.mint === mint);
}

/**
 * Get token info by mint address
 */
export function getTokenByMint(mint: string): TokenInfo | undefined {
  return Object.values(SUPPORTED_TOKENS).find(token => token.mint === mint);
}

/**
 * Format token amount for display
 */
export function formatTokenAmount(
  amount: number | string,
  decimals: number,
  displayDecimals: number = 4
): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  const adjusted = num / Math.pow(10, decimals);
  
  if (adjusted < 0.0001 && adjusted > 0) {
    return '< 0.0001';
  }
  
  return adjusted.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: displayDecimals,
  });
}

/**
 * Parse user input to token amount (with decimals)
 */
export function parseTokenAmount(input: string, decimals: number): bigint {
  const num = parseFloat(input);
  if (isNaN(num) || num <= 0) {
    return BigInt(0);
  }
  return BigInt(Math.floor(num * Math.pow(10, decimals)));
}
