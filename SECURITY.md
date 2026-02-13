# Security Policy

## 🔐 Security Overview

SNOZCOIN takes security seriously. This document outlines our security practices and how to report vulnerabilities.

---

## ✅ Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |
| < 1.0   | :x:                |

---

## 🛡️ Smart Contract Security

### Security Features Implemented

| Feature | Status | Description |
|---------|--------|-------------|
| Access Control | ✅ | Admin-only functions protected |
| Input Validation | ✅ | All inputs validated before processing |
| Overflow Protection | ✅ | Arithmetic operations checked for overflow |
| Reentrancy Guards | ✅ | State updated before external calls |
| Rate Limiting | ✅ | Rewards capped to prevent abuse |
| Emergency Pause | ✅ | Admin can pause contracts if needed |

### Contract Validation

All smart contracts pass Clarinet validation:

```bash
clarinet check
# ✔ 6 contracts checked
```

### Test Coverage

- **223 tests** covering all contract functionality
- Unit tests for each public function
- Edge case testing
- Access control verification

---

## 🔍 Audit Status

| Audit Type | Status | Date |
|------------|--------|------|
| Internal Review | ✅ Complete | February 2026 |
| Automated Analysis | ✅ Complete | February 2026 |
| External Audit | ⏳ Pending | TBD |

> ⚠️ **Note**: While contracts have passed internal review and automated checks, a professional third-party audit is pending. Use on mainnet at your own risk.

---

## 🚨 Reporting a Vulnerability

We take all security vulnerabilities seriously. If you discover a security issue, please report it responsibly.

### How to Report

1. **DO NOT** create a public GitHub issue for security vulnerabilities
2. Email security concerns to: **security@snozcoin.com**
3. Include the following information:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

### What to Expect

| Timeline | Action |
|----------|--------|
| 24 hours | Acknowledgment of your report |
| 72 hours | Initial assessment and response |
| 7 days | Detailed plan for addressing the issue |
| 30 days | Fix deployed (for valid vulnerabilities) |

### Bug Bounty

We are planning a bug bounty program. Details will be announced after mainnet launch.

---

## 🔒 Best Practices for Users

### Wallet Security

- ✅ Only use official wallets (Leather, Xverse)
- ✅ Never share your seed phrase
- ✅ Verify contract addresses before signing
- ✅ Start with small test transactions

### Verifying Contracts

Always verify contract addresses on the Stacks Explorer:
- [explorer.stacks.co](https://explorer.stacks.co)

### Official Links

| Resource | Official URL |
|----------|--------------|
| Website | https://snozcoin.com |
| GitHub | https://github.com/elijahsnoz/SNOZCOIN |
| Documentation | README_STACKS.md |

---

## 📋 Security Checklist

### For Contract Development
- [x] Use Clarity version 3 with epoch 3.1
- [x] All public functions have access control
- [x] Arithmetic operations prevent overflow
- [x] State is updated before external calls
- [x] All inputs are validated
- [x] Comprehensive test coverage

### For Deployment
- [ ] Professional security audit
- [ ] Testnet deployment and testing
- [ ] Community review period
- [ ] Staged mainnet rollout

---

## 🏆 Acknowledgments

We thank the following for their security contributions:

- Hiro Systems (Clarinet tooling)
- Stacks Foundation (Clarity language)
- Security researchers (to be listed)

---

## 📞 Contact

- **Security Email**: security@snozcoin.com
- **General Inquiries**: hello@snozcoin.com
- **GitHub**: [github.com/elijahsnoz/SNOZCOIN](https://github.com/elijahsnoz/SNOZCOIN)

---

<div align="center">

**Security is our priority**

Last Updated: February 2026

</div>
