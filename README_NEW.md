# SNOZCOIN ($SNOZ) — Transparent Community Cryptocurrency

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Website](https://img.shields.io/badge/Website-snozcoin.xyz-gold)](https://snozcoin.xyz)

> **Transparent. Community-First. Developer-Focused.**
> 
> A cryptocurrency project built on honesty, real-time on-chain data, and realistic goals. No hype. No false promises. Just community building together.

---

## 🌟 Features

### ✅ Live On-Chain Data
- **Real-time metrics**: Price, Market Cap, Holders, Liquidity
- **Auto-refresh**: Updates every 60 seconds
- **Graceful fallbacks**: Shows "Not available yet" if data fails
- **Contract verification**: Direct links to blockchain explorer

### ✅ Full Transparency
- **Token supply details**: Total and circulating supply
- **Liquidity status**: Pool size and lock status
- **Ownership info**: Contract owner status (renounced or active)
- **Verifiable links**: Explorer, official listing (if any), GitHub

### ✅ Realistic Roadmap
- **Developer-focused milestones**: Website v1, Live Dashboard, Community Tools, Open Source Release
- **No financial promises**: No price predictions or guaranteed returns
- **Honest progress tracking**: Clear status indicators (Completed, In Progress, Planned, Future)

### ✅ Community Proof
- **Embedded Twitter feed**: Live updates from @elijahsnoz
- **Social links**: Telegram, X/Twitter, Instagram, YouTube
- **Clear CTA**: "Join the community to build together"
- **No bot engagement**: Real people only

### ✅ Comprehensive FAQ
- What is SNOZCOIN?
- Meme coin vs utility project?
- How to contribute as a developer?
- Financial advice disclaimer
- Contract verification guide
- "Will SNOZCOIN moon?" (Honest answer: We don't make price predictions)

### ✅ SEO & Meta Tags
- **Open Graph tags**: For social sharing
- **Twitter Cards**: Enhanced Twitter previews
- **Structured data**: JSON-LD organization schema
- **Optimized meta descriptions**

### ✅ Professional UI/UX
- **Clean, minimal design**: Non-scammy aesthetic
- **Mobile responsive**: Works on all devices
- **Smooth animations**: Subtle, not aggressive
- **Accessibility**: Proper semantic HTML, ARIA labels

---

## 🚀 Quick Start

### Prerequisites
- Modern web browser (Chrome, Firefox, Safari, Edge)
- Text editor (VS Code recommended)
- Python 3 (for local server)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/elijahsnoz/snozcoin.git
   cd snozcoin
   ```

2. **Configure your token data**
   
   Open `js/main.js` and update the `CONFIG` object:
   ```javascript
      const CONFIG = {
         contractAddress: 'YOUR_CONTRACT_ADDRESS_HERE',
         explorerUrl: 'https://solscan.io/token/', // Or your chain's explorer
         // listingUrl: 'https://your-listing.example.com',
         fallbackMarketCap: 3900, // Current market cap
      };
   ```

3. **Integrate Live APIs** (Optional but recommended)
   
   See [API_INTEGRATION_GUIDE.md](./API_INTEGRATION_GUIDE.md) for detailed instructions.

4. **Build for production**
   ```bash
   chmod +x build.sh
   ./build.sh
   ```

5. **Preview locally**
   ```bash
   python3 -m http.server --directory dist 8001 --bind 127.0.0.1
   # Open http://127.0.0.1:8001 in your browser
   ```

---

## 📂 Project Structure

```
snozcoin/
├── index.html              # Main website (all sections)
├── css/
│   └── style.css          # Styles (theme, responsive, components)
├── js/
│   └── main.js            # JavaScript (API fetching, UI interactions)
├── assets/
│   ├── SNOZCOIN.png       # Logo (original)
│   ├── SNOZCOIN-*.png     # Resized variants
│   ├── SNOZCOIN-*.webp    # WebP versions (performance)
│   ├── whitepaper.html    # Whitepaper source
│   └── SNOZCOIN_whitepaper.pdf  # Generated PDF
├── scripts/
│   ├── generate_whitepaper_pdf.py  # PDF generator (ReportLab)
│   └── generate_whitepaper_pdf.sh  # Shell version
├── dist/                  # Production build (generated)
├── build.sh              # Build script
├── DEPLOY.md             # Deployment instructions
├── API_INTEGRATION_GUIDE.md  # API setup guide
└── README.md             # This file
```

---

## 🔧 Configuration

### Update Contract Address

**File:** `js/main.js`

```javascript
const CONFIG = {
  contractAddress: 'YOUR_CONTRACT_ADDRESS_HERE',
  explorerUrl: 'https://solscan.io/token/',
   // listingUrl: 'https://your-listing.example.com',
  fallbackMarketCap: 3900,
  refreshInterval: 60000, // 60 seconds
  telegramGroup: 'snozcoin',
};
```

### Integrate Live APIs

See [API_INTEGRATION_GUIDE.md](./API_INTEGRATION_GUIDE.md) for options:
- **DexScreener** (recommended, free, no key)
- **Helius** (Solana, holder count, requires key)
- **Moralis** (multi-chain, requires key)
- **CoinGecko** (if listed, free tier)

---

## 🌐 Deployment

### Option 1: GitHub Pages

```bash
cd dist
git init
git add -A
git commit -m "Deploy to GitHub Pages"
git branch -M gh-pages
git remote add origin https://github.com/elijahsnoz/snozcoin.git
git push -f origin gh-pages
```

Then enable GitHub Pages in repository settings (branch: gh-pages, root).

### Option 2: Netlify / Vercel

See [DEPLOY.md](./DEPLOY.md) for detailed deployment instructions.

---

## 🛠️ Development

### Local Development Server

```bash
# Serve from root (development)
python3 -m http.server 8000 --bind 127.0.0.1

# Or serve from dist (production preview)
python3 -m http.server --directory dist 8001 --bind 127.0.0.1
```

### Making Changes

1. Edit `index.html`, `css/style.css`, or `js/main.js`
2. Test locally
3. Run `./build.sh` to rebuild `dist/`
4. Deploy updated `dist/` folder

---

## 🤝 Contributing

We welcome contributions! See our contribution guidelines above.

---

## ⚠️ Disclaimer

**This is not financial advice.**

Cryptocurrency investments carry significant risk. You could lose all your invested capital. Always conduct your own research (DYOR) and consult with a qualified financial advisor before making any investment decisions.

---

## 📞 Contact & Community

- **Telegram**: [t.me/snozcoin](https://t.me/snozcoin)
- **X/Twitter**: [@elijahsnoz](https://x.com/elijahsnoz)
- **Instagram**: [@elijahsnoz](https://instagram.com/elijahsnoz)
- **YouTube**: [@ELIJAHSNOZ](https://youtube.com/@ELIJAHSNOZ)
- **GitHub**: [github.com/elijahsnoz/snozcoin](https://github.com/elijahsnoz/snozcoin)

---

**Built with transparency and honesty by the SNOZCOIN community.**

*Last updated: December 2025*
