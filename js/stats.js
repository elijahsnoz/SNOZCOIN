/**
 * SNOZCOIN Platform Statistics
 * 
 * Handles fetching and displaying platform-wide statistics
 * including metrics, leaderboards, and token data.
 */

// ============================================
// STATS STATE
// ============================================

const StatsState = {
  isDemo: true, // Set to false when contracts deployed
  refreshInterval: null,
  lastUpdate: new Date(),
  
  // Demo data
  demoData: {
    keyMetrics: {
      networkActivity: 78,
      totalValueTransferred: 127450,
      totalUsers: 2847,
      usersChange: 156
    },
    overview: {
      totalTips: 12847,
      activeCreators: 156,
      contentPieces: 1234,
      snozDistributed: 2400000,
      totalTransactions: 8921,
      averageTip: 2.5
    },
    token: {
      totalSupply: 10000000000,
      circulatingSupply: 2400000,
      holders: 847,
      rewardsPool: 7600000000
    },
    tierDistribution: {
      bronze: { percent: 45, count: 381 },
      silver: { percent: 28, count: 237 },
      gold: { percent: 15, count: 127 },
      platinum: { percent: 9, count: 76 },
      diamond: { percent: 3, count: 26 }
    },
    leaderboard: [
      { rank: 1, name: 'AliceCreator', avatar: 'A', tips: 847, content: 45, tier: 'diamond' },
      { rank: 2, name: 'BobBuilder', avatar: 'B', tips: 623, content: 38, tier: 'platinum' },
      { rank: 3, name: 'CryptoCarol', avatar: 'C', tips: 512, content: 32, tier: 'platinum' },
      { rank: 4, name: 'DaveDigital', avatar: 'D', tips: 389, content: 27, tier: 'gold' },
      { rank: 5, name: 'EveExplorer', avatar: 'E', tips: 278, content: 21, tier: 'gold' }
    ]
  }
};

// ============================================
// INITIALIZATION
// ============================================

document.addEventListener('DOMContentLoaded', () => {
  initStats();
  setupEventListeners();
});

function initStats() {
  console.log('[Stats] Initializing statistics page');
  
  // Animate ring on load
  animateRings();
  
  // Update last updated time
  updateLastUpdatedTime();
  
  // Start refresh interval for last updated time
  setInterval(updateLastUpdatedTime, 60000);
  
  if (!StatsState.isDemo) {
    // Start live data fetching
    startLiveUpdates();
  }
}

function setupEventListeners() {
  // Wallet connect buttons
  const connectButtons = document.querySelectorAll('.wallet-connect-trigger');
  connectButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      if (typeof openWalletModal === 'function') {
        openWalletModal();
      }
    });
  });
}

// ============================================
// ANIMATIONS
// ============================================

function animateRings() {
  const rings = document.querySelectorAll('.metric-ring');
  
  rings.forEach(ring => {
    const percent = ring.dataset.percent || 0;
    const progressPath = ring.querySelector('.ring-progress');
    
    if (progressPath) {
      // Animate from 0 to target
      setTimeout(() => {
        progressPath.style.strokeDasharray = `${percent}, 100`;
      }, 300);
    }
  });
}

function animateCounters() {
  const counters = document.querySelectorAll('[data-counter]');
  
  counters.forEach(counter => {
    const target = parseFloat(counter.dataset.counter);
    const duration = 1500;
    const startTime = performance.now();
    
    const animate = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const current = target * easeOut;
      
      counter.textContent = formatNumber(current, counter.dataset.format);
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    
    requestAnimationFrame(animate);
  });
}

// ============================================
// DATA FETCHING
// ============================================

async function startLiveUpdates() {
  // Initial fetch
  await fetchLiveStats();
  
  // Refresh every 30 seconds
  StatsState.refreshInterval = setInterval(fetchLiveStats, 30000);
}

async function fetchLiveStats() {
  try {
    // TODO: Replace with actual Stacks API calls when contracts are deployed
    console.log('[Stats] Would fetch live stats here');
    
    // Example API calls:
    // const totalTips = await fetchContractData('snoz-rewards-engine', 'get-total-tips-volume');
    // const creatorCount = await fetchContractData('snoz-token', 'get-creator-count');
    // const tokenStats = await fetchTokenStats();
    
    StatsState.lastUpdate = new Date();
    updateLastUpdatedTime();
  } catch (error) {
    console.error('[Stats] Failed to fetch live stats:', error);
  }
}

async function fetchContractData(contractName, functionName) {
  // Placeholder for Stacks API call
  const contractAddress = 'SP1PTBC7PP2X11N7M3K2BTF5HWRDK4J8QMGNFTEY5';
  const url = `https://stacks-node-api.mainnet.stacks.co/v2/contracts/call-read/${contractAddress}/${contractName}/${functionName}`;
  
  // Would make actual API call here
  return null;
}

// ============================================
// LEADERBOARD
// ============================================

function populateLeaderboard(data) {
  const container = document.getElementById('leaderboard-list');
  if (!container || !data) return;
  
  container.innerHTML = data.map((creator, index) => {
    const rankEmoji = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '';
    const rankClass = index < 3 ? `rank-${index + 1}` : '';
    
    return `
      <div class="leaderboard-item ${rankClass}">
        <span class="lb-rank">${rankEmoji} ${creator.rank}</span>
        <span class="lb-creator">
          <span class="creator-avatar">${creator.avatar}</span>
          <span class="creator-name">${creator.name}</span>
        </span>
        <span class="lb-tips">${creator.tips} STX</span>
        <span class="lb-content">${creator.content}</span>
        <span class="lb-tier ${creator.tier}">${capitalize(creator.tier)}</span>
      </div>
    `;
  }).join('');
}

// ============================================
// UI UPDATES
// ============================================

function updateLastUpdatedTime() {
  const el = document.getElementById('last-update-time');
  if (!el) return;
  
  const now = new Date();
  const diff = Math.floor((now - StatsState.lastUpdate) / 1000);
  
  let text;
  if (diff < 60) {
    text = 'Just now';
  } else if (diff < 3600) {
    const mins = Math.floor(diff / 60);
    text = `${mins} minute${mins > 1 ? 's' : ''} ago`;
  } else {
    const hours = Math.floor(diff / 3600);
    text = `${hours} hour${hours > 1 ? 's' : ''} ago`;
  }
  
  el.textContent = text;
}

function updateMetric(id, value, format = 'number') {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = formatNumber(value, format);
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

function formatNumber(num, format = 'number') {
  if (format === 'currency') {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(num);
  }
  
  if (format === 'compact') {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toLocaleString();
  }
  
  return num.toLocaleString('en-US');
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// ============================================
// CLEANUP
// ============================================

window.addEventListener('beforeunload', () => {
  if (StatsState.refreshInterval) {
    clearInterval(StatsState.refreshInterval);
  }
});

// Export for external use
window.StatsState = StatsState;
window.fetchLiveStats = fetchLiveStats;
