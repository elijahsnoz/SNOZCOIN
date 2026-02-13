# SNOZCOIN Stacks Smart Contracts

> 🚀 **SNOZCOIN creator utility platform built on Stacks (Bitcoin L2)**

This repository contains the Clarity smart contracts that power the SNOZCOIN creator economy platform. The platform enables creators to receive tips, sell exclusive content, and earn rewards — all powered by STX (Stacks) as the monetary currency and SNOZ as the non-speculative utility token.

## 📍 Contract Addresses

**Deployer:** `SP1PTBC7PP2X11N7M3K2BTF5HWRDK4J8QMGNFTEY5`

| Contract | Address |
|----------|---------|
| snoz-token | `SP1PTBC7PP2X11N7M3K2BTF5HWRDK4J8QMGNFTEY5.snoz-token` |
| snoz-rewards-engine | `SP1PTBC7PP2X11N7M3K2BTF5HWRDK4J8QMGNFTEY5.snoz-rewards-engine` |
| snoz-governance | `SP1PTBC7PP2X11N7M3K2BTF5HWRDK4J8QMGNFTEY5.snoz-governance` |
| snozcoin-tipping | `SP1PTBC7PP2X11N7M3K2BTF5HWRDK4J8QMGNFTEY5.snozcoin-tipping` |
| snozcoin-content | `SP1PTBC7PP2X11N7M3K2BTF5HWRDK4J8QMGNFTEY5.snozcoin-content` |
| snozcoin-rewards | `SP1PTBC7PP2X11N7M3K2BTF5HWRDK4J8QMGNFTEY5.snozcoin-rewards` |

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                    SNOZCOIN Platform Architecture                    │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────────────┐  │
│  │   Frontend   │───▶│ Stacks API   │───▶│  Smart Contracts     │  │
│  │  (Website)   │    │  (Hiro)      │    │  (Clarity)           │  │
│  └──────────────┘    └──────────────┘    └──────────────────────┘  │
│                                                                      │
│  Smart Contracts:                                                    │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │                                                                │  │
│  │  Core Platform (STX-based):                                   │  │
│  │  ├── snozcoin-tipping.clar    - Creator tipping (STX)        │  │
│  │  ├── snozcoin-content.clar    - Content unlocks (STX)        │  │
│  │  └── snozcoin-rewards.clar    - STX reward pools             │  │
│  │                                                                │  │
│  │  SNOZ Utility Token (Non-speculative):                        │  │
│  │  ├── snoz-token.clar          - SIP-010 utility token        │  │
│  │  ├── snoz-rewards-engine.clar - SNOZ reward distribution     │  │
│  │  └── snoz-governance.clar     - DAO preparation (future)     │  │
│  │                                                                │  │
│  └───────────────────────────────────────────────────────────────┘  │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

## 📋 Contracts Overview

### Core Platform Contracts

| Contract | Purpose | Status |
|----------|---------|--------|
| `snozcoin-tipping` | Creator tipping with STX | ✅ Production Ready |
| `snozcoin-content` | Gated content unlocks with STX | ✅ Production Ready |
| `snozcoin-rewards` | STX reward pool management | ✅ Production Ready |

### SNOZ Utility Token Contracts

| Contract | Purpose | Status |
|----------|---------|--------|
| `snoz-token` | Non-speculative utility token (SIP-010 compatible) | ✅ Production Ready |
| `snoz-rewards-engine` | SNOZ reward calculation & distribution | ✅ Production Ready |
| `snoz-governance` | DAO voting & proposals (preparation) | ✅ Ready (governance inactive) |

---

## 💰 SNOZ Utility Token

### What is SNOZ?

**SNOZ is a NON-SPECULATIVE utility token.** It has no monetary value and cannot be traded or sold. SNOZ exists solely to:

| Purpose | Description |
|---------|-------------|
| **Rewards** | Earn SNOZ for platform activity (tipping, buying content) |
| **Reputation** | Build on-chain reputation through SNOZ accumulation |
| **Governance** | Vote on platform proposals (when DAO is activated) |
| **Access Tiers** | Unlock exclusive features based on SNOZ tier level |

### ⚠️ Important Distinction

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                  │
│   STX (Stacks)                    SNOZ (Utility Token)          │
│   ═══════════                     ════════════════════          │
│   • Monetary currency             • Non-speculative             │
│   • Used for tipping              • Earned from activity        │
│   • Used for content purchases    • Used for governance         │
│   • Creator payouts in STX        • Tracks reputation           │
│   • Platform fees in STX          • Unlocks tier perks          │
│                                                                  │
│   STX = MONEY                     SNOZ = UTILITY                │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Token Specifications

```clarity
;; SNOZ Token Constants
(define-constant TOKEN_NAME "SNOZ")
(define-constant TOKEN_SYMBOL "SNOZ")
(define-constant TOKEN_DECIMALS u6)
(define-constant MAX_SUPPLY u1000000000000000) ;; 1 billion SNOZ (with 6 decimals)
```

| Property | Value |
|----------|-------|
| **Name** | SNOZ |
| **Symbol** | SNOZ |
| **Decimals** | 6 |
| **Max Supply** | 1,000,000,000 (1 billion) |
| **Initial Supply** | 0 (minted via rewards) |
| **Tradeable** | No |
| **Burnable** | Yes (by token holder) |

### Reward Rates

| Activity | SNOZ Reward | Notes |
|----------|-------------|-------|
| Tipping a creator | 2 SNOZ per STX | Both tipper and creator earn |
| Purchasing content | 3 SNOZ per STX | Buyer earns |
| Creator registration | 200 SNOZ bonus | One-time bonus |
| Monthly supporter | Variable | Based on support history |
| Creator milestone | 1,000 - 10,000 SNOZ | Based on earnings milestones |

### Tier System

| Tier | SNOZ Required | Badge | Perks |
|------|---------------|-------|-------|
| **Bronze** | 0 | 🥉 | Basic platform access |
| **Silver** | 1,000 | 🥈 | Early access to features |
| **Gold** | 10,000 | 🥇 | Priority support, exclusive badge |
| **Platinum** | 100,000 | 💎 | Governance voting rights |
| **Diamond** | 1,000,000 | 💠 | Max voting power, all perks |

---

## 🛠️ Development

### Prerequisites

- [Clarinet](https://github.com/hirosystems/clarinet) v2.0+
- Node.js 18+
- npm or yarn

### Setup

```bash
# Clone the repository
git clone https://github.com/elijahsnoz/SNOZCOIN.git
cd SNOZCOIN/stacks-contracts

# Install dependencies
npm install

# Check contracts compile
clarinet check

# Run tests
npm test
```

### Project Structure

```
stacks-contracts/
├── contracts/
│   ├── snozcoin-tipping.clar      # Creator tipping
│   ├── snozcoin-content.clar      # Content unlocks
│   ├── snozcoin-rewards.clar      # STX rewards
│   ├── snoz-token.clar            # SNOZ utility token
│   ├── snoz-rewards-engine.clar   # SNOZ distribution
│   └── snoz-governance.clar       # DAO preparation
├── tests/
│   ├── snozcoin-tipping.test.ts
│   ├── snozcoin-content.test.ts
│   ├── snozcoin-rewards.test.ts
│   ├── snoz-token.test.ts
│   ├── snoz-rewards-engine.test.ts
│   └── snoz-governance.test.ts
├── Clarinet.toml
├── package.json
└── vitest.config.js
```

### Running Tests

```bash
# Run all tests
npm test

# Run specific test file
npx vitest run tests/snoz-token.test.ts

# Run with coverage
npm test -- --coverage
```

**Current Status:** ✅ 223 tests passing across 6 contracts

---

## 📝 Contract Details

### snoz-token.clar

The main SNOZ utility token contract implementing SIP-010 compatible interface.

**Key Functions:**

```clarity
;; Read-only functions
(get-name)                         ;; Returns "SNOZ"
(get-symbol)                       ;; Returns "SNOZ"
(get-decimals)                     ;; Returns u6
(get-balance (account principal))  ;; Returns SNOZ balance
(get-total-supply)                 ;; Returns current supply

;; Public functions (admin only)
(mint (amount uint) (recipient principal))
(emergency-pause)
(emergency-unpause)

;; Public functions (user)
(transfer (amount uint) (sender principal) (recipient principal) (memo (optional (buff 34))))
(burn (amount uint))
```

**Security Features:**
- ✅ Max supply cap enforcement
- ✅ Daily mint limit (100,000 SNOZ per admin per day)
- ✅ Emergency pause capability
- ✅ Role-based access control
- ✅ Transfer freeze option

### snoz-rewards-engine.clar

Calculates and distributes SNOZ rewards based on STX activity.

**Key Functions:**

```clarity
;; Calculate rewards (read-only)
(preview-tip-reward (stx-amount uint))
(preview-content-reward (stx-amount uint))
(get-user-tier (account principal))
(get-tier-name (tier-level uint))

;; Distribute rewards (authorized contracts only)
(reward-for-tip (tipper principal) (creator principal) (stx-amount uint))
(reward-for-content-purchase (buyer principal) (creator principal) (stx-amount uint))
(reward-creator-registration (creator principal))
```

**Tier Thresholds:**

```clarity
(define-constant TIER_BRONZE u0)
(define-constant TIER_SILVER u1000000000)     ;; 1,000 SNOZ
(define-constant TIER_GOLD u10000000000)      ;; 10,000 SNOZ
(define-constant TIER_PLATINUM u100000000000) ;; 100,000 SNOZ
(define-constant TIER_DIAMOND u1000000000000) ;; 1,000,000 SNOZ
```

### snoz-governance.clar

Prepares the platform for future DAO governance.

**Note:** Governance is currently INACTIVE by design. This contract establishes the infrastructure for:
- Proposal creation and voting
- Vote delegation
- Balance snapshots for fair voting
- Council member management
- Quorum requirements

---

## 🚀 Deployment

### Testnet Deployment

```bash
# Deploy to testnet
clarinet deployments generate --testnet

# Apply deployment
clarinet deployments apply --testnet
```

### Mainnet Deployment

```bash
# Generate mainnet deployment
clarinet deployments generate --mainnet

# Review deployment plan
cat deployments/default.mainnet-plan.yaml

# Apply to mainnet (requires STX for gas)
clarinet deployments apply --mainnet
```

### Post-Deployment Checklist

1. ✅ Verify all contracts deployed
2. ✅ Set snoz-rewards-engine as authorized minter in snoz-token
3. ✅ Configure platform fee recipient
4. ✅ Test tipping flow end-to-end
5. ✅ Test content purchase flow
6. ✅ Verify SNOZ rewards are minting correctly

---

## 🔒 Security

### Audit Status

| Contract | Audit Status | Notes |
|----------|-------------|-------|
| snozcoin-tipping | 🟡 Self-audited | Pending third-party audit |
| snozcoin-content | 🟡 Self-audited | Pending third-party audit |
| snozcoin-rewards | 🟡 Self-audited | Pending third-party audit |
| snoz-token | 🟡 Self-audited | Pending third-party audit |
| snoz-rewards-engine | 🟡 Self-audited | Pending third-party audit |
| snoz-governance | 🟡 Self-audited | Governance inactive |

### Security Best Practices

- All contracts use `asserts!` for critical checks
- Admin functions protected with role-based access
- Emergency pause available for critical situations
- No external contract calls that could enable reentrancy
- Integer overflow protection via Clarity's native uint handling
- Daily mint limits prevent rapid supply inflation

---

## 📚 API Reference

See [API_INTEGRATION_GUIDE.md](../API_INTEGRATION_GUIDE.md) for frontend integration details.

### Quick Start (Frontend)

```javascript
import { 
  callReadOnlyFunction,
  makeContractCall,
  uintCV,
  principalCV 
} from '@stacks/transactions';

// Get SNOZ balance
const balance = await callReadOnlyFunction({
  contractAddress: 'SP...',
  contractName: 'snoz-token',
  functionName: 'get-balance',
  functionArgs: [principalCV(userAddress)],
  network: 'mainnet'
});

// Get user tier
const tier = await callReadOnlyFunction({
  contractAddress: 'SP...',
  contractName: 'snoz-rewards-engine',
  functionName: 'get-user-tier',
  functionArgs: [principalCV(userAddress)],
  network: 'mainnet'
});
```

---

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](../CONTRIBUTING.md) for guidelines.

### Code Style

- Use descriptive function and variable names
- Add comprehensive comments for complex logic
- Follow SIP-010 for token implementations
- Write tests for all public functions (target >90% coverage)

---

## 📄 License

MIT License - See [LICENSE](../LICENSE) for details.

---

## 🔗 Links

- **Website:** [snozcoin.xyz](https://snozcoin.xyz)
- **GitHub:** [github.com/elijahsnoz/SNOZCOIN](https://github.com/elijahsnoz/SNOZCOIN)
- **Telegram:** [t.me/snozcoin](https://t.me/snozcoin)
- **Twitter/X:** [@SnozCoin](https://x.com/SnozCoin)

---

*Built with ❤️ by the SNOZCOIN community for the Code for STX program*
