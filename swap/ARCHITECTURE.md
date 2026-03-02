# SNOZCOIN Swap Feature - System Architecture

## Overview

A non-custodial, wallet-based swap feature allowing users to exchange USDT ⇄ SOL on Solana blockchain using Jupiter DEX aggregator.

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              USER'S BROWSER                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────┐     ┌──────────────────┐     ┌──────────────────────┐    │
│  │   Wallet     │     │   Swap UI        │     │   Quote Display      │    │
│  │  Extension   │◄───►│   Component      │◄───►│   Component          │    │
│  │ (Phantom/    │     │                  │     │  (Price, Fees,       │    │
│  │  Solflare)   │     │  - Token Select  │     │   Slippage)          │    │
│  └──────┬───────┘     │  - Amount Input  │     └──────────────────────┘    │
│         │             │  - Swap Button   │                                  │
│         │             └────────┬─────────┘                                  │
│         │                      │                                            │
│         │    ┌─────────────────┼─────────────────┐                         │
│         │    │                 ▼                 │                         │
│         │    │    ┌───────────────────────┐     │                         │
│         │    │    │   Wallet Adapter      │     │                         │
│         │    │    │   (@solana/wallet-    │     │                         │
│         │    │    │    adapter-react)     │     │                         │
│         │    │    └───────────┬───────────┘     │                         │
│         │    │                │                  │                         │
│         │    │    React/Next.js Application     │                         │
│         │    └─────────────────┬─────────────────┘                         │
│         │                      │                                            │
└─────────┼──────────────────────┼────────────────────────────────────────────┘
          │                      │
          │                      │ HTTPS (API Calls)
          │                      ▼
          │         ┌────────────────────────┐
          │         │   Jupiter API          │
          │         │   (quote.jup.ag)       │
          │         │                        │
          │         │  • Get quotes          │
          │         │  • Route optimization  │
          │         │  • Build transactions  │
          │         └────────────┬───────────┘
          │                      │
          │                      │ Returns serialized transaction
          │                      ▼
          │         ┌────────────────────────┐
          │         │   Transaction Builder  │
          │         │                        │
          │         │  • Deserialize tx      │
          │         │  • Add priority fees   │
          │         │  • Set compute units   │
          │         └────────────┬───────────┘
          │                      │
          └──────────────────────┤
                                 │ User signs in wallet
                                 ▼
                    ┌────────────────────────┐
                    │   Solana RPC           │
                    │   (Helius/QuickNode)   │
                    │                        │
                    │  • Broadcast tx        │
                    │  • Confirm on-chain    │
                    │  • Return signature    │
                    └────────────┬───────────┘
                                 │
                                 ▼
                    ┌────────────────────────┐
                    │   Solana Blockchain    │
                    │                        │
                    │  ┌──────────────────┐  │
                    │  │ Jupiter Program  │  │
                    │  │ (On-chain swap)  │  │
                    │  └────────┬─────────┘  │
                    │           │            │
                    │           ▼            │
                    │  ┌──────────────────┐  │
                    │  │ DEX Liquidity    │  │
                    │  │ (Orca, Raydium,  │  │
                    │  │  Meteora, etc.)  │  │
                    │  └──────────────────┘  │
                    └────────────────────────┘
```

---

## Data Flow

```
1. USER CONNECTS WALLET
   Browser ──► Wallet Extension ──► Returns public key
   
2. USER ENTERS SWAP DETAILS
   Input: "Swap 100 USDT for SOL"
   
3. FETCH QUOTE (Every 10 seconds + on input change)
   Frontend ──► Jupiter API (/quote)
   Request:  { inputMint, outputMint, amount, slippage }
   Response: { outAmount, priceImpact, route, fees }
   
4. USER CLICKS SWAP
   Frontend ──► Jupiter API (/swap)
   Request:  { quoteResponse, userPublicKey }
   Response: { swapTransaction (base64) }
   
5. USER SIGNS TRANSACTION
   Frontend ──► Wallet Extension
   Wallet shows: "Approve swap of 100 USDT for ~X SOL"
   User clicks "Approve"
   
6. BROADCAST TO BLOCKCHAIN
   Signed Tx ──► Solana RPC ──► Blockchain
   
7. CONFIRMATION
   Frontend polls for confirmation
   Shows success/failure to user
```

---

## Security Model

```
┌─────────────────────────────────────────────────────────────┐
│                    TRUST BOUNDARIES                          │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─────────────────┐                                        │
│  │  TRUSTED        │  User's wallet (Phantom/Solflare)      │
│  │  (User Control) │  Private keys NEVER leave wallet       │
│  └─────────────────┘                                        │
│                                                              │
│  ┌─────────────────┐                                        │
│  │  SEMI-TRUSTED   │  Jupiter API (audited, widely used)    │
│  │  (3rd Party)    │  Solana RPC providers                  │
│  └─────────────────┘                                        │
│                                                              │
│  ┌─────────────────┐                                        │
│  │  OUR CODE       │  Frontend only                         │
│  │  (No custody)   │  Never handles private keys            │
│  │                 │  Never stores funds                    │
│  └─────────────────┘                                        │
│                                                              │
│  ┌─────────────────┐                                        │
│  │  ON-CHAIN       │  Jupiter smart contracts (audited)     │
│  │  (Trustless)    │  DEX pools (Orca, Raydium)            │
│  └─────────────────┘                                        │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Token Addresses (Mainnet)

| Token | Mint Address |
|-------|--------------|
| SOL (Native) | `So11111111111111111111111111111111111111112` |
| USDT | `Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB` |
| USDC | `EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v` |

---

## Rate Limiting Strategy

```
Jupiter API Limits:
- Public: 60 requests/minute
- With API key: 600 requests/minute

Our Strategy:
1. Debounce quote requests (300ms after user stops typing)
2. Cache quotes for 10 seconds
3. Show "refreshing..." during updates
4. Graceful degradation on rate limit
```

---

## Error Handling Matrix

| Error Type | Detection | User Message | Recovery |
|------------|-----------|--------------|----------|
| Wallet not connected | No publicKey | "Connect your wallet" | Show connect button |
| Insufficient balance | Pre-check balance | "Insufficient USDT" | Disable swap |
| Quote expired | Timestamp check | "Quote expired" | Auto-refresh |
| Slippage exceeded | Tx simulation fail | "Price moved" | Retry with higher slippage |
| Network error | Fetch catch | "Network error" | Retry button |
| Tx rejected by user | Wallet callback | "Transaction cancelled" | Reset form |
| Tx failed on-chain | Confirmation fail | "Swap failed" | Show explorer link |
