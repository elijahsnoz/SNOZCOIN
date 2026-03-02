# SNOZCOIN Swap - Setup Guide

## Prerequisites

- **Node.js** 18.0.0 or higher
- **npm** or **yarn**
- A **Solana wallet** (Phantom, Solflare, or Backpack)
- Optional: **Helius** or **QuickNode** API key for production RPC

---

## Quick Start

### 1. Navigate to the swap directory

```bash
cd /Users/xworld/Desktop/SNOZCOIN/swap
```

### 2. Install dependencies

```bash
npm install
```

### 3. Create environment file

```bash
cp .env.example .env.local
```

### 4. Configure environment variables

Edit `.env.local`:

```env
# For development (public RPC, rate limited)
NEXT_PUBLIC_SOLANA_RPC_URL=https://api.mainnet-beta.solana.com

# For production (use a dedicated RPC provider)
# NEXT_PUBLIC_SOLANA_RPC_URL=https://mainnet.helius-rpc.com/?api-key=YOUR_KEY

# Jupiter API (default is fine for most cases)
NEXT_PUBLIC_JUPITER_API_URL=https://quote-api.jup.ag/v6
```

### 5. Run development server

```bash
npm run dev
```

### 6. Open in browser

Navigate to `http://localhost:3000`

---

## Development Workflow

### File Structure

```
swap/
├── src/
│   ├── app/
│   │   ├── layout.tsx      # Root layout with wallet providers
│   │   ├── page.tsx        # Main swap page
│   │   └── globals.css     # Global styles
│   ├── components/
│   │   ├── SwapCard.tsx    # Main swap UI component
│   │   ├── TokenSelector.tsx
│   │   └── WalletProvider.tsx
│   └── lib/
│       ├── jupiter.ts      # Jupiter API integration
│       ├── tokens.ts       # Token constants & utilities
│       ├── useBalances.ts  # Balance fetching hook
│       └── useSwap.ts      # Main swap logic hook
├── package.json
├── tailwind.config.js
└── next.config.js
```

### Key Components

#### `useSwap` Hook

The main business logic hook that manages:
- Quote fetching with debouncing
- Transaction building
- Wallet signing
- Status tracking

```tsx
const [state, actions, balances] = useSwap();

// State includes:
// - inputToken, outputToken
// - inputAmount, outputAmount
// - quote, status, error

// Actions include:
// - setInputAmount()
// - switchTokens()
// - executeSwap()
```

#### `jupiter.ts` Module

Handles all Jupiter API calls:

```typescript
// Get a quote
const quote = await getQuote(inputMint, outputMint, amount, slippageBps);

// Build swap transaction
const { swapTransaction } = await getSwapTransaction(quote, userPublicKey);

// Execute swap
const signature = await executeSwap(connection, swapTransaction, signTransaction);
```

---

## Testing

### Manual Testing Checklist

1. **Wallet Connection**
   - [ ] Connect Phantom wallet
   - [ ] Connect Solflare wallet
   - [ ] Connect Backpack wallet
   - [ ] Disconnect and reconnect
   - [ ] Check balance display

2. **Quote Fetching**
   - [ ] Enter USDT amount, see SOL quote
   - [ ] Enter SOL amount, see USDT quote
   - [ ] Change slippage, see quote update
   - [ ] Quote refreshes every 10 seconds

3. **Swap Execution**
   - [ ] Execute small test swap ($1-5 worth)
   - [ ] Verify wallet popup appears
   - [ ] Confirm transaction in wallet
   - [ ] See success message
   - [ ] Verify on Solscan

4. **Error Handling**
   - [ ] Try to swap with 0 balance
   - [ ] Reject transaction in wallet
   - [ ] Test with network disconnected
   - [ ] Test rate limiting (rapid requests)

### Testnet Testing

For safer testing, modify the RPC to use devnet:

```env
NEXT_PUBLIC_SOLANA_RPC_URL=https://api.devnet.solana.com
```

Note: You'll need devnet USDT/SOL from a faucet.

---

## Production RPC Providers

For production, DO NOT use the public RPC. Choose a dedicated provider:

### Helius (Recommended)

1. Sign up at https://www.helius.dev/
2. Create a project
3. Copy your API key
4. Set in `.env.local`:

```env
NEXT_PUBLIC_SOLANA_RPC_URL=https://mainnet.helius-rpc.com/?api-key=YOUR_KEY
```

### QuickNode

1. Sign up at https://www.quicknode.com/
2. Create Solana mainnet endpoint
3. Copy endpoint URL
4. Set in `.env.local`

### Alchemy

1. Sign up at https://www.alchemy.com/
2. Create Solana app
3. Copy HTTPS endpoint
4. Set in `.env.local`

---

## Common Issues

### "Cannot find module" errors

```bash
rm -rf node_modules package-lock.json
npm install
```

### Wallet not connecting

1. Ensure wallet extension is installed
2. Check browser console for errors
3. Try refreshing the page
4. Check if wallet is on correct network (Solana mainnet)

### Quote returning 0

1. Check if amount is too small
2. Verify token mints are correct
3. Check Jupiter API status: https://status.jup.ag/

### Transaction failing

1. Increase slippage tolerance
2. Check SOL balance for fees (~0.01 SOL needed)
3. Try refreshing quote before swapping

---

## Next Steps

1. Read `DEPLOYMENT.md` for production deployment
2. Read `SECURITY_CHECKLIST.md` before going live
3. Test thoroughly on mainnet with small amounts first
