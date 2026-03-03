/**
 * SNOZ Token - Stacks Integration
 * 
 * This module handles integration with the Stacks blockchain for:
 * - SNOZ token balance display
 * - Reward tier visualization
 * - Governance status
 * - Wallet connection via @stacks/connect
 * 
 * SNOZ is a NON-SPECULATIVE utility token. STX remains the ONLY monetary currency.
 * SNOZ is used for: Rewards, Reputation, Governance, Badges, Access tiers
 */

// ============================================
// CONFIGURATION
// ============================================
const SNOZ_CONFIG = {
  // Contract addresses (deployed by SP1PTBC7PP2X11N7M3K2BTF5HWRDK4J8QMGNFTEY5)
  contracts: {
    snozToken: 'SP1PTBC7PP2X11N7M3K2BTF5HWRDK4J8QMGNFTEY5.snoz-token',
    snozRewardsEngine: 'SP1PTBC7PP2X11N7M3K2BTF5HWRDK4J8QMGNFTEY5.snoz-rewards-engine',
    snozGovernance: 'SP1PTBC7PP2X11N7M3K2BTF5HWRDK4J8QMGNFTEY5.snoz-governance',
    snozcoinTipping: 'SP1PTBC7PP2X11N7M3K2BTF5HWRDK4J8QMGNFTEY5.snozcoin-tipping',
    snozcoinContent: 'SP1PTBC7PP2X11N7M3K2BTF5HWRDK4J8QMGNFTEY5.snozcoin-content',
    snozcoinRewards: 'SP1PTBC7PP2X11N7M3K2BTF5HWRDK4J8QMGNFTEY5.snozcoin-rewards'
  },
  
  // Deployer/Admin address
  deployer: 'SP1PTBC7PP2X11N7M3K2BTF5HWRDK4J8QMGNFTEY5',
  
  // Network configuration
  network: 'mainnet', // 'mainnet' or 'testnet'
  
  // API endpoints
  api: {
    mainnet: 'https://api.mainnet.hiro.so',
    testnet: 'https://api.testnet.hiro.so'
  },
  
  // Token metadata
  token: {
    name: 'SNOZ',
    symbol: 'SNOZ',
    decimals: 6,
    maxSupply: 1000000000, // 1 billion SNOZ
    description: 'Non-speculative utility token for SNOZCOIN platform'
  },
  
  // Tier thresholds (in SNOZ, without decimals for display)
  tiers: {
    bronze:   { min: 0,         name: 'Bronze',   color: '#CD7F32', icon: '🥉' },
    silver:   { min: 1000,      name: 'Silver',   color: '#C0C0C0', icon: '🥈' },
    gold:     { min: 10000,     name: 'Gold',     color: '#FFD700', icon: '🥇' },
    platinum: { min: 100000,    name: 'Platinum', color: '#E5E4E2', icon: '💎' },
    diamond:  { min: 1000000,   name: 'Diamond',  color: '#B9F2FF', icon: '💠' }
  },
  
  // Reward rates (for display)
  rewards: {
    tipRate: 2,      // SNOZ per STX tipped
    contentRate: 3,  // SNOZ per STX spent on content
    creatorBonus: 200 // SNOZ bonus for new creators
  }
};

// ============================================
// STATE
// ============================================
let snozState = {
  connected: false,
  address: null,
  snozBalance: 0,
  stxBalance: 0,
  tier: 'bronze',
  tierName: 'Bronze',
  lifetimeRewards: 0,
  governanceVotingPower: 0
};

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Format SNOZ amount (handle 6 decimals)
 */
function formatSnoz(amount) {
  const num = Number(amount) / 1000000; // 6 decimals
  if (num >= 1000000) {
    return (num / 1000000).toFixed(2) + 'M';
  } else if (num >= 1000) {
    return (num / 1000).toFixed(2) + 'K';
  } else if (num >= 1) {
    return num.toFixed(2);
  } else {
    return num.toFixed(6);
  }
}

/**
 * Format SNOZ with full precision
 */
function formatSnozFull(amount) {
  const num = Number(amount) / 1000000;
  return num.toLocaleString('en-US', { maximumFractionDigits: 6 });
}

/**
 * Determine tier from SNOZ balance
 */
function getTierFromBalance(snozBalance) {
  const balance = Number(snozBalance) / 1000000; // Convert from micro-SNOZ
  
  if (balance >= SNOZ_CONFIG.tiers.diamond.min) {
    return { key: 'diamond', ...SNOZ_CONFIG.tiers.diamond };
  } else if (balance >= SNOZ_CONFIG.tiers.platinum.min) {
    return { key: 'platinum', ...SNOZ_CONFIG.tiers.platinum };
  } else if (balance >= SNOZ_CONFIG.tiers.gold.min) {
    return { key: 'gold', ...SNOZ_CONFIG.tiers.gold };
  } else if (balance >= SNOZ_CONFIG.tiers.silver.min) {
    return { key: 'silver', ...SNOZ_CONFIG.tiers.silver };
  } else {
    return { key: 'bronze', ...SNOZ_CONFIG.tiers.bronze };
  }
}

/**
 * Get progress to next tier
 */
function getTierProgress(snozBalance) {
  const balance = Number(snozBalance) / 1000000;
  const tiers = ['bronze', 'silver', 'gold', 'platinum', 'diamond'];
  const tierOrder = Object.entries(SNOZ_CONFIG.tiers);
  
  for (let i = 0; i < tierOrder.length - 1; i++) {
    const [currentKey, current] = tierOrder[i];
    const [nextKey, next] = tierOrder[i + 1];
    
    if (balance < next.min) {
      const progress = ((balance - current.min) / (next.min - current.min)) * 100;
      return {
        currentTier: current.name,
        nextTier: next.name,
        progress: Math.min(100, Math.max(0, progress)),
        needed: next.min - balance
      };
    }
  }
  
  // Already at max tier
  return {
    currentTier: 'Diamond',
    nextTier: null,
    progress: 100,
    needed: 0
  };
}

// ============================================
// API FUNCTIONS
// ============================================

/**
 * Get API base URL based on network
 */
function getApiUrl() {
  return SNOZ_CONFIG.api[SNOZ_CONFIG.network];
}

/**
 * Fetch account balances from Stacks API
 */
async function fetchAccountBalances(address) {
  try {
    const response = await fetch(`${getApiUrl()}/extended/v1/address/${address}/balances`);
    if (!response.ok) throw new Error('Failed to fetch balances');
    return await response.json();
  } catch (error) {
    console.error('Error fetching balances:', error);
    return null;
  }
}

/**
 * Call read-only contract function
 */
async function callReadOnly(contractAddress, contractName, functionName, args = []) {
  try {
    const [address, name] = contractAddress.split('.');
    const response = await fetch(`${getApiUrl()}/v2/contracts/call-read/${address}/${name}/${functionName}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sender: address,
        arguments: args
      })
    });
    
    if (!response.ok) throw new Error('Contract call failed');
    return await response.json();
  } catch (error) {
    console.error('Error calling contract:', error);
    return null;
  }
}

/**
 * Fetch SNOZ-specific data for an address
 */
async function fetchSnozData(address) {
  try {
    // Fetch from SNOZ token contract
    const balanceResult = await callReadOnly(
      SNOZ_CONFIG.contracts.snozToken,
      'snoz-token',
      'get-balance',
      [`0x${Buffer.from(address).toString('hex')}`]
    );
    
    // Fetch from rewards engine
    const profileResult = await callReadOnly(
      SNOZ_CONFIG.contracts.snozRewardsEngine,
      'snoz-rewards-engine',
      'get-user-profile',
      [`0x${Buffer.from(address).toString('hex')}`]
    );
    
    return {
      balance: balanceResult?.result?.value || 0,
      profile: profileResult?.result || null
    };
  } catch (error) {
    console.error('Error fetching SNOZ data:', error);
    return null;
  }
}

// ============================================
// WALLET CONNECTION
// ============================================

/**
 * Check if Stacks wallet is available
 */
function isWalletAvailable() {
  if (typeof window === 'undefined') return false;
  
  // Check for various wallet providers
  const hasLeather = window.LeatherProvider || window.HiroWalletProvider || 
                     (window.btc && window.btc.request);
  const hasXverse = window.XverseProviders || window.BitcoinProvider;
  const hasStacksConnect = window.StacksProvider;
  
  console.log('Wallet detection:', { hasLeather, hasXverse, hasStacksConnect });
  
  return hasLeather || hasXverse || hasStacksConnect;
}

/**
 * Get available wallet provider
 */
function getWalletProvider() {
  // Leather wallet (formerly Hiro Wallet)
  if (window.LeatherProvider) {
    console.log('Found LeatherProvider');
    return { name: 'Leather', provider: window.LeatherProvider };
  }
  
  if (window.HiroWalletProvider) {
    console.log('Found HiroWalletProvider');
    return { name: 'Leather', provider: window.HiroWalletProvider };
  }
  
  // Leather also exposes through btc.request
  if (window.btc && typeof window.btc.request === 'function') {
    console.log('Found btc.request (Leather)');
    return { name: 'Leather', provider: window.btc };
  }
  
  // Xverse wallet
  if (window.XverseProviders && window.XverseProviders.StacksProvider) {
    console.log('Found XverseProviders.StacksProvider');
    return { name: 'Xverse', provider: window.XverseProviders.StacksProvider };
  }
  
  // Generic Stacks provider
  if (window.StacksProvider) {
    console.log('Found StacksProvider');
    return { name: 'Stacks Wallet', provider: window.StacksProvider };
  }
  
  return null;
}

/**
 * Connect to Stacks wallet
 */
async function connectWallet() {
  console.log('Attempting wallet connection...');
  showWalletLoading(true, 'Connecting to wallet...');
  updateConnectionStatus('connecting', 'Connecting...');
  
  // First try direct provider connection (most reliable)
  const walletInfo = getWalletProvider();
  
  if (walletInfo) {
    console.log(`Connecting via ${walletInfo.name}...`);
    try {
      let address = null;
      
      // Try the getAddresses method (Leather v2+)
      if (typeof walletInfo.provider.request === 'function') {
        try {
          const response = await walletInfo.provider.request('getAddresses');
          console.log('getAddresses response:', response);
          
          if (response && response.result && response.result.addresses) {
            // Find mainnet STX address
            const stxAddress = response.result.addresses.find(
              a => a.symbol === 'STX' || a.type === 'stx' || a.purpose === 'stacks'
            );
            address = stxAddress?.address || response.result.addresses[0]?.address;
          }
        } catch (e) {
          console.log('getAddresses failed, trying stx_requestAccounts...', e);
        }
      }
      
      // Try stx_requestAccounts method
      if (!address && typeof walletInfo.provider.request === 'function') {
        try {
          const response = await walletInfo.provider.request({ method: 'stx_requestAccounts' });
          console.log('stx_requestAccounts response:', response);
          
          if (response && response.result) {
            if (Array.isArray(response.result.addresses)) {
              const mainnetAddr = response.result.addresses.find(
                a => a.address && a.address.startsWith('SP')
              );
              address = mainnetAddr?.address || response.result.addresses[0]?.address;
            } else if (response.result.address) {
              address = response.result.address;
            }
          }
        } catch (e) {
          console.log('stx_requestAccounts failed:', e);
        }
      }
      
      // Try connect method (older API)
      if (!address && typeof walletInfo.provider.connect === 'function') {
        try {
          const response = await walletInfo.provider.connect();
          console.log('connect response:', response);
          address = response?.address || response?.addresses?.[0];
        } catch (e) {
          console.log('connect failed:', e);
        }
      }
      
      if (address) {
        console.log('Connected to address:', address);
        showWalletLoading(false);
        updateConnectionStatus('connected', 'Connected');
        updateSnozState({ connected: true, address });
        showWalletNotification(`Connected: ${address.slice(0, 8)}...${address.slice(-4)}`);
        updateSnozUI();
        refreshSnozData();
        return address;
      }
    } catch (error) {
      console.error('Wallet provider error:', error);
      showWalletLoading(false);
      updateConnectionStatus('error', 'Connection failed');
    }
  }
  
  // Fallback: Use @stacks/connect library if loaded
  if (typeof window.stacksConnect !== 'undefined' || typeof window.StacksConnect !== 'undefined') {
    const lib = window.stacksConnect || window.StacksConnect;
    console.log('Trying @stacks/connect library...');
    
    try {
      const showConnect = lib.showConnect || lib.default?.showConnect;
      const AppConfig = lib.AppConfig || lib.default?.AppConfig;
      const UserSession = lib.UserSession || lib.default?.UserSession;
      
      if (showConnect && AppConfig && UserSession) {
        const appConfig = new AppConfig(['store_write', 'publish_data']);
        const userSession = new UserSession({ appConfig });
        
        return new Promise((resolve, reject) => {
          showConnect({
            appDetails: {
              name: 'SNOZCOIN',
              icon: window.location.origin + '/assets/SNOZCOIN-512.png'
            },
            userSession,
            onFinish: () => {
              const userData = userSession.loadUserData();
              const address = userData.profile.stxAddress?.mainnet || 
                             userData.profile.stxAddress?.testnet;
              console.log('Connected via @stacks/connect:', address);
              showWalletLoading(false);
              updateConnectionStatus('connected', 'Connected');
              updateSnozState({ connected: true, address });
              showWalletNotification('Wallet connected!');
              updateSnozUI();
              refreshSnozData();
              resolve(address);
            },
            onCancel: () => {
              showWalletLoading(false);
              updateConnectionStatus('disconnected', 'Disconnected');
              showWalletNotification('Connection cancelled');
              reject(new Error('User cancelled'));
            }
          });
        });
      }
    } catch (error) {
      console.error('@stacks/connect error:', error);
      showWalletLoading(false);
      updateConnectionStatus('error', 'Connection failed');
    }
  }
  
  // No wallet detected - show installation prompt
  console.log('No wallet detected');
  showWalletLoading(false);
  updateConnectionStatus('error', 'No wallet found');
  showWalletNotification('No Stacks wallet found. Please install Leather or Xverse.');
  
  const choice = confirm(
    'No Stacks wallet detected!\n\n' +
    'You need Leather or Xverse wallet to connect.\n\n' +
    'Click OK to install Leather wallet, or Cancel to install Xverse.'
  );
  
  if (choice) {
    window.open('https://leather.io/install-extension', '_blank');
  } else {
    window.open('https://www.xverse.app/download', '_blank');
  }
  
  return null;
}

/**
 * Disconnect wallet
 */
function disconnectWallet() {
  updateSnozState({
    connected: false,
    address: null,
    snozBalance: 0,
    stxBalance: 0,
    tier: 'bronze',
    tierName: 'Bronze'
  });
  updateConnectionStatus('disconnected', 'Disconnected');
  updateSnozUI();
  showWalletNotification('Wallet disconnected');
}

// ============================================
// STATE MANAGEMENT
// ============================================

/**
 * Update SNOZ state
 */
function updateSnozState(updates) {
  snozState = { ...snozState, ...updates };
  
  // Recalculate tier if balance changed
  if (updates.snozBalance !== undefined) {
    const tier = getTierFromBalance(snozState.snozBalance);
    snozState.tier = tier.key;
    snozState.tierName = tier.name;
  }
  
  // Persist address to localStorage
  if (updates.address) {
    localStorage.setItem('snoz_connected_address', updates.address);
  }
  
  if (updates.connected === false) {
    localStorage.removeItem('snoz_connected_address');
  }
}

/**
 * Load saved connection state
 */
function loadSavedState() {
  const savedAddress = localStorage.getItem('snoz_connected_address');
  if (savedAddress) {
    updateSnozState({ connected: true, address: savedAddress });
    refreshSnozData();
    
    // Update UI to show connected state
    setTimeout(() => {
      const connectBtn = document.getElementById('snoz-connect-btn');
      const disconnectBtn = document.getElementById('snoz-disconnect-btn');
      const walletBtnText = document.getElementById('wallet-btn-text');
      
      if (walletBtnText) {
        walletBtnText.textContent = savedAddress.slice(0, 6) + '...' + savedAddress.slice(-4);
      }
      if (connectBtn) {
        connectBtn.classList.add('connected');
      }
      if (disconnectBtn) {
        disconnectBtn.style.display = 'inline-flex';
      }
    }, 100);
  }
}

/**
 * Refresh all SNOZ data for connected wallet
 */
async function refreshSnozData() {
  if (!snozState.connected || !snozState.address) return;
  
  try {
    // Fetch account balances
    const balances = await fetchAccountBalances(snozState.address);
    if (balances) {
      // STX balance
      const stxBalance = balances.stx?.balance || 0;
      
      // Find SNOZ token balance in fungible tokens
      let snozBalance = 0;
      const fungibleTokens = balances.fungible_tokens || {};
      for (const [tokenKey, tokenData] of Object.entries(fungibleTokens)) {
        if (tokenKey.includes('snoz-token') && tokenKey.includes('SNOZ')) {
          snozBalance = tokenData.balance || 0;
          break;
        }
      }
      
      updateSnozState({ stxBalance, snozBalance });
    }
    
    // Fetch SNOZ-specific data
    const snozData = await fetchSnozData(snozState.address);
    if (snozData && snozData.profile) {
      updateSnozState({
        lifetimeRewards: snozData.profile.lifetime_snoz_earned || 0,
        governanceVotingPower: snozData.profile.voting_power || 0
      });
    }
    
    updateSnozUI();
  } catch (error) {
    console.error('Error refreshing SNOZ data:', error);
  }
}

// ============================================
// UI UPDATES
// ============================================

/**
 * Update all SNOZ-related UI elements
 */
function updateSnozUI() {
  // Update wallet connection button
  const connectBtn = document.getElementById('snoz-connect-btn');
  if (connectBtn) {
    if (snozState.connected) {
      const shortAddr = snozState.address.slice(0, 6) + '...' + snozState.address.slice(-4);
      connectBtn.innerHTML = `
        <span class="snoz-tier-badge" style="background: ${SNOZ_CONFIG.tiers[snozState.tier].color}">
          ${SNOZ_CONFIG.tiers[snozState.tier].icon}
        </span>
        ${shortAddr}
      `;
      connectBtn.classList.add('connected');
    } else {
      connectBtn.innerHTML = `
        <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
          <path d="M0 3a2 2 0 0 1 2-2h13.5a.5.5 0 0 1 0 1H15v2a1 1 0 0 1 1 1v8.5a1.5 1.5 0 0 1-1.5 1.5h-12A2.5 2.5 0 0 1 0 12.5V3zm1 1.732V12.5A1.5 1.5 0 0 0 2.5 14h12a.5.5 0 0 0 .5-.5V5H2a1.99 1.99 0 0 1-1-.268zM1 3a1 1 0 0 0 1 1h12V2H2a1 1 0 0 0-1 1z"/>
        </svg>
        Connect Wallet
      `;
      connectBtn.classList.remove('connected');
    }
  }
  
  // Update SNOZ balance display
  const balanceEl = document.getElementById('snoz-balance');
  if (balanceEl) {
    if (snozState.connected) {
      balanceEl.innerHTML = `
        <span class="snoz-amount">${formatSnoz(snozState.snozBalance)}</span>
        <span class="snoz-label">SNOZ</span>
      `;
    } else {
      balanceEl.innerHTML = '<span class="snoz-label">Connect wallet to view</span>';
    }
  }
  
  // Update tier display
  const tierEl = document.getElementById('snoz-tier');
  if (tierEl) {
    const tier = SNOZ_CONFIG.tiers[snozState.tier];
    const progress = getTierProgress(snozState.snozBalance);
    
    tierEl.innerHTML = `
      <div class="tier-badge" style="color: ${tier.color}">
        <span class="tier-icon">${tier.icon}</span>
        <span class="tier-name">${tier.name}</span>
      </div>
      ${progress.nextTier ? `
        <div class="tier-progress">
          <div class="tier-progress-bar">
            <div class="tier-progress-fill" style="width: ${progress.progress}%; background: ${tier.color}"></div>
          </div>
          <span class="tier-progress-text">${formatSnoz(progress.needed * 1000000)} SNOZ to ${progress.nextTier}</span>
        </div>
      ` : '<div class="tier-max">Max tier achieved!</div>'}
    `;
  }
  
  // Update STX balance
  const stxBalanceEl = document.getElementById('stx-balance');
  if (stxBalanceEl && snozState.connected) {
    const stxAmount = Number(snozState.stxBalance) / 1000000;
    stxBalanceEl.textContent = stxAmount.toFixed(6) + ' STX';
  }
  
  // Update rewards preview
  updateRewardsPreview();
}

/**
 * Update rewards preview calculations
 */
function updateRewardsPreview() {
  const tipAmountEl = document.getElementById('preview-tip-amount');
  const tipRewardEl = document.getElementById('preview-tip-reward');
  
  if (tipAmountEl && tipRewardEl) {
    const stxAmount = parseFloat(tipAmountEl.value) || 0;
    const snozReward = stxAmount * SNOZ_CONFIG.rewards.tipRate;
    tipRewardEl.textContent = `${snozReward.toFixed(2)} SNOZ`;
  }
  
  const contentAmountEl = document.getElementById('preview-content-amount');
  const contentRewardEl = document.getElementById('preview-content-reward');
  
  if (contentAmountEl && contentRewardEl) {
    const stxAmount = parseFloat(contentAmountEl.value) || 0;
    const snozReward = stxAmount * SNOZ_CONFIG.rewards.contentRate;
    contentRewardEl.textContent = `${snozReward.toFixed(2)} SNOZ`;
  }
}

/**
 * Show wallet notification
 * Uses new ToastManager if available, falls back to simple notification
 */
function showWalletNotification(message, type = 'info') {
  // Try to use new ToastManager if available
  if (typeof window.ToastManager !== 'undefined') {
    const toastType = message.toLowerCase().includes('error') || message.toLowerCase().includes('failed') 
      ? 'error' 
      : message.toLowerCase().includes('disconnect') 
        ? 'warning'
        : message.toLowerCase().includes('connect') 
          ? 'success' 
          : 'info';
    window.ToastManager[toastType](message);
    return;
  }
  
  // Fallback: Create notification if it doesn't exist
  let notification = document.getElementById('snoz-notification');
  if (!notification) {
    notification = document.createElement('div');
    notification.id = 'snoz-notification';
    notification.className = 'snoz-notification';
    document.body.appendChild(notification);
  }
  
  notification.textContent = message;
  notification.classList.add('show');
  
  setTimeout(() => {
    notification.classList.remove('show');
  }, 3000);
}

/**
 * Update connection status indicator
 */
function updateConnectionStatus(status, message) {
  if (typeof window.ConnectionStatus !== 'undefined') {
    window.ConnectionStatus.update(status, message);
  }
}

/**
 * Show loading state during wallet operations
 */
function showWalletLoading(show, message = 'Connecting wallet...') {
  if (typeof window.LoadingManager !== 'undefined') {
    if (show) {
      window.LoadingManager.showOverlay(message);
    } else {
      window.LoadingManager.hideOverlay();
    }
  }
}

/**
 * Log transaction to history
 */
function logTransaction(type, amount, recipient, txId, status = 'pending') {
  if (typeof window.TransactionHistory !== 'undefined') {
    window.TransactionHistory.addTransaction({
      type,
      amount,
      recipient,
      txId,
      status
    });
    
    // Show transaction history toggle button
    const toggleBtn = document.getElementById('tx-history-toggle');
    if (toggleBtn) {
      toggleBtn.style.display = 'inline-flex';
    }
  }
}

// ============================================
// INITIALIZATION
// ============================================

/**
 * Debug wallet detection - call from console to troubleshoot
 */
function debugWalletDetection() {
  console.log('=== WALLET DETECTION DEBUG ===');
  console.log('window.LeatherProvider:', typeof window.LeatherProvider);
  console.log('window.HiroWalletProvider:', typeof window.HiroWalletProvider);
  console.log('window.btc:', typeof window.btc);
  console.log('window.btc?.request:', typeof window.btc?.request);
  console.log('window.XverseProviders:', typeof window.XverseProviders);
  console.log('window.StacksProvider:', typeof window.StacksProvider);
  console.log('window.stacksConnect:', typeof window.stacksConnect);
  console.log('window.StacksConnect:', typeof window.StacksConnect);
  console.log('window.BitcoinProvider:', typeof window.BitcoinProvider);
  
  const provider = getWalletProvider();
  console.log('Detected provider:', provider);
  console.log('isWalletAvailable():', isWalletAvailable());
  console.log('==============================');
  
  return provider;
}

// Expose to window for debugging
window.debugWalletDetection = debugWalletDetection;

/**
 * Initialize SNOZ integration
 */
function initSnozIntegration() {
  console.log('Initializing SNOZ Stacks integration...');
  
  // Debug: log wallet availability
  console.log('Wallet available:', isWalletAvailable());
  
  // Load saved state
  loadSavedState();
  
  // Hide connection status by default - only show when actively connecting
  const connectionStatusEl = document.getElementById('connection-status');
  if (connectionStatusEl) {
    connectionStatusEl.style.display = 'none';
  }
  
  // Setup transaction history toggle
  const txHistoryToggle = document.getElementById('tx-history-toggle');
  const txHistoryPanel = document.getElementById('tx-history-panel');
  const txHistoryClose = document.getElementById('tx-history-close');
  
  if (txHistoryToggle && txHistoryPanel) {
    txHistoryToggle.addEventListener('click', () => {
      txHistoryPanel.style.display = txHistoryPanel.style.display === 'none' ? 'block' : 'none';
      // Render transaction history
      if (typeof window.TransactionHistory !== 'undefined') {
        window.TransactionHistory.render('tx-history-list');
      }
    });
  }
  
  if (txHistoryClose && txHistoryPanel) {
    txHistoryClose.addEventListener('click', () => {
      txHistoryPanel.style.display = 'none';
    });
  }
  
  // Check if there are any transactions in history and show toggle
  if (typeof window.TransactionHistory !== 'undefined') {
    const transactions = window.TransactionHistory.getAll();
    if (transactions && transactions.length > 0 && txHistoryToggle) {
      txHistoryToggle.style.display = 'inline-flex';
    }
  }
  
  // Setup event listeners
  const connectBtn = document.getElementById('snoz-connect-btn');
  const disconnectBtn = document.getElementById('snoz-disconnect-btn');
  const walletBtnText = document.getElementById('wallet-btn-text');
  
  if (connectBtn) {
    connectBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      
      if (snozState.connected) {
        // Already connected - do nothing, use disconnect button
        return;
      } else {
        console.log('Connect button clicked, attempting connection...');
        try {
          await connectWallet();
          if (snozState.connected) {
            await refreshSnozData();
            // Update button text and show disconnect
            if (walletBtnText) {
              walletBtnText.textContent = snozState.address ? 
                snozState.address.slice(0, 6) + '...' + snozState.address.slice(-4) : 
                'Connected';
            }
            connectBtn.classList.add('connected');
            if (disconnectBtn) disconnectBtn.style.display = 'inline-flex';
          }
        } catch (error) {
          console.error('Connection error:', error);
          showWalletNotification('Connection failed. Please try again.');
        }
      }
    });
    console.log('Connect button listener attached');
  } else {
    console.warn('Connect button not found in DOM');
  }
  
  // Disconnect button handler
  if (disconnectBtn) {
    disconnectBtn.addEventListener('click', (e) => {
      e.preventDefault();
      disconnectWallet();
      // Reset button text
      if (walletBtnText) walletBtnText.textContent = 'Connect Wallet';
      if (connectBtn) connectBtn.classList.remove('connected');
      disconnectBtn.style.display = 'none';
    });
  }
  
  // Setup rewards preview listeners
  const tipInput = document.getElementById('preview-tip-amount');
  if (tipInput) {
    tipInput.addEventListener('input', updateRewardsPreview);
  }
  
  const contentInput = document.getElementById('preview-content-amount');
  if (contentInput) {
    contentInput.addEventListener('input', updateRewardsPreview);
  }
  
  // Initial UI update
  updateSnozUI();
  
  // Auto-refresh every 30 seconds if connected
  setInterval(() => {
    if (snozState.connected) {
      refreshSnozData();
    }
  }, 30000);
  
  // Add wallet detection check after a short delay (wallets inject async)
  setTimeout(() => {
    console.log('Delayed wallet check:', isWalletAvailable() ? 'Wallet found' : 'No wallet detected');
    if (isWalletAvailable()) {
      const provider = getWalletProvider();
      console.log('Wallet provider:', provider?.name);
    }
  }, 1000);
  
  console.log('SNOZ integration initialized');
}

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initSnozIntegration);
} else {
  initSnozIntegration();
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    SNOZ_CONFIG,
    snozState,
    connectWallet,
    disconnectWallet,
    refreshSnozData,
    formatSnoz,
    getTierFromBalance,
    getTierProgress,
    debugWalletDetection,
    logTransaction,
    updateConnectionStatus
  };
}
