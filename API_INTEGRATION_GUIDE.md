# API Integration Guide for SNOZCOIN Website

This guide explains how to integrate real on-chain data APIs into your SNOZCOIN website.

## 🔧 Quick Start

### 1. Update Configuration

Open `js/main.js` and update the `CONFIG` object:

```javascript
const CONFIG = {
  // Your actual Solana/Ethereum token contract address
  contractAddress: 'YOUR_ACTUAL_CONTRACT_ADDRESS',
  
  // Blockchain explorer URL
  explorerUrl: 'https://solscan.io/token/', // For Solana
  // explorerUrl: 'https://etherscan.io/token/', // For Ethereum
  
  // pump.fun page (if applicable)
  pumpFunUrl: 'https://pump.fun/YOUR_TOKEN_ID',
  
  // Current market cap (used as fallback)
  fallbackMarketCap: 3900,
};
```

### 2. Choose Your Data Source

The website supports multiple API options:

## 📊 API Options

### Option 1: DexScreener API (Recommended - Free, No API Key)

**Best for:** Tokens listed on DEXs (Uniswap, Raydium, PancakeSwap, etc.)

**Endpoint:**
```
GET https://api.dexscreener.com/latest/dex/tokens/{tokenAddress}
```

**Integration in `main.js`:**
```javascript
async function fetchTokenData() {
  try {
    const response = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${CONFIG.contractAddress}`);
    const data = await response.json();
    
    const pair = data.pairs && data.pairs[0]; // First trading pair
    if (!pair) throw new Error('No trading pairs found');
    
    return {
      price: parseFloat(pair.priceUsd),
      marketCap: parseFloat(pair.fdv) || parseFloat(pair.marketCap),
      liquidity: parseFloat(pair.liquidity?.usd),
      holders: null, // DexScreener doesn't provide holder count
    };
  } catch (error) {
    console.error('Error:', error);
    return null;
  }
}
```

**Pros:**
- ✅ Free, no API key required
- ✅ Real-time price and liquidity data
- ✅ Supports multiple chains (Solana, Ethereum, BSC, etc.)
- ✅ Simple REST API

**Cons:**
- ❌ Doesn't provide holder count
- ❌ Rate limits (but generous for personal use)

---

### Option 2: Helius API (Solana - Best for Complete Data)

**Best for:** Solana tokens, detailed on-chain analytics

**Setup:**
1. Sign up at https://helius.dev (free tier available)
2. Get your API key
3. Use their enhanced RPC and DAS API

**Integration:**
```javascript
const HELIUS_API_KEY = 'your-api-key-here';

async function fetchTokenData() {
  try {
    // Get token metadata
    const metadataUrl = `https://api.helius.xyz/v0/token-metadata?api-key=${HELIUS_API_KEY}`;
    const metadataResponse = await fetch(metadataUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        mintAccounts: [CONFIG.contractAddress]
      })
    });
    const metadata = await metadataResponse.json();
    
    // Get holder count using DAS API
    const holderUrl = `https://mainnet.helius-rpc.com/?api-key=${HELIUS_API_KEY}`;
    const holderResponse = await fetch(holderUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 'holder-count',
        method: 'getTokenLargestAccounts',
        params: [CONFIG.contractAddress]
      })
    });
    const holderData = await holderResponse.json();
    
    return {
      price: null, // Combine with DexScreener for price
      marketCap: null,
      liquidity: null,
      holders: holderData.result?.value?.length || null,
      totalSupply: metadata[0]?.supply,
    };
  } catch (error) {
    console.error('Error:', error);
    return null;
  }
}
```

**Pros:**
- ✅ Comprehensive Solana data
- ✅ Holder count available
- ✅ Token metadata
- ✅ Free tier available

**Cons:**
- ❌ Requires API key
- ❌ Solana only
- ❌ Doesn't provide price directly (need to combine with DexScreener)

---

### Option 3: CoinGecko/CoinMarketCap API

**Best for:** Tokens listed on major CEXs or well-known DEXs

**CoinGecko (Free Tier):**
```javascript
async function fetchTokenData() {
  try {
    // First, find your token's CoinGecko ID
    const coinId = 'your-coin-id'; // e.g., 'bitcoin', 'ethereum'
    
    const response = await fetch(`https://api.coingecko.com/api/v3/coins/${coinId}`);
    const data = await response.json();
    
    return {
      price: data.market_data.current_price.usd,
      marketCap: data.market_data.market_cap.usd,
      liquidity: null,
      holders: null,
      totalSupply: data.market_data.total_supply,
      circulatingSupply: data.market_data.circulating_supply,
    };
  } catch (error) {
    console.error('Error:', error);
    return null;
  }
}
```

**Pros:**
- ✅ Comprehensive market data
- ✅ Price, market cap, volume
- ✅ Free tier available

**Cons:**
- ❌ Your token must be listed on CoinGecko
- ❌ Rate limits on free tier
- ❌ Doesn't provide holder count

---

### Option 4: Moralis API (Multi-Chain)

**Best for:** Multi-chain support, comprehensive Web3 data

**Setup:**
1. Sign up at https://moralis.io
2. Get API key
3. Use their Web3 API

**Integration:**
```javascript
const MORALIS_API_KEY = 'your-api-key-here';

async function fetchTokenData() {
  try {
    const options = {
      method: 'GET',
      headers: {
        'accept': 'application/json',
        'X-API-Key': MORALIS_API_KEY
      }
    };
    
    // Get token metadata (chain: 'eth', 'bsc', 'polygon', etc.)
    const metadataUrl = `https://deep-index.moralis.io/api/v2/erc20/${CONFIG.contractAddress}/metadata?chain=eth`;
    const metadata = await fetch(metadataUrl, options).then(r => r.json());
    
    // Get token price
    const priceUrl = `https://deep-index.moralis.io/api/v2/erc20/${CONFIG.contractAddress}/price?chain=eth`;
    const price = await fetch(priceUrl, options).then(r => r.json());
    
    return {
      price: parseFloat(price.usdPrice),
      marketCap: parseFloat(price.usdPrice) * parseFloat(metadata.total_supply),
      liquidity: null,
      holders: null,
      totalSupply: metadata.total_supply,
    };
  } catch (error) {
    console.error('Error:', error);
    return null;
  }
}
```

---

## 🔄 Hybrid Approach (Recommended)

**Combine multiple APIs for best coverage:**

```javascript
async function fetchTokenData() {
  try {
    // Use DexScreener for price and liquidity (free, no key)
    const dexData = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${CONFIG.contractAddress}`)
      .then(r => r.json());
    const pair = dexData.pairs?.[0];
    
    // Use Helius for holder count (Solana only)
    // const holderData = await fetchHolderCount(); // Your Helius integration
    
    return {
      price: pair ? parseFloat(pair.priceUsd) : null,
      marketCap: pair ? parseFloat(pair.fdv || pair.marketCap) : CONFIG.fallbackMarketCap,
      liquidity: pair ? parseFloat(pair.liquidity?.usd) : null,
      holders: null, // Add from Helius if Solana
    };
  } catch (error) {
    console.error('Error:', error);
    // Return fallback data
    return {
      price: null,
      marketCap: CONFIG.fallbackMarketCap,
      liquidity: null,
      holders: null,
    };
  }
}
```

---

## 🎯 Implementation Steps

1. **Update CONFIG in `js/main.js`**
   - Add your contract address
   - Set correct explorer URL
   - Update pump.fun link

2. **Choose your API(s)**
   - Start with DexScreener (easiest, no key required)
   - Add Helius/Moralis for holder count if needed

3. **Update `fetchTokenData()` function**
   - Replace the mock data with real API calls
   - Handle errors gracefully
   - Always return fallback values

4. **Test locally**
   - Open browser console
   - Check for API errors
   - Verify data displays correctly

5. **Monitor rate limits**
   - Most free APIs have rate limits
   - The 60-second refresh is designed to stay well within limits
   - Increase interval if needed

---

## 📝 Additional Features

### Telegram Member Count

To show Telegram member count, you need a bot:

1. Create a Telegram bot via @BotFather
2. Get bot token
3. Add bot to your group as admin
4. Use Telegram Bot API:

```javascript
async function fetchTelegramMembers() {
  const BOT_TOKEN = 'your-bot-token';
  const CHAT_ID = '@snozcoin'; // Your group username
  
  try {
    const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/getChatMemberCount?chat_id=${CHAT_ID}`);
    const data = await response.json();
    return data.result; // Member count
  } catch (error) {
    console.error('Error fetching Telegram members:', error);
    return null;
  }
}
```

---

## 🚨 Security Notes

1. **Never commit API keys to Git**
   - Use environment variables
   - For client-side, use proxy/backend if key must be secret

2. **Rate limiting**
   - Implement caching
   - Use localStorage to cache data for 60s

3. **Error handling**
   - Always show graceful fallbacks
   - Never let the page break if API fails

4. **CORS issues**
   - Most APIs support CORS
   - If not, use a simple backend proxy (Cloudflare Worker, Vercel function)

---

## 🆘 Troubleshooting

### "Data not loading"
- Check browser console for errors
- Verify contract address is correct
- Test API endpoint in browser/Postman
- Check CORS policy

### "Rate limited"
- Increase refresh interval
- Cache data in localStorage
- Use multiple API providers

### "Wrong data displayed"
- Verify token address
- Check API response structure
- Ensure decimals are handled correctly

---

## 📚 Resources

- [DexScreener API Docs](https://docs.dexscreener.com)
- [Helius API Docs](https://docs.helius.dev)
- [Moralis API Docs](https://docs.moralis.io)
- [CoinGecko API Docs](https://www.coingecko.com/en/api/documentation)
- [Solana Web3.js](https://solana-labs.github.io/solana-web3.js/)

---

## ✅ Production Checklist

Before deploying:

- [ ] Updated contract address in CONFIG
- [ ] Tested API integration locally
- [ ] Verified all links work (explorer, pump.fun, GitHub)
- [ ] Checked mobile responsiveness
- [ ] Tested error states (disconnect internet, test fallbacks)
- [ ] Removed any console.log in production
- [ ] Set up analytics (optional)
- [ ] Test Twitter embed loads
- [ ] Verify whitepaper PDF downloads

---

**Need help?** Join the Telegram community or open an issue on GitHub.
