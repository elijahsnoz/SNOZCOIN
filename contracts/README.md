# SNOZCOIN Smart Contracts

Smart contracts for storing user profiles on the Stacks blockchain with Bitcoin security.

## Contract: `snozcoin-profiles.clar`

Stores user profile data including:
- Username (unique, 3-20 characters)
- Country code (3 characters)
- User type (creator, supporter, corporate, investor)
- Avatar seed (for generating unique avatars)
- IPFS hash (optional, for extended profile data)
- Timestamps (created, updated)
- Verification status

## Quick Start

### Prerequisites

1. **Install Clarinet** (Stacks development tool):
   ```bash
   # macOS
   brew install clarinet
   
   # Or download from: https://github.com/hirosystems/clarinet/releases
   ```

2. **Get a Hiro Wallet**:
   - Download: https://wallet.hiro.so/
   - Create wallet and save your seed phrase
   - Switch to Testnet in settings

3. **Get Testnet STX**:
   - Go to: https://explorer.hiro.so/sandbox/faucet?chain=testnet
   - Enter your testnet address (starts with `ST`)
   - Request test tokens

### Test the Contract Locally

```bash
cd contracts

# Check contract syntax
clarinet check

# Run tests
clarinet test

# Open interactive console
clarinet console
```

### In Clarinet Console

```clarity
;; Register a profile
(contract-call? .snozcoin-profiles register-profile "myusername" "US" u1 "avatar-seed-123")

;; Get a profile
(contract-call? .snozcoin-profiles get-profile tx-sender)

;; Check if username is available
(contract-call? .snozcoin-profiles is-username-available "newuser")

;; Get total users
(contract-call? .snozcoin-profiles get-total-users)
```

### Deploy to Testnet

#### Option 1: Using Hiro Platform (Recommended)

1. Go to https://platform.hiro.so/
2. Create account and new project
3. Upload `snozcoin-profiles.clar`
4. Deploy to testnet
5. Copy the contract address

#### Option 2: Using Clarinet

1. Create `.env` file from `.env.example`:
   ```bash
   cp .env.example .env
   ```

2. Add your mnemonic and address to `.env`

3. Deploy:
   ```bash
   clarinet deployments generate --testnet
   clarinet deployments apply -p deployments/default.testnet.yaml
   ```

### After Deployment

1. Copy your contract address (format: `ST...your-address.snozcoin-profiles`)

2. Update `js/stacks-profile-contract.js`:
   ```javascript
   const CONTRACT_ADDRESS = 'ST_YOUR_DEPLOYED_ADDRESS';
   ```

3. Verify on explorer:
   - Testnet: https://explorer.hiro.so/?chain=testnet
   - Search for your contract address

## Contract Functions

### Read-Only (Free)

| Function | Description |
|----------|-------------|
| `get-profile` | Get profile by wallet address |
| `get-address-by-username` | Get wallet address by username |
| `is-username-available` | Check if username is taken |
| `has-profile` | Check if wallet has a profile |
| `get-total-users` | Get total registered users |

### Public (Costs STX)

| Function | Description | Cost |
|----------|-------------|------|
| `register-profile` | Create new profile | ~0.01 STX |
| `update-profile` | Update profile data | ~0.005 STX |
| `update-ipfs-hash` | Update IPFS hash | ~0.003 STX |

### Admin Only

| Function | Description |
|----------|-------------|
| `verify-user` | Mark user as verified |
| `unverify-user` | Remove verification |
| `pause-contract` | Pause all operations |
| `unpause-contract` | Resume operations |

## User Types

| Type | Value | Description |
|------|-------|-------------|
| Creator | 1 | Artists, musicians, producers |
| Supporter | 2 | Fans, music lovers |
| Corporate | 3 | Labels, businesses |
| Investor | 4 | VCs, angel investors |

## Error Codes

| Code | Meaning |
|------|---------|
| u100 | Not authorized |
| u101 | Profile already exists |
| u102 | Profile not found |
| u103 | Invalid username |
| u104 | Username taken |
| u105 | Invalid user type |

## Frontend Integration

Include the JavaScript helper in your HTML:

```html
<script src="js/stacks-profile-contract.js"></script>
<script src="https://unpkg.com/@stacks/connect@7.7.1/dist/umd/index.js"></script>

<script>
  // Initialize contract
  const contract = new SnozProfileContract('testnet');
  
  // Check username
  const available = await contract.isUsernameAvailable('newuser');
  
  // Get profile
  const profile = await contract.getProfile('ST...');
  
  // Register profile (requires Hiro Wallet)
  const txOptions = contract.getRegisterProfileTxOptions(
    'username',
    'US', 
    'creator',
    'avatar-seed',
    (result) => console.log('Success:', result),
    () => console.log('Cancelled')
  );
  
  // Call with @stacks/connect
  StacksConnect.openContractCall(txOptions);
</script>
```

## Security

- Contract owner is set at deployment (deployer address)
- Only profile owner can update their profile
- Usernames are unique and cannot be changed
- Contract can be paused by owner in emergencies
- All data is stored on Stacks blockchain (Bitcoin-secured)

## Support

- Stacks Documentation: https://docs.stacks.co/
- Clarity Language: https://docs.stacks.co/clarity
- Hiro Developer Tools: https://www.hiro.so/developers
