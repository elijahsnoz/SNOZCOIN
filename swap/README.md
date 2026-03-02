# SNOZCOIN Swap

Non-custodial USDT ⇄ SOL swap feature powered by Jupiter on Solana.

![Swap Preview](./preview.png)

## Features

- ✅ **Non-custodial** - Your keys, your coins. We never hold funds.
- ✅ **No signup** - Connect wallet and swap instantly
- ✅ **Best rates** - Jupiter aggregates 20+ DEXes
- ✅ **Mobile responsive** - Works on any device
- ✅ **Open source** - Fully auditable code

## Quick Start

```bash
# Install dependencies
cd swap
npm install

# Create environment file
cp .env.example .env.local

# Run development server
npm run dev

# Open http://localhost:3000
```

## Architecture

```
User Wallet (Phantom/Solflare)
        ↓ Connect
    [Swap UI]
        ↓ Get Quote
    [Jupiter API]
        ↓ Build Transaction
    [User Signs in Wallet]
        ↓ Broadcast
    [Solana Blockchain]
        ↓ Swap via DEX
    [User Receives Tokens]
```

## Supported Tokens

| Token | Mint |
|-------|------|
| SOL | `So11111111111111111111111111111111111111112` |
| USDT | `Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB` |
| USDC | `EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v` |

## Documentation

- [Setup Guide](./SETUP_GUIDE.md) - Development setup
- [Architecture](./ARCHITECTURE.md) - System design
- [Deployment](./DEPLOYMENT.md) - Production deployment
- [Security Checklist](./SECURITY_CHECKLIST.md) - Security audit

## Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS
- **Blockchain**: Solana, @solana/web3.js
- **Wallets**: @solana/wallet-adapter
- **DEX Aggregator**: Jupiter API

## Security

This feature is designed with security as the top priority:

1. **No custody** - All swaps signed by user's wallet
2. **Token whitelist** - Only verified tokens supported
3. **Slippage protection** - Configurable max slippage
4. **Transaction simulation** - Preview before execution

See [SECURITY_CHECKLIST.md](./SECURITY_CHECKLIST.md) for full audit.

## License

MIT - See main project LICENSE
