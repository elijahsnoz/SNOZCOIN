/**
 * SNOZCOIN Creator Dashboard
 * 
 * Dashboard functionality for creators to:
 * - View their earnings and statistics
 * - Track content performance
 * - Monitor activity and rewards
 */

// ============================================
// DASHBOARD STATE
// ============================================

const DashboardState = {
  isConnected: false,
  address: null,
  userData: null,
  isDemo: true, // Set to false when contracts deployed
  
  // Demo data for visualization
  demoData: {
    username: 'Demo Creator',
    address: 'SP1PTBC7PP2X11N7M3K2BTF5HWRDK4J8QMGNFTEY5',
    tier: 'silver',
    totalEarnings: 245.50,
    earningsChange: '+18.3',
    tipsReceived: 47,
    supporters: 23,
    contentCount: 12,
    totalUnlocks: 89,
    snozBalance: 1250,
    activities: [
      { type: 'tip', title: 'Received tip', from: 'SP2...XYZ', amount: '5 STX', time: '2 hours ago' },
      { type: 'unlock', title: 'Content unlocked', content: 'Premium Tutorial #3', amount: '2 STX', time: '5 hours ago' },
      { type: 'reward', title: 'SNOZ reward earned', action: 'Daily activity bonus', amount: '50 SNOZ', time: '1 day ago' },
      { type: 'tip', title: 'Received tip', from: 'SP3...ABC', amount: '10 STX', time: '2 days ago' },
    ]
  }
};

// ============================================
// DASHBOARD INITIALIZATION
// ============================================

document.addEventListener('DOMContentLoaded', () => {
  initDashboard();
  setupEventListeners();
});

function initDashboard() {
  // Check if wallet already connected
  checkWalletConnection();
  
  // If demo mode, show demo data when "connected"
  if (DashboardState.isDemo) {
    console.log('[Dashboard] Running in demo mode');
  }
}

function setupEventListeners() {
  // Connect wallet buttons
  const connectButtons = document.querySelectorAll('.wallet-connect-trigger');
  connectButtons.forEach(btn => {
    btn.addEventListener('click', handleConnectWallet);
  });

  // Period selector buttons
  const periodButtons = document.querySelectorAll('.period-btn');
  periodButtons.forEach(btn => {
    btn.addEventListener('click', handlePeriodChange);
  });
}

// ============================================
// WALLET CONNECTION
// ============================================

async function checkWalletConnection() {
  try {
    // Check if snozStacks is available and has connection info
    if (typeof snozStacks !== 'undefined' && snozStacks.isConnected()) {
      const userData = snozStacks.getUserData();
      if (userData) {
        handleWalletConnected(userData);
        return;
      }
    }
  } catch (error) {
    console.log('[Dashboard] No existing wallet connection');
  }
  
  // Show not connected state
  showNotConnectedState();
}

async function handleConnectWallet(e) {
  e.preventDefault();
  
  // Use the wallet modal if available
  if (typeof openWalletModal === 'function') {
    openWalletModal();
    return;
  }
  
  // Fallback to direct connection
  try {
    if (typeof snozStacks !== 'undefined') {
      const userData = await snozStacks.connect();
      if (userData) {
        handleWalletConnected(userData);
      }
    }
  } catch (error) {
    console.error('[Dashboard] Connection failed:', error);
    if (typeof toast !== 'undefined') {
      toast.error('Connection Failed', 'Could not connect to wallet. Please try again.');
    }
  }
}

function handleWalletConnected(userData) {
  DashboardState.isConnected = true;
  DashboardState.address = userData.profile?.stxAddress?.mainnet || userData.profile?.stxAddress?.testnet;
  DashboardState.userData = userData;
  
  showConnectedState();
  loadDashboardData();
}

// ============================================
// UI STATE MANAGEMENT
// ============================================

function showNotConnectedState() {
  const notConnected = document.getElementById('dashboard-not-connected');
  const connected = document.getElementById('dashboard-connected');
  
  if (notConnected) notConnected.style.display = 'block';
  if (connected) connected.style.display = 'none';
  
  // Update nav button
  updateNavButton(false);
}

function showConnectedState() {
  const notConnected = document.getElementById('dashboard-not-connected');
  const connected = document.getElementById('dashboard-connected');
  
  if (notConnected) notConnected.style.display = 'none';
  if (connected) connected.style.display = 'block';
  
  // Update nav button
  updateNavButton(true);
}

function updateNavButton(isConnected) {
  const navBtn = document.getElementById('dashboard-connect-btn');
  if (!navBtn) return;
  
  if (isConnected && DashboardState.address) {
    const shortAddr = `${DashboardState.address.slice(0, 6)}...${DashboardState.address.slice(-4)}`;
    navBtn.innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18">
        <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/>
        <polyline points="22 4 12 14.01 9 11.01"/>
      </svg>
      ${shortAddr}
    `;
    navBtn.classList.add('connected');
  }
}

// ============================================
// DATA LOADING
// ============================================

async function loadDashboardData() {
  if (DashboardState.isDemo) {
    // Load demo data
    populateDemoData();
    return;
  }
  
  try {
    // TODO: Fetch real data from Stacks blockchain
    // const earnings = await fetchCreatorEarnings(DashboardState.address);
    // const activity = await fetchCreatorActivity(DashboardState.address);
    // populateRealData(earnings, activity);
    
    console.log('[Dashboard] Would fetch real data here');
  } catch (error) {
    console.error('[Dashboard] Failed to load data:', error);
    if (typeof toast !== 'undefined') {
      toast.error('Data Error', 'Failed to load dashboard data.');
    }
  }
}

function populateDemoData() {
  const data = DashboardState.demoData;
  
  // Update user card
  updateElement('dashboard-username', data.username);
  updateElement('dashboard-address', formatAddress(data.address));
  
  const tierEl = document.querySelector('#dashboard-tier .tier-value');
  if (tierEl) {
    tierEl.textContent = capitalize(data.tier);
    tierEl.className = `tier-value ${data.tier}`;
  }
  
  // Update stats
  updateElement('stat-total-earnings', `${data.totalEarnings.toFixed(2)} STX`);
  updateElement('stat-tips-received', data.tipsReceived.toString());
  updateElement('stat-content-count', data.contentCount.toString());
  updateElement('stat-snoz-balance', `${data.snozBalance.toLocaleString()} SNOZ`);
  
  // Update stat changes
  const earningsChange = document.querySelector('#stat-total-earnings')?.closest('.dashboard-stat-card')?.querySelector('.stat-change');
  if (earningsChange) {
    earningsChange.textContent = `${data.earningsChange}% this month`;
    earningsChange.className = 'stat-change positive';
  }
  
  const tipsChange = document.querySelector('#stat-tips-received')?.closest('.dashboard-stat-card')?.querySelector('.stat-change');
  if (tipsChange) {
    tipsChange.textContent = `From ${data.supporters} supporters`;
  }
  
  const contentChange = document.querySelector('#stat-content-count')?.closest('.dashboard-stat-card')?.querySelector('.stat-change');
  if (contentChange) {
    contentChange.textContent = `${data.totalUnlocks} unlocks total`;
  }
  
  // Populate activity list
  populateActivityList(data.activities);
}

function populateActivityList(activities) {
  const container = document.getElementById('activity-list');
  if (!container || !activities.length) return;
  
  container.innerHTML = activities.map(activity => `
    <div class="activity-item">
      <div class="activity-icon ${activity.type}">
        ${getActivityIcon(activity.type)}
      </div>
      <div class="activity-details">
        <div class="activity-title">${activity.title}</div>
        <div class="activity-meta">${activity.from || activity.content || activity.action} · ${activity.time}</div>
      </div>
      <div class="activity-amount">${activity.amount}</div>
    </div>
  `).join('');
}

function getActivityIcon(type) {
  const icons = {
    tip: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18">
      <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
    </svg>`,
    unlock: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
      <path d="M7 11V7a5 5 0 019.9-1"/>
    </svg>`,
    reward: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18">
      <circle cx="12" cy="12" r="10"/>
      <path d="M16 8l-4 4-4-4M8 16l4-4 4 4"/>
    </svg>`
  };
  return icons[type] || icons.reward;
}

// ============================================
// PERIOD SELECTOR
// ============================================

function handlePeriodChange(e) {
  const btn = e.target;
  const period = btn.dataset.period;
  
  // Update active state
  document.querySelectorAll('.period-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  
  // In real implementation, this would fetch different time ranges
  console.log(`[Dashboard] Period changed to: ${period}`);
  
  // TODO: Reload chart data for selected period
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

function updateElement(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

function formatAddress(address) {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// ============================================
// LISTEN FOR WALLET EVENTS
// ============================================

// Listen for wallet connection from modal
window.addEventListener('snoz:wallet:connected', (e) => {
  if (e.detail) {
    handleWalletConnected(e.detail);
  }
});

window.addEventListener('snoz:wallet:disconnected', () => {
  DashboardState.isConnected = false;
  DashboardState.address = null;
  DashboardState.userData = null;
  showNotConnectedState();
});

// Export for use
window.DashboardState = DashboardState;
window.loadDashboardData = loadDashboardData;
