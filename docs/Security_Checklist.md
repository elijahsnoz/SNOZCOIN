# PMVP Reference — Security checklist

This checklist highlights security considerations for anyone using or building on the PMVP reference node.

- Key management
  - Keep private keys offline where possible.
  - Use hardware wallets for large-value transfers in production.

- Consensus assumptions
  - PoW: economic cost to mine prevents trivial 51% attack; quantify cost for your target difficulty.
  - Monitor hashrate distribution and publish metrics.

- Input validation
  - Enforce strict size limits on transactions, block headers, and request bodies.
  - Rate-limit API endpoints.

- DoS & resource exhaustion
  - Limit mempool size and reject extremely large or complex transactions.
  - Add connection and request rate limiting at the network edge.

- Determinism & consensus parity
  - Ensure all nodes use identical serialization and hashing routines.
  - Include test vectors (genesis, example txs, block headers) in tests.

- Privacy
  - Ledger is public and pseudonymous. Be explicit about data retention and auditing.

- Key signing
  - Use deterministic signatures (RFC6979) to avoid leaking entropy.

- Operational
  - Back up chain data and keys regularly.
  - Run automated health checks and alerting for forks and sync issues.

- Software supply chain
  - Pin dependency versions and verify checksums for binaries.

This document is a starting point; expand it per your deployment model.
