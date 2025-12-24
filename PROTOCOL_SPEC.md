# Post-Money Value Protocol (PMVP) — Specification

Version: 0.1 (reference)

This document specifies the Post-Money Value Protocol (PMVP). PMVP is a minimal, open, scarcity-oriented protocol for transferring abstract units of value under deterministic rules. It is a protocol-first system: rule-set + reference implementation.

Core principles
- No central control: no admin accounts, no privileged users, no owner after launch.
- Post-money design: no currency symbols, no prices, no fiat integration. Value is an abstract integer unit.
- Protocol-first: anybody can run an instance or node. Open-source by default.
- Non-custodial: users control keys. The protocol never holds user secrets.

Chosen value origin
- Scarcity-based issuance enforced by proof-of-work (PoW) mining and a hard cap issuance schedule. This choice aligns with the intent to be inspired by Bitcoin-like permissionless issuance.

Data model
- Keys: secp256k1 public/private keypairs. Addresses are the SHA256(hex(pubkey)) truncated representation (protocol identifier, no currency symbol).
- Transaction (tx): { inputs[], outputs[], timestamp }
  - input: { txid, index, sig, pubkey }
  - output: { amount (integer units), pubkey_hash }
  - txid = SHA256(serialized_tx)
- UTXO set: map(txid:index) -> {amount, pubkey_hash}
- Block: { header, txs[] }
  - header: { prev_hash, merkle_root, timestamp, nonce, difficulty }
  - block_hash = SHA256(serialized_header)

Consensus & issuance
- Mining (PoW): miners find nonce such that block_hash < target (target derived from difficulty). Reference uses simple leading-zero difficulty for local testing.
- Issuance schedule: block reward starts at REWARD_INITIAL and halves every HALVING_INTERVAL blocks until minimum unit reached. New units are issued via coinbase transaction to the miner's pubkey_hash in each mined block. No pre-mine, no owner allocations.

Validation rules (deterministic)
- Transaction validity:
  - All inputs reference unspent outputs in the current UTXO set (or in-block unspent outputs earlier in this block)
  - Signatures verify: sig verifies over tx body with the provided pubkey and matches referenced output pubkey_hash
  - sum(inputs) >= sum(outputs) (leftover is miner fee)
  - amounts are non-negative integers
- Block validity:
  - prev_hash references known block (or genesis)
  - timestamp not too far in future (configurable)
  - proof-of-work: hash(header) < target
  - merkle_root matches included txs
  - coinbase tx present and its output amount <= allowed issuance + collected fees

Networking & node model (reference)
- Simple HTTP API for demo: /chain, /tx, /mine, /balance/<address>, /new_wallet. Peer sync done via POST /peer for simplicity in the reference.
- Storage: append-only block file and UTXO snapshot file for fast verification. Implementations may choose other storage but must preserve semantic rules.

Security & attack model
- Sybil & 51%: PoW reduces sybil; protocol documents risk and mitigations (economic cost to attack).
- Double-spend: resolved by canonical chain with highest cumulative PoW (longest chain by PoW metric).
- DoS: mempool limits, tx size limits, simple rate limiting recommended.

Upgrade & governance
- No centralized upgrade path. Nodes may implement feature flags and soft-fork mechanics by adoption thresholds. All changes are client-controlled.

Privacy
- Ledger is public and pseudonymous. No KYC or profiling in protocol.

API & wire formats
- JSON used in the reference implementation for clarity. Production nodes may use binary compact formats.
- Example tx JSON and HTTP endpoints are provided in the reference README.

This specification is intentionally compact and conservative: the goal is a minimal, auditable, and conceptually simple protocol. See `reference/README.md` for running the reference node and examples.
