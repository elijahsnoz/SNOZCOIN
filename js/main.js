/**
 * SNOZCOIN Main JavaScript
 * Handles:
 * - Live token data fetching (on-chain)
 * - Auto-refresh every 60 seconds
 * - Mobile navigation
 * - Smooth scroll
 * - Reveal animations
 * - Copy contract address
 */

// ============================================
// CONFIG - UPDATE THESE WITH REAL VALUES
// ============================================
const CONFIG = {
  // Replace with actual Solana token address
  contractAddress: 'YOUR_CONTRACT_ADDRESS_HERE', // Example: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'
  
  // Blockchain explorer base URL (e.g., Solscan for Solana)
  explorerUrl: 'https://solscan.io/token/',
  
  // pump.fun page (if applicable)
  pumpFunUrl: 'https://pump.fun/YOUR_TOKEN_ID',
  
  // Current market cap (fallback if API fails) - User mentioned $3900
  fallbackMarketCap: 3900,
  
  // Auto-refresh interval (milliseconds) - 60 seconds
  refreshInterval: 60000,
  
  // Telegram group (for member count API if available)
  telegramGroup: 'snozcoin',
};

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Format number with commas (e.g., 1234567 -> 1,234,567)
 */
function formatNumber(num) {
  if (num === null || num === undefined || isNaN(num)) return 'N/A';
  return Number(num).toLocaleString('en-US');
}

/**
 * Format currency (e.g., 1234.56 -> $1,234.56)
 */
function formatCurrency(num) {
  if (num === null || num === undefined || isNaN(num)) return 'N/A';
  return '$' + Number(num).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/**
 * Format price with more decimal places for small values
 */
function formatPrice(price) {
  if (price === null || price === undefined || isNaN(price)) return 'N/A';
  if (price < 0.01) {
    return '$' + Number(price).toFixed(6);
  } else if (price < 1) {
    return '$' + Number(price).toFixed(4);
  } else {
    return '$' + Number(price).toFixed(2);
  }
}

/**
 * Show loading state
 */
function showLoading(elementId) {
  const el = document.getElementById(elementId);
  if (el) el.innerHTML = '<span class="loading-placeholder">Loading...</span>';
}

/**
 * Show error/unavailable state
 */
function showUnavailable(elementId, message = 'Not available yet') {
  const el = document.getElementById(elementId);
  if (el) el.innerHTML = `<span style="color:var(--muted)">${message}</span>`;
}

// ============================================
// LIVE DATA FETCHING
// ============================================

/**
 * Fetch token data from on-chain sources
 * NOTE: This is a template. You need to integrate with actual APIs:
 * - For Solana: Use Solana RPC, Helius, QuickNode, or DexScreener API
 * - For Ethereum: Use Etherscan API, The Graph, or similar
 * - For pump.fun tokens: Use their API if available
 */
async function fetchTokenData() {
  try {
    // OPTION 1: Use DexScreener API (popular for DEX tokens)
    // Example endpoint: https://api.dexscreener.com/latest/dex/tokens/{tokenAddress}
    const dexScreenerUrl = `https://api.dexscreener.com/latest/dex/tokens/${CONFIG.contractAddress}`;
    
    // NOTE: Uncomment and use actual API when ready
    /*
    const response = await fetch(dexScreenerUrl);
    if (!response.ok) throw new Error('API request failed');
    const data = await response.json();
    
    // Extract data from response (structure varies by API)
    const pair = data.pairs && data.pairs[0]; // Get first trading pair
    if (pair) {
      return {
        price: parseFloat(pair.priceUsd) || null,
        marketCap: parseFloat(pair.fdv) || parseFloat(pair.marketCap) || null,
        liquidity: parseFloat(pair.liquidity?.usd) || null,
        holders: null, // DexScreener doesn't provide this
      };
    }
    */
    
    // OPTION 2: Use Solana RPC for on-chain data
    // You would need to query token accounts, parse supply, etc.
    
    // FALLBACK: Return mock/static data until APIs are integrated
    // TODO: Replace with real API integration
    return {
      price: null, // Will be calculated from market cap if available
      marketCap: CONFIG.fallbackMarketCap,
      liquidity: null,
      holders: null,
      totalSupply: null,
      circulatingSupply: null,
    };
    
  } catch (error) {
    console.error('Error fetching token data:', error);
    return null;
  }
}

/**
 * Update the live data section with fetched data
 */
async function updateLiveData() {
  console.log('Fetching live token data...');
  
  // Update last refresh time
  const now = new Date();
  const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  const lastUpdateEl = document.getElementById('last-update');
  if (lastUpdateEl) {
    lastUpdateEl.textContent = `Last updated: ${timeStr}`;
  }
  
  // Fetch data
  const data = await fetchTokenData();
  
  if (!data) {
    // Show error state
    showUnavailable('token-price');
    showUnavailable('market-cap');
    showUnavailable('holder-count');
    showUnavailable('liquidity');
    return;
  }
  
  // Update Price
  const priceEl = document.getElementById('token-price');
  if (priceEl) {
    if (data.price !== null) {
      priceEl.textContent = formatPrice(data.price);
    } else if (data.marketCap && data.totalSupply) {
      // Calculate price from market cap and supply
      const calculatedPrice = data.marketCap / data.totalSupply;
      priceEl.textContent = formatPrice(calculatedPrice) + ' (est)';
    } else {
      showUnavailable('token-price');
    }
  }
  
  // Update Market Cap
  const mcapEl = document.getElementById('market-cap');
  if (mcapEl) {
    mcapEl.textContent = data.marketCap ? formatCurrency(data.marketCap) : 'Not available yet';
  }
  
  // Update Holders
  const holdersEl = document.getElementById('holder-count');
  if (holdersEl) {
    holdersEl.textContent = data.holders ? formatNumber(data.holders) : 'Not available yet';
  }
  
  // Update Liquidity
  const liqEl = document.getElementById('liquidity');
  if (liqEl) {
    liqEl.textContent = data.liquidity ? formatCurrency(data.liquidity) : 'Not available yet';
  }
  
  // Update transparency section
  if (data.totalSupply) {
    const supplyEl = document.getElementById('total-supply');
    if (supplyEl) supplyEl.textContent = formatNumber(data.totalSupply);
  }
  
  if (data.circulatingSupply) {
    const circEl = document.getElementById('circulating-supply');
    if (circEl) circEl.textContent = formatNumber(data.circulatingSupply);
  }
  
  console.log('Live data updated:', data);
}

/**
 * Set up auto-refresh for live data
 */
function initAutoRefresh() {
  // Initial fetch
  updateLiveData();
  
  // Refresh every 60 seconds
  setInterval(() => {
    updateLiveData();
  }, CONFIG.refreshInterval);
}

// ============================================
// CONTRACT ADDRESS & LINKS
// ============================================

/**
 * Initialize contract address display and links
 */
function initContractInfo() {
  // Set contract address
  const contractEl = document.getElementById('contract-address');
  if (contractEl) {
    contractEl.textContent = CONFIG.contractAddress;
  }
  
  // Set explorer link
  const explorerLink = document.getElementById('explorer-link');
  if (explorerLink) {
    explorerLink.href = CONFIG.explorerUrl + CONFIG.contractAddress;
  }
  
  const explorerLinkMain = document.getElementById('explorer-link-main');
  if (explorerLinkMain) {
    explorerLinkMain.href = CONFIG.explorerUrl + CONFIG.contractAddress;
  }
  
  // Set pump.fun link
  const pumpLink = document.getElementById('pumpfun-link');
  if (pumpLink) {
    pumpLink.href = CONFIG.pumpFunUrl;
  }
  
  // Copy button functionality
  const copyBtn = document.getElementById('copy-contract');
  if (copyBtn) {
    copyBtn.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(CONFIG.contractAddress);
        
        // Visual feedback
        const originalHTML = copyBtn.innerHTML;
        copyBtn.innerHTML = '<svg width="14" height="14" fill="currentColor" viewBox="0 0 16 16"><path d="M13.854 3.646a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L6.5 10.293l6.646-6.647a.5.5 0 0 1 .708 0z"/></svg>';
        copyBtn.style.color = '#4caf50';
        
        setTimeout(() => {
          copyBtn.innerHTML = originalHTML;
          copyBtn.style.color = '';
        }, 2000);
      } catch (err) {
        console.error('Failed to copy:', err);
        alert('Failed to copy address. Please copy manually.');
      }
    });
  }
}

// ============================================
// NAVIGATION & UI
// ============================================

document.addEventListener('DOMContentLoaded', function() {
  // Mobile nav toggle
  const nav = document.getElementById('nav');
  const toggle = document.getElementById('navToggle');
  if (toggle && nav) {
    toggle.addEventListener('click', () => {
      nav.classList.toggle('show');
      toggle.classList.toggle('open');
    });
  }

  // Smooth anchor scroll
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', function(e) {
      const href = this.getAttribute('href');
      if (href.length > 1) {
        e.preventDefault();
        const el = document.querySelector(href);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        if (nav && nav.classList.contains('show')) nav.classList.remove('show');
      }
    });
  });

  // Reveal on scroll
  const revealItems = document.querySelectorAll('.reveal, .card, .token-card, .phase, .faq-item, .transparency-card');
  const obs = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('visible');
        obs.unobserve(e.target);
      }
    });
  }, { threshold: 0.12 });
  revealItems.forEach(i => obs.observe(i));

  // Initialize contract info and links
  initContractInfo();
  
  // Initialize live data fetching with auto-refresh
  initAutoRefresh();
  
  // Whitepaper download link (already set in HTML)
  const openWP = document.getElementById('openWhitepaper');
  if (openWP) {
    try {
      openWP.setAttribute('href', '/assets/SNOZCOIN_whitepaper.pdf');
      openWP.setAttribute('download', 'SNOZCOIN_whitepaper.pdf');
    } catch (e) { /* noop */ }
  }
});
