# SNOZCOIN Swap - Deployment Checklist

## Pre-Deployment

### Code Review

- [ ] All console.log statements removed or replaced with proper logging
- [ ] No hardcoded API keys in source code
- [ ] Error messages don't leak sensitive information
- [ ] TypeScript strict mode passes (`npm run type-check`)
- [ ] ESLint passes with no errors (`npm run lint`)

### Security Audit

- [ ] Completed `SECURITY_CHECKLIST.md` review
- [ ] Token mints are hardcoded and verified
- [ ] No private keys or mnemonics in codebase
- [ ] CORS and CSP headers configured

### Testing

- [ ] All manual tests passed on mainnet with small amounts
- [ ] Tested on Phantom, Solflare, and Backpack wallets
- [ ] Tested on mobile browsers
- [ ] Error scenarios tested (network failure, wallet rejection, etc.)

---

## Environment Setup

### Production Environment Variables

Create `.env.production`:

```env
# Production RPC (REQUIRED - do NOT use public RPC)
NEXT_PUBLIC_SOLANA_RPC_URL=https://mainnet.helius-rpc.com/?api-key=YOUR_KEY

# Jupiter API
NEXT_PUBLIC_JUPITER_API_URL=https://quote-api.jup.ag/v6
```

### RPC Provider Setup

1. Sign up for Helius/QuickNode/Alchemy
2. Create Solana mainnet endpoint
3. Configure rate limiting alerts
4. Set up usage monitoring

---

## Deployment Options

### Option 1: Vercel (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
cd swap
vercel

# Set environment variables in Vercel dashboard
```

**Vercel Dashboard:**
1. Go to Project Settings → Environment Variables
2. Add `NEXT_PUBLIC_SOLANA_RPC_URL`
3. Add `NEXT_PUBLIC_JUPITER_API_URL`

### Option 2: Static Export to Existing Site

```bash
# Build static export
npm run build

# Output is in 'out' folder
# Upload to your hosting provider
```

Modify `next.config.js` for static export:

```javascript
const nextConfig = {
  output: 'export',
  // ... rest of config
};
```

### Option 3: Docker

Create `Dockerfile`:

```dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:18-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
EXPOSE 3000
CMD ["node", "server.js"]
```

```bash
docker build -t snozcoin-swap .
docker run -p 3000:3000 snozcoin-swap
```

---

## DNS & SSL

### Custom Domain Setup

1. Add domain in hosting provider
2. Configure DNS:
   - A record: `swap.snozcoin.xyz` → hosting IP
   - Or CNAME: `swap.snozcoin.xyz` → vercel deployment URL

3. Enable SSL (automatic on Vercel/Netlify)

### Recommended Headers

Add to `next.config.js`:

```javascript
async headers() {
  return [
    {
      source: '/:path*',
      headers: [
        { key: 'X-Frame-Options', value: 'DENY' },
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
      ],
    },
  ];
}
```

---

## Post-Deployment

### Monitoring

- [ ] Set up uptime monitoring (UptimeRobot, Pingdom)
- [ ] Configure error tracking (Sentry)
- [ ] Set up RPC usage alerts
- [ ] Monitor Jupiter API status

### Analytics (Optional)

- [ ] Add privacy-respecting analytics (Plausible, Fathom)
- [ ] Track swap volume (via on-chain data, not user data)

### Maintenance

- [ ] Document deployment process
- [ ] Set up CI/CD for automatic deployments
- [ ] Create runbook for common issues
- [ ] Schedule regular dependency updates

---

## Rollback Plan

1. Keep previous deployment URL/version
2. Document rollback command:
   ```bash
   vercel rollback [deployment-url]
   ```
3. Test rollback in staging first

---

## Go-Live Checklist

- [ ] Final review of all above items
- [ ] Team notified of deployment
- [ ] Social media announcement prepared
- [ ] Support channels ready
- [ ] Execute deployment
- [ ] Smoke test on production
- [ ] Monitor for first 24 hours
