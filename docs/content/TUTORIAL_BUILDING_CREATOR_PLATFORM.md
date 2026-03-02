# Building a Creator Platform on Bitcoin: A Complete Guide

*A tutorial on building SNOZCOIN with Clarity smart contracts on Stacks*

![SNOZCOIN Banner](../assets/SNOZCOIN-512.png)

## Table of Contents
1. [Introduction](#introduction)
2. [Why Bitcoin L2?](#why-bitcoin-l2)
3. [Project Architecture](#project-architecture)
4. [Smart Contract Development](#smart-contract-development)
5. [Frontend Integration](#frontend-integration)
6. [Testing](#testing)
7. [Deployment](#deployment)
8. [Lessons Learned](#lessons-learned)

---

## Introduction

This tutorial walks through building SNOZCOIN, a creator monetization platform on Stacks (Bitcoin L2). By the end, you'll understand how to:

- Write Clarity smart contracts for tokens, tipping, and content
- Integrate with Stacks wallets (Leather, Xverse)
- Build a responsive frontend that interacts with the blockchain
- Test thoroughly with Clarinet

**Prerequisites:**
- Basic JavaScript knowledge
- Familiarity with blockchain concepts
- Node.js installed
- [Clarinet](https://github.com/hirosystems/clarinet) installed

---

## Why Bitcoin L2?

### The Problem with Current Creator Platforms

| Platform | Fee | Payout Time | Ownership |
|----------|-----|-------------|-----------|
| Patreon | 5-12% | 30+ days | None |
| YouTube | 45% | 30+ days | None |
| OnlyFans | 20% | 21 days | None |
| **SNOZCOIN** | **5%** | **Instant** | **Full** |

### Why Stacks?

1. **Bitcoin Security**: Transactions settle to Bitcoin
2. **Low Fees**: $0.01-0.10 per transaction
3. **Clarity Language**: Predictable, secure smart contracts
4. **Growing Ecosystem**: sBTC, Nakamoto upgrade coming

---

## Project Architecture

```
SNOZCOIN/
├── stacks-contracts/
│   ├── contracts/
│   │   ├── snoz-token.clar          # SIP-010 token
│   │   ├── snoz-rewards-engine.clar # Reward distribution
│   │   ├── snoz-governance.clar     # Voting system
│   │   ├── snozcoin-tipping.clar    # Direct tips
│   │   ├── snozcoin-content.clar    # Unlockable content
│   │   └── snozcoin-rewards.clar    # Reward calculations
│   └── tests/                        # Vitest + Clarinet SDK
├── js/
│   ├── snoz-stacks.js               # Wallet integration
│   └── ui-components.js             # UI helpers
├── css/
│   └── style.css                    # Styling
└── index.html                        # Main app
```

---

## Smart Contract Development

### 1. Token Contract (snoz-token.clar)

The SNOZ token follows the SIP-010 standard:

```clarity
;; Define the token
(define-fungible-token snoz u1000000000000000)

;; SIP-010 trait implementation
(define-public (transfer (amount uint) (sender principal) (recipient principal) (memo (optional (buff 34))))
  (begin
    (asserts! (is-eq tx-sender sender) (err u1))
    (try! (ft-transfer? snoz amount sender recipient))
    (match memo to-print (print to-print) 0x)
    (ok true)
  )
)

(define-read-only (get-balance (account principal))
  (ok (ft-get-balance snoz account))
)
```

**Key Insight**: Clarity's `define-fungible-token` handles all supply tracking. No need for manual balance mapping.

### 2. Tipping Contract (snozcoin-tipping.clar)

```clarity
;; Send a tip from fan to creator
(define-public (tip-creator (creator principal) (amount uint))
  (let
    (
      (platform-fee (/ (* amount u5) u100))  ;; 5% fee
      (creator-amount (- amount platform-fee))
    )
    ;; Transfer to creator
    (try! (stx-transfer? creator-amount tx-sender creator))
    ;; Transfer fee to platform
    (try! (stx-transfer? platform-fee tx-sender (var-get platform-address)))
    ;; Emit event
    (print {event: "tip", from: tx-sender, to: creator, amount: amount})
    (ok true)
  )
)
```

**Key Insight**: `stx-transfer?` is atomic. Both transfers succeed or the entire transaction reverts.

### 3. Content Contract (snozcoin-content.clar)

```clarity
;; Content storage
(define-map content-items
  {content-id: uint}
  {
    creator: principal,
    price: uint,
    content-hash: (buff 32),
    active: bool
  }
)

;; Purchase tracking
(define-map content-purchases
  {content-id: uint, buyer: principal}
  {purchased-at: uint}
)

;; Buy content
(define-public (purchase-content (content-id uint))
  (let
    (
      (content (unwrap! (map-get? content-items {content-id: content-id}) (err u404)))
      (price (get price content))
      (creator (get creator content))
    )
    ;; Check not already purchased
    (asserts! (is-none (map-get? content-purchases {content-id: content-id, buyer: tx-sender})) (err u409))
    ;; Transfer payment
    (try! (stx-transfer? price tx-sender creator))
    ;; Record purchase
    (map-set content-purchases
      {content-id: content-id, buyer: tx-sender}
      {purchased-at: block-height}
    )
    (ok true)
  )
)

;; Check access
(define-read-only (has-access (content-id uint) (user principal))
  (is-some (map-get? content-purchases {content-id: content-id, buyer: user}))
)
```

**Key Insight**: Access control is a simple map lookup. No complex permission systems needed.

---

## Frontend Integration

### Wallet Connection

```javascript
// snoz-stacks.js

async function connectWallet() {
  // Try Leather wallet first
  if (window.LeatherProvider) {
    const response = await window.LeatherProvider.request('getAddresses');
    const address = response.result.addresses.find(a => a.symbol === 'STX');
    return address?.address;
  }
  
  // Fallback to Xverse
  if (window.XverseProviders) {
    const response = await window.XverseProviders.request('stx_requestAccounts');
    return response.result.addresses[0]?.address;
  }
  
  // No wallet found
  throw new Error('Please install Leather or Xverse wallet');
}
```

### Reading Contract Data

```javascript
async function getSnozBalance(address) {
  const response = await fetch(
    `https://api.mainnet.hiro.so/v2/contracts/call-read/${CONTRACT_ADDRESS}/snoz-token/get-balance`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sender: address,
        arguments: [cvToHex(principalCV(address))]
      })
    }
  );
  
  const data = await response.json();
  return cvToValue(hexToCV(data.result));
}
```

### Sending Transactions

```javascript
async function tipCreator(creatorAddress, amountSTX) {
  const txOptions = {
    contractAddress: 'SP1PTBC7PP2X11N7M3K2BTF5HWRDK4J8QMGNFTEY5',
    contractName: 'snozcoin-tipping',
    functionName: 'tip-creator',
    functionArgs: [
      principalCV(creatorAddress),
      uintCV(amountSTX * 1000000) // Convert to microSTX
    ],
    postConditionMode: PostConditionMode.Deny,
    postConditions: [
      makeStandardSTXPostCondition(
        senderAddress,
        FungibleConditionCode.Equal,
        amountSTX * 1000000
      )
    ]
  };
  
  const response = await openContractCall(txOptions);
  return response.txId;
}
```

---

## Testing

### Setup with Clarinet

```bash
# Install Clarinet
brew install clarinet

# Create new project
clarinet new my-project
cd my-project

# Run tests
clarinet test
```

### Writing Tests

```typescript
// tests/snozcoin-tipping.test.ts
import { describe, it, expect } from 'vitest';
import { Cl } from '@stacks/transactions';

describe('Tipping Contract', () => {
  it('should transfer tip to creator', async () => {
    const creator = 'ST1CREATOR...';
    const tipper = 'ST1TIPPER...';
    const amount = 1000000; // 1 STX
    
    const result = await simnet.callPublicFn(
      'snozcoin-tipping',
      'tip-creator',
      [Cl.principal(creator), Cl.uint(amount)],
      tipper
    );
    
    expect(result.result).toBeOk(Cl.bool(true));
    
    // Check creator received 95% (after 5% fee)
    const creatorBalance = simnet.getAssetsMap().get('STX')?.get(creator);
    expect(creatorBalance).toBe(950000n);
  });
  
  it('should fail with insufficient balance', async () => {
    const result = await simnet.callPublicFn(
      'snozcoin-tipping',
      'tip-creator',
      [Cl.principal(creator), Cl.uint(9999999999999)],
      tipper
    );
    
    expect(result.result).toBeErr();
  });
});
```

### Our Test Results

```
✓ tests/snoz-token.test.ts (45)
✓ tests/snoz-governance.test.ts (41)
✓ tests/snoz-rewards-engine.test.ts (40)
✓ tests/snozcoin-rewards.test.ts (38)
✓ tests/snozcoin-tipping.test.ts (31)
✓ tests/snozcoin-content.test.ts (28)

Test Files  6 passed (6)
     Tests  223 passed (223)
```

---

## Deployment

### 1. Testnet Deployment

```bash
# Deploy to testnet
clarinet deployments generate --testnet

# Apply deployment
clarinet deployments apply --testnet
```

### 2. Mainnet Deployment

```bash
# Generate mainnet deployment plan
clarinet deployments generate --mainnet

# Review the plan carefully!
cat deployments/default.mainnet-plan.yaml

# Deploy (requires STX for gas)
clarinet deployments apply --mainnet
```

### 3. Verify on Explorer

Visit: `https://explorer.stacks.co/txid/YOUR_TX_ID`

---

## Lessons Learned

### 1. Start with Tests
Write tests before contracts. Clarinet's simnet makes this easy.

### 2. Keep Contracts Simple
Each contract should do ONE thing well. We split into 6 contracts instead of 1 monolith.

### 3. Use Post-Conditions
Always use post-conditions to prevent unexpected token transfers. Users will thank you.

### 4. Handle Wallet Variations
Different wallets have different APIs. Build an abstraction layer.

### 5. Build in Public
Sharing progress on Twitter got us early users and feedback.

---

## Resources

- **SNOZCOIN GitHub**: [github.com/elijahsnoz/SNOZCOIN](https://github.com/elijahsnoz/SNOZCOIN)
- **Clarity Documentation**: [docs.stacks.co/clarity](https://docs.stacks.co/clarity)
- **Clarinet Docs**: [docs.hiro.so/clarinet](https://docs.hiro.so/clarinet)
- **Stacks.js**: [github.com/hirosystems/stacks.js](https://github.com/hirosystems/stacks.js)

---

## About the Author

Building SNOZCOIN to empower creators with Bitcoin-secured payments. Follow the journey:

- Twitter: [@SnozCoin](https://x.com/SnozCoin)
- Telegram: [t.me/snozcoin](https://t.me/snozcoin)
- Website: [snozcoin.xyz](https://snozcoin.xyz)

---

*If this tutorial helped you, star the repo and share with other builders!* ⭐
