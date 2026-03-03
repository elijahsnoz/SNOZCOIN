# 🪙 SNOZCOIN ($SNOZ)

> **Creator Utility Token Platform on Stacks**
> 
> Empowering youth, creators, developers, and communities across Africa and globally with Bitcoin-secured creator monetization.

[![Stacks](https://img.shields.io/badge/Built%20on-Stacks-5546FF?style=for-the-badge&logo=stacks)](https://stacks.co)
[![Bitcoin](https://img.shields.io/badge/Secured%20by-Bitcoin-F7931A?style=for-the-badge&logo=bitcoin)](https://bitcoin.org)
[![Clarity](https://img.shields.io/badge/Smart%20Contracts-Clarity-00D4FF?style=for-the-badge)](https://clarity-lang.org)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)

---

## 🎯 Project Overview

SNOZCOIN is a **creator utility token platform** built on the Stacks blockchain, enabling:

- **💰 Direct Creator Tipping** - Support creators with STX payments
- **🔐 Unlockable Content** - Exclusive content behind STX paywalls
- **🏆 Community Rewards** - Points, badges, and tier progression
- **🌍 Global Reach** - Targeting youth and creators in Africa and beyond

### Why Stacks?

- ⚡ **Bitcoin Security**: All transactions are secured by Bitcoin's proof-of-work
- 📜 **Clarity Smart Contracts**: Predictable, secure, decidable smart contracts
- 🔗 **sBTC Integration Ready**: Future-proof for native Bitcoin integration
- 🌐 **Decentralized**: True ownership and censorship resistance

---

## 📁 Project Structure

```
SNOZCOIN/
├── stacks-contracts/          # Clarity smart contracts
│   ├── contracts/
│   │   ├── snozcoin-tipping.clar    # Creator tipping system
│   │   ├── snozcoin-content.clar    # Unlockable content
│   │   └── snozcoin-rewards.clar    # Rewards & gamification
│   └── tests/
│       ├── snozcoin-tipping.test.ts
│       ├── snozcoin-content.test.ts
│       └── snozcoin-rewards.test.ts
├── frontend/                  # Web application
│   ├── src/
│   │   ├── lib/
│   │   │   ├── wallet.js      # Stacks wallet integration
│   │   │   ├── tipping.js     # Tipping module
│   │   │   ├── content.js     # Content module
│   │   │   ├── rewards.js     # Rewards module
│   │   │   └── ui.js          # UI utilities
│   │   ├── main.js            # App entry point
│   │   └── styles.css         # Styling
│   └── index.html             # Main HTML
├── reference/                 # Python reference implementation
├── docs/                      # Documentation
└── assets/                    # Images and media
```

---

## 🚀 Quick Start

### Prerequisites

- [Node.js](https://nodejs.org/) v18+
- [Clarinet](https://github.com/hirosystems/clarinet) v2.x
- [Stacks Wallet](https://www.hiro.so/wallet) (for testing)

### 1. Clone & Setup

```bash
git clone https://github.com/yourusername/snozcoin.git
cd snozcoin
```

### 2. Smart Contract Development

```bash
# Navigate to contracts
cd stacks-contracts

# Check contract syntax
clarinet check

# Run tests (97 tests)
npm test

# Open Clarinet console for manual testing
clarinet console
```

### 3. Frontend Development

```bash
# Navigate to frontend
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
# Opens at http://localhost:3000

# Build for production
npm run build
```

---

## 📜 Smart Contracts

### 1. snozcoin-tipping.clar

Creator registration and direct STX tipping with platform fees.

**Key Functions:**
| Function | Description |
|----------|-------------|
| `register-creator` | Register as a creator with name and bio |
| `tip-creator` | Send STX tip to a creator |
| `withdraw-funds` | Creator withdraws accumulated tips |
| `set-tip-goal` | Creator sets a funding goal |
| `verify-creator` | Admin verifies creator identity |

**Platform Fee:** 2.5% on tips (configurable)

### 2. snozcoin-content.clar

Unlockable content system with STX payments.

**Key Functions:**
| Function | Description |
|----------|-------------|
| `create-content` | Create new gated content |
| `purchase-content` | Purchase access to content |
| `has-access` | Check if user has access |
| `get-content-uri` | Get content URI (if unlocked) |
| `deactivate-content` | Creator removes content |

**Platform Fee:** 5% on purchases

### 3. snozcoin-rewards.clar

Community engagement with points, badges, and tiers.

**Key Functions:**
| Function | Description |
|----------|-------------|
| `award-points` | Admin awards points |
| `award-badge` | Admin gives achievement badge |
| `claim-reward` | User redeems points for rewards |
| `get-user-tier` | Get user's tier (Bronze→Diamond) |
| `record-tip-activity` | Track tipping milestones |

**Tiers:** Bronze (0) → Silver (500) → Gold (2000) → Platinum (5000) → Diamond (10000)

---

## 🧪 Testing

All contracts are thoroughly tested with 97+ tests covering:

- ✅ Happy path scenarios
- ✅ Edge cases
- ✅ Authorization checks
- ✅ Error handling
- ✅ State transitions

```bash
cd stacks-contracts
npm test

# Sample output:
# ✓ snozcoin-tipping.test.ts (37 tests)
# ✓ snozcoin-content.test.ts (30 tests)
# ✓ snozcoin-rewards.test.ts (30 tests)
# Test Files  3 passed (3)
# Tests  97 passed (97)
```

---

## 🔗 Stacks Integration

### Wallet Connection

Uses `@stacks/connect` for secure wallet integration:

```javascript
import { showConnect, userSession } from '@stacks/connect';

showConnect({
  appDetails: { name: 'SNOZCOIN', icon: '/logo.svg' },
  onFinish: () => {
    // User connected!
  }
});
```

### Contract Calls

Uses `@stacks/transactions` for contract interactions:

```javascript
import { openContractCall } from '@stacks/connect';
import { uintCV, principalCV } from '@stacks/transactions';

await openContractCall({
  contractAddress: 'ST...',
  contractName: 'snozcoin-tipping',
  functionName: 'tip-creator',
  functionArgs: [
    principalCV('creator-address'),
    uintCV(1000000) // 1 STX in microSTX
  ]
});
```

### Network Configuration

```javascript
const CONFIG = {
  network: 'testnet', // or 'mainnet'
  contracts: {
    tipping: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.snozcoin-tipping',
    content: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.snozcoin-content',
    rewards: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.snozcoin-rewards',
  }
};
```

---

## 🌐 Deployment

### Testnet Deployment

```bash
cd stacks-contracts

# Deploy to testnet
clarinet deployments generate --testnet
clarinet deployments apply -p deployments/testnet-plan.yaml
```

### Mainnet Deployment

```bash
# Deploy to mainnet (requires STX)
clarinet deployments generate --mainnet
clarinet deployments apply -p deployments/mainnet-plan.yaml
```

### Frontend Deployment

```bash
cd frontend
npm run build

# Deploy dist/ to your hosting:
# - Vercel: vercel deploy
# - Netlify: netlify deploy
# - IPFS: ipfs add -r dist/
```

---

## 🎨 Features

### For Creators
- 📝 Easy registration with name/bio
- 💵 Receive STX tips directly
- 🎯 Set funding goals
- 🔒 Publish unlockable content
- 📊 Track earnings and supporters
- ✅ Get verified status

### For Supporters
- 💸 Tip creators with STX
- 🔓 Purchase exclusive content
- 🏅 Earn points and badges
- 📈 Progress through tiers
- 🎁 Claim rewards
- 👥 Join creator communities

### Platform Features
- 🔐 Bitcoin-secured transactions
- ⚡ Fast confirmations (~10 minutes)
- 💹 Low fees (< $0.01 typical)
- 🌍 Global accessibility
- 📱 Mobile-responsive UI
- 🌙 Dark mode support

---

## 🛣️ Roadmap

### Phase 1: Foundation ✅
- [x] Clarity smart contracts
- [x] Comprehensive test suite
- [x] Frontend with wallet integration
- [x] Tipping system
- [x] Unlockable content
- [x] Rewards system

### Phase 2: Enhancement 🔄
- [ ] sBTC integration
- [ ] NFT creator badges
- [ ] Subscription tiers
- [ ] Creator analytics dashboard
- [ ] Mobile app (React Native)

### Phase 3: Scale 📈
- [ ] Multi-language support
- [ ] Fiat on-ramps
- [ ] Creator marketplace
- [ ] DAO governance
- [ ] Cross-chain bridges

---

## 🔒 Security

### Smart Contract Security
- Immutable contracts with clear upgrade paths
- Comprehensive error handling
- Admin functions protected by owner checks
- Reentrancy protection built into Clarity
- Auditable on-chain logic

### Frontend Security
- No private key handling
- CSP headers configured
- Input sanitization
- Secure wallet connection via @stacks/connect

---

## 🤝 Contributing

We welcome contributions! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

```bash
# Fork the repo
git clone https://github.com/yourusername/snozcoin.git

# Create a branch
git checkout -b feature/amazing-feature

# Make changes & test
npm test

# Submit PR
git push origin feature/amazing-feature
```

---

## 📄 License

MIT License - see [LICENSE](LICENSE)

---

## 🔗 Links

- **Website**: [snozcoin.io](https://snozcoin.io)
- **Documentation**: [docs.snozcoin.io](https://docs.snozcoin.io)
- **Explorer**: [explorer.stacks.co](https://explorer.stacks.co)
- **Community**: [Discord](https://discord.gg/snozcoin) | [Twitter](https://twitter.com/Elijahsnoz)

---

## 🙏 Acknowledgments

- [Stacks Foundation](https://stacks.org) - Code for STX program
- [Hiro Systems](https://hiro.so) - Developer tools
- [Clarity Language](https://clarity-lang.org) - Smart contract language

---

<div align="center">

**Built with ❤️ for creators everywhere**

*Powered by Stacks • Secured by Bitcoin*

</div>
