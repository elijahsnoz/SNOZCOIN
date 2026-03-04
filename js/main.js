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
  // Note: Contract address and third-party listing links have been removed from the public site
  contractAddress: null,
  explorerUrl: 'https://solscan.io/token/',
  
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
  // Contract address display and copy functionality removed.
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
  const revealItems = document.querySelectorAll('.reveal, .card, .token-card, .phase, .faq-item, .transparency-card, .step-card, .contract-card, .security-card');
  const obs = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('visible');
        obs.unobserve(e.target);
      }
    });
  }, { threshold: 0.12 });
  revealItems.forEach(i => obs.observe(i));

  // Initialize live data fetching with auto-refresh
  initAutoRefresh();
  
  // Initialize notification system
  initNotifications();
  
  // Initialize social login buttons
  initSocialLogin();
  
  // Getting Started connect button - trigger same wallet flow
  const gettingStartedConnectBtn = document.getElementById('getting-started-connect-btn');
  if (gettingStartedConnectBtn) {
    gettingStartedConnectBtn.addEventListener('click', () => {
      // Trigger the main connect button if it exists
      const mainConnectBtn = document.getElementById('snoz-connect-btn');
      if (mainConnectBtn) {
        mainConnectBtn.click();
      } else if (typeof connectWallet === 'function') {
        // Fallback: call connectWallet directly
        connectWallet();
      }
    });
  }
  
  // Whitepaper download link (already set in HTML)
  const openWP = document.getElementById('openWhitepaper');
  if (openWP) {
    try {
      openWP.setAttribute('href', '/assets/SNOZCOIN_whitepaper.pdf');
      openWP.setAttribute('download', 'SNOZCOIN_whitepaper.pdf');
    } catch (e) { /* noop */ }
  }
});

// ============================================
// NOTIFICATION SYSTEM
// ============================================

/**
 * Initialize notification bell dropdown
 */
function initNotifications() {
  const bell = document.getElementById('notification-bell');
  const dropdown = document.getElementById('notification-dropdown');
  const markAllRead = document.getElementById('mark-all-read');
  const badge = document.getElementById('notification-badge');
  
  if (!bell || !dropdown) return;
  
  // Toggle dropdown on bell click
  bell.addEventListener('click', (e) => {
    e.stopPropagation();
    dropdown.classList.toggle('show');
  });
  
  // Close dropdown when clicking outside
  document.addEventListener('click', (e) => {
    if (!dropdown.contains(e.target) && !bell.contains(e.target)) {
      dropdown.classList.remove('show');
    }
  });
  
  // Mark all as read
  if (markAllRead) {
    markAllRead.addEventListener('click', () => {
      const unreadItems = document.querySelectorAll('.notification-item.unread');
      unreadItems.forEach(item => item.classList.remove('unread'));
      updateNotificationBadge();
      showToast('All notifications marked as read', 'success');
    });
  }
  
  // Mark individual notification as read on click
  const notificationItems = document.querySelectorAll('.notification-item');
  notificationItems.forEach(item => {
    item.addEventListener('click', () => {
      item.classList.remove('unread');
      updateNotificationBadge();
    });
  });
}

/**
 * Update notification badge count
 */
function updateNotificationBadge() {
  const badge = document.getElementById('notification-badge');
  const unreadCount = document.querySelectorAll('.notification-item.unread').length;
  
  if (badge) {
    if (unreadCount > 0) {
      badge.textContent = unreadCount > 9 ? '9+' : unreadCount;
      badge.classList.remove('hidden');
    } else {
      badge.classList.add('hidden');
    }
  }
}

/**
 * Add a new notification dynamically
 */
function addNotification(type, title, message) {
  const list = document.getElementById('notification-list');
  if (!list) return;
  
  const icons = {
    tip: '💰',
    unlock: '🔓',
    reward: '🏆',
    follow: '👤',
    info: 'ℹ️'
  };
  
  const notification = document.createElement('div');
  notification.className = 'notification-item unread';
  notification.innerHTML = `
    <div class="notification-icon ${type}">${icons[type] || icons.info}</div>
    <div class="notification-content">
      <p class="notification-text"><strong>${title}</strong> ${message}</p>
      <span class="notification-time">Just now</span>
    </div>
  `;
  
  // Insert at the beginning
  list.insertBefore(notification, list.firstChild);
  
  // Update badge
  updateNotificationBadge();
  
  // Show toast
  showToast(`${title} ${message}`, 'info');
}

// ============================================
// SOCIAL LOGIN
// ============================================

/**
 * Initialize social login buttons
 */
function initSocialLogin() {
  const twitterBtn = document.getElementById('social-login-twitter');
  const discordBtn = document.getElementById('social-login-discord');
  const googleBtn = document.getElementById('social-login-google');
  
  // Twitter/X OAuth (placeholder - implement with actual OAuth flow)
  if (twitterBtn) {
    twitterBtn.addEventListener('click', () => {
      showToast('X/Twitter login coming soon! For now, please connect a Stacks wallet.', 'info');
      // TODO: Implement OAuth flow
      // window.location.href = '/api/auth/twitter';
    });
  }
  
  // Discord OAuth
  if (discordBtn) {
    discordBtn.addEventListener('click', () => {
      showToast('Discord login coming soon! For now, please connect a Stacks wallet.', 'info');
      // TODO: Implement OAuth flow
      // window.location.href = '/api/auth/discord';
    });
  }
  
  // Google OAuth
  if (googleBtn) {
    googleBtn.addEventListener('click', () => {
      showToast('Google login coming soon! For now, please connect a Stacks wallet.', 'info');
      // TODO: Implement OAuth flow
      // window.location.href = '/api/auth/google';
    });
  }
}

// ============================================
// TOAST NOTIFICATIONS
// ============================================

/**
 * Show a toast notification
 */
function showToast(message, type = 'info', duration = 4000) {
  const container = document.getElementById('toast-container');
  if (!container) return;
  
  const icons = {
    success: '✓',
    error: '✕',
    warning: '⚠',
    info: 'ℹ'
  };
  
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <span class="toast-icon">${icons[type] || icons.info}</span>
    <span class="toast-message">${message}</span>
    <button class="toast-close" onclick="this.parentElement.remove()">×</button>
  `;
  
  container.appendChild(toast);
  
  // Trigger animation
  setTimeout(() => toast.classList.add('show'), 10);
  
  // Auto remove
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, duration);
}
// ============================================
// SWAP WIDGET FUNCTIONALITY
// ============================================

/**
 * Homepage Swap Widget
 * Embedded swap interface for quick stablecoin to STX swaps
 */
const SwapWidget = {
  // Token data
  tokens: {
    USDC: { symbol: 'USDC', name: 'USD Coin', logo: 'https://assets.coingecko.com/coins/images/6319/small/USD_Coin_icon.png', price: 1.00 },
    USDT: { symbol: 'USDT', name: 'Tether USD', logo: 'https://assets.coingecko.com/coins/images/325/small/Tether.png', price: 1.00 },
    DAI: { symbol: 'DAI', name: 'Dai', logo: 'https://assets.coingecko.com/coins/images/9956/small/4943.png', price: 1.00 },
    BUSD: { symbol: 'BUSD', name: 'Binance USD', logo: 'https://assets.coingecko.com/coins/images/9576/small/BUSD.png', price: 1.00 },
    FRAX: { symbol: 'FRAX', name: 'Frax', logo: 'https://assets.coingecko.com/coins/images/13422/small/FRAX_icon.png', price: 1.00 },
    STX: { symbol: 'STX', name: 'Stacks', logo: 'https://assets.coingecko.com/coins/images/2069/small/Stacks_logo_full.png', price: 0.50 }
  },

  // State
  state: {
    fromToken: 'USDC',
    fromAmount: '',
    toAmount: '',
    stxPrice: 0.50,
    walletConnected: false,
    selectedDex: 'ALEX'
  },

  // Initialize
  init() {
    const widget = document.getElementById('swapWidget');
    if (!widget) return;

    this.bindEvents();
    this.fetchSTXPrice();
    
    // Refresh price every 30 seconds
    setInterval(() => this.fetchSTXPrice(), 30000);
  },

  // Bind events
  bindEvents() {
    // Amount input
    const fromInput = document.getElementById('widgetFromAmount');
    if (fromInput) {
      fromInput.addEventListener('input', (e) => this.handleAmountChange(e));
    }

    // Token selector
    const tokenBtn = document.getElementById('widgetFromToken');
    if (tokenBtn) {
      tokenBtn.addEventListener('click', () => this.showTokenSelector());
    }

    // Quick amount buttons
    document.querySelectorAll('.widget-quick-btn').forEach(btn => {
      btn.addEventListener('click', (e) => this.handleQuickAmount(e));
    });

    // Swap direction
    const swapDir = document.getElementById('widgetSwapDirection');
    if (swapDir) {
      swapDir.addEventListener('click', () => this.redirectToFullSwap());
    }

    // Swap button
    const swapBtn = document.getElementById('widgetSwapBtn');
    if (swapBtn) {
      swapBtn.addEventListener('click', () => this.handleSwap());
    }

    // Token badges
    document.querySelectorAll('.token-badge').forEach(badge => {
      badge.addEventListener('click', (e) => {
        const token = e.currentTarget.dataset.token;
        if (token && this.tokens[token]) {
          this.selectToken(token);
        }
      });
    });
  },

  // Fetch STX price
  async fetchSTXPrice() {
    try {
      const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=blockstack&vs_currencies=usd');
      const data = await response.json();
      
      if (data.blockstack && data.blockstack.usd) {
        this.state.stxPrice = data.blockstack.usd;
        this.tokens.STX.price = data.blockstack.usd;
        this.updateRate();
        this.calculateSwap();
      }
    } catch (error) {
      console.log('Using fallback STX price');
    }
  },

  // Handle amount change
  handleAmountChange(e) {
    let value = e.target.value.replace(/[^0-9.]/g, '');
    const parts = value.split('.');
    if (parts.length > 2) {
      value = parts[0] + '.' + parts.slice(1).join('');
    }
    
    this.state.fromAmount = value;
    e.target.value = value;
    this.calculateSwap();
  },

  // Calculate swap output
  calculateSwap() {
    const fromAmount = parseFloat(this.state.fromAmount) || 0;
    if (fromAmount === 0) {
      this.state.toAmount = '';
      this.updateToAmount();
      return;
    }

    const fromToken = this.tokens[this.state.fromToken];
    const valueInUsd = fromAmount * fromToken.price;
    let outputAmount = valueInUsd / this.state.stxPrice;
    
    // Apply 0.3% fee
    outputAmount = outputAmount * 0.997;
    
    this.state.toAmount = outputAmount.toFixed(6);
    this.updateToAmount();
    this.updateSwapButton();
  },

  // Update UI
  updateToAmount() {
    const toInput = document.getElementById('widgetToAmount');
    if (toInput) {
      toInput.value = this.state.toAmount;
    }
  },

  updateRate() {
    const rateEl = document.getElementById('widgetRate');
    if (rateEl) {
      const rate = 1 / this.state.stxPrice;
      rateEl.textContent = rate.toFixed(4);
    }
  },

  updateSwapButton() {
    const btn = document.getElementById('widgetSwapBtn');
    if (!btn) return;

    if (!this.state.walletConnected) {
      btn.innerHTML = '<span>Connect Wallet to Swap</span>';
      btn.disabled = false;
    } else if (!this.state.fromAmount || parseFloat(this.state.fromAmount) === 0) {
      btn.innerHTML = '<span>Enter Amount</span>';
      btn.disabled = true;
    } else {
      btn.innerHTML = '<span>Swap Now</span>';
      btn.disabled = false;
    }
  },

  // Quick amount buttons
  handleQuickAmount(e) {
    const percent = parseInt(e.target.dataset.percent);
    // For demo, set example amounts
    const demoBalance = 1000;
    const amount = (demoBalance * percent / 100).toFixed(2);
    
    const fromInput = document.getElementById('widgetFromAmount');
    if (fromInput) {
      fromInput.value = amount;
      this.state.fromAmount = amount;
      this.calculateSwap();
    }
  },

  // Show token selector dropdown
  showTokenSelector() {
    const existingDropdown = document.querySelector('.widget-token-dropdown');
    if (existingDropdown) {
      existingDropdown.remove();
      return;
    }

    const tokenBtn = document.getElementById('widgetFromToken');
    if (!tokenBtn) return;

    const dropdown = document.createElement('div');
    dropdown.className = 'widget-token-dropdown';
    dropdown.innerHTML = Object.entries(this.tokens)
      .filter(([symbol]) => symbol !== 'STX')
      .map(([symbol, token]) => `
        <button class="widget-token-option ${symbol === this.state.fromToken ? 'selected' : ''}" data-token="${symbol}">
          <img src="${token.logo}" alt="${symbol}" onerror="this.style.display='none'">
          <span>${symbol}</span>
        </button>
      `).join('');

    tokenBtn.parentElement.appendChild(dropdown);

    // Bind click events
    dropdown.querySelectorAll('.widget-token-option').forEach(opt => {
      opt.addEventListener('click', (e) => {
        this.selectToken(e.currentTarget.dataset.token);
        dropdown.remove();
      });
    });

    // Close on outside click
    setTimeout(() => {
      document.addEventListener('click', function closeDropdown(e) {
        if (!dropdown.contains(e.target) && e.target !== tokenBtn) {
          dropdown.remove();
          document.removeEventListener('click', closeDropdown);
        }
      });
    }, 10);
  },

  // Select token
  selectToken(symbol) {
    if (!this.tokens[symbol] || symbol === 'STX') return;

    this.state.fromToken = symbol;
    const token = this.tokens[symbol];

    // Update button
    const logoEl = document.getElementById('widgetFromLogo');
    const symbolEl = document.getElementById('widgetFromSymbol');
    
    if (logoEl) logoEl.src = token.logo;
    if (symbolEl) symbolEl.textContent = symbol;

    // Update rate display
    const rateInfo = document.querySelector('.widget-rate');
    if (rateInfo) {
      const rate = 1 / this.state.stxPrice;
      rateInfo.textContent = `1 ${symbol} = ${rate.toFixed(4)} STX`;
    }

    this.calculateSwap();
  },

  // Redirect to full swap
  redirectToFullSwap() {
    window.location.href = 'swap.html';
  },

  // Handle swap
  async handleSwap() {
    if (!this.state.walletConnected) {
      // Try to connect wallet
      await this.connectWallet();
      return;
    }

    if (!this.state.fromAmount || parseFloat(this.state.fromAmount) === 0) {
      showToast('Please enter an amount', 'warning');
      return;
    }

    // For full functionality, redirect to swap page
    const params = new URLSearchParams({
      from: this.state.fromToken,
      amount: this.state.fromAmount
    });
    window.location.href = `swap.html?${params.toString()}`;
  },

  // Connect wallet
  async connectWallet() {
    try {
      if (typeof window.StacksProvider !== 'undefined') {
        const response = await window.StacksProvider.authenticationRequest({
          appDetails: {
            name: 'SNOZCOIN',
            icon: window.location.origin + '/assets/logo.png'
          }
        });

        if (response) {
          this.state.walletConnected = true;
          this.updateSwapButton();
          showToast('Wallet connected!', 'success');
        }
      } else {
        showToast('Please install Hiro Wallet to swap', 'warning');
        window.open('https://wallet.hiro.so/', '_blank');
      }
    } catch (error) {
      console.error('Wallet connection error:', error);
      showToast('Failed to connect wallet', 'error');
    }
  }
};

// Initialize swap widget when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  SwapWidget.init();
});

// Add dropdown styles
const widgetDropdownStyles = document.createElement('style');
widgetDropdownStyles.textContent = `
  .widget-token-dropdown {
    position: absolute;
    top: 100%;
    right: 0;
    margin-top: 8px;
    background: rgba(30, 30, 45, 0.98);
    border: 1px solid rgba(168, 85, 247, 0.3);
    border-radius: 12px;
    padding: 8px;
    min-width: 140px;
    z-index: 100;
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
  }

  .widget-token-option {
    display: flex;
    align-items: center;
    gap: 10px;
    width: 100%;
    padding: 10px 12px;
    background: transparent;
    border: none;
    border-radius: 8px;
    color: #fff;
    font-weight: 500;
    cursor: pointer;
    transition: background 0.2s;
  }

  .widget-token-option:hover {
    background: rgba(168, 85, 247, 0.2);
  }

  .widget-token-option.selected {
    background: rgba(168, 85, 247, 0.15);
  }

  .widget-token-option img {
    width: 24px;
    height: 24px;
    border-radius: 50%;
  }

  .widget-input-row {
    position: relative;
  }
`;
document.head.appendChild(widgetDropdownStyles);
