/**
 * SNOZCOIN UI Components
 * 
 * Enhanced frontend components for better UX:
 * - Toast notifications
 * - Loading states
 * - Transaction history
 * - Error handling
 */

// ============================================
// TOAST NOTIFICATION SYSTEM
// ============================================

class ToastManager {
  constructor() {
    this.container = null;
    this.toasts = [];
    this.init();
  }

  init() {
    // Create toast container if it doesn't exist
    if (!document.querySelector('.toast-container')) {
      this.container = document.createElement('div');
      this.container.className = 'toast-container';
      document.body.appendChild(this.container);
    } else {
      this.container = document.querySelector('.toast-container');
    }
  }

  /**
   * Show a toast notification
   * @param {Object} options - Toast options
   * @param {string} options.type - 'success' | 'error' | 'warning' | 'info'
   * @param {string} options.title - Toast title
   * @param {string} options.message - Toast message
   * @param {number} options.duration - Duration in ms (default: 5000)
   */
  show({ type = 'info', title, message, duration = 5000 }) {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    const icons = {
      success: '✓',
      error: '✕',
      warning: '⚠',
      info: 'ℹ'
    };

    toast.innerHTML = `
      <div class="toast-icon">${icons[type]}</div>
      <div class="toast-content">
        <div class="toast-title">${title}</div>
        ${message ? `<div class="toast-message">${message}</div>` : ''}
      </div>
      <button class="toast-close" aria-label="Close">&times;</button>
    `;

    // Add to container
    this.container.appendChild(toast);
    this.toasts.push(toast);

    // Trigger animation
    requestAnimationFrame(() => {
      toast.classList.add('show');
    });

    // Close button handler
    toast.querySelector('.toast-close').addEventListener('click', () => {
      this.dismiss(toast);
    });

    // Auto dismiss
    if (duration > 0) {
      setTimeout(() => {
        this.dismiss(toast);
      }, duration);
    }

    return toast;
  }

  dismiss(toast) {
    toast.classList.remove('show');
    toast.classList.add('hide');
    
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
      this.toasts = this.toasts.filter(t => t !== toast);
    }, 400);
  }

  // Convenience methods
  success(title, message) {
    return this.show({ type: 'success', title, message });
  }

  error(title, message) {
    return this.show({ type: 'error', title, message, duration: 8000 });
  }

  warning(title, message) {
    return this.show({ type: 'warning', title, message });
  }

  info(title, message) {
    return this.show({ type: 'info', title, message });
  }
}

// Global toast instance
const toast = new ToastManager();

// ============================================
// LOADING STATE MANAGER
// ============================================

class LoadingManager {
  /**
   * Add loading overlay to an element
   * @param {HTMLElement} element - Target element
   * @param {string} text - Loading text
   */
  static show(element, text = 'Loading...') {
    // Remove existing overlay if any
    this.hide(element);
    
    const overlay = document.createElement('div');
    overlay.className = 'loading-overlay';
    overlay.innerHTML = `
      <div class="spinner spinner-lg"></div>
      <div class="loading-text">${text}</div>
    `;
    
    // Ensure parent has position
    const position = window.getComputedStyle(element).position;
    if (position === 'static') {
      element.style.position = 'relative';
    }
    
    element.appendChild(overlay);
    
    // Trigger animation
    requestAnimationFrame(() => {
      overlay.classList.add('active');
    });
  }

  static hide(element) {
    const overlay = element.querySelector('.loading-overlay');
    if (overlay) {
      overlay.classList.remove('active');
      setTimeout(() => {
        if (overlay.parentNode) {
          overlay.parentNode.removeChild(overlay);
        }
      }, 300);
    }
  }

  /**
   * Show skeleton loader
   * @param {HTMLElement} element - Target element
   * @param {number} count - Number of skeleton items
   */
  static showSkeleton(element, count = 3) {
    element.innerHTML = '';
    for (let i = 0; i < count; i++) {
      const skeleton = document.createElement('div');
      skeleton.className = 'skeleton skeleton-card';
      skeleton.style.marginBottom = '0.75rem';
      element.appendChild(skeleton);
    }
  }
}

// ============================================
// TRANSACTION HISTORY COMPONENT
// ============================================

class TransactionHistory {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.transactions = [];
    this.isLoading = false;
  }

  /**
   * Render the transaction history panel
   */
  render() {
    if (!this.container) return;

    this.container.innerHTML = `
      <div class="tx-history-panel">
        <div class="tx-history-header">
          <h3>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 8v4l3 3"></path>
              <circle cx="12" cy="12" r="10"></circle>
            </svg>
            Transaction History
          </h3>
          <button class="tx-refresh-btn" id="txRefreshBtn" title="Refresh">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M23 4v6h-6"></path>
              <path d="M1 20v-6h6"></path>
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
            </svg>
          </button>
        </div>
        <div class="tx-list" id="txList">
          ${this.renderTransactions()}
        </div>
      </div>
    `;

    // Attach refresh handler
    document.getElementById('txRefreshBtn')?.addEventListener('click', () => {
      this.refresh();
    });
  }

  renderTransactions() {
    if (this.isLoading) {
      return `
        <div class="skeleton skeleton-card"></div>
        <div class="skeleton skeleton-card"></div>
        <div class="skeleton skeleton-card"></div>
      `;
    }

    if (this.transactions.length === 0) {
      return `
        <div class="tx-empty">
          <div class="tx-empty-icon">📋</div>
          <p>No transactions yet</p>
          <p style="font-size: 0.85rem;">Your transaction history will appear here</p>
        </div>
      `;
    }

    return this.transactions.map(tx => this.renderTransaction(tx)).join('');
  }

  renderTransaction(tx) {
    const typeIcons = {
      tip: '💝',
      purchase: '🛒',
      reward: '🎁',
      transfer: '↔️'
    };

    const statusClass = tx.status || 'confirmed';
    const amountClass = tx.amount >= 0 ? 'positive' : 'negative';
    const amountPrefix = tx.amount >= 0 ? '+' : '';

    return `
      <div class="tx-item">
        <div class="tx-icon ${tx.type}">${typeIcons[tx.type] || '📄'}</div>
        <div class="tx-details">
          <div class="tx-title">${tx.title}</div>
          <div class="tx-subtitle">
            <span class="tx-status ${statusClass}">${statusClass}</span>
            <span>${this.formatTime(tx.timestamp)}</span>
          </div>
        </div>
        <div class="tx-amount">
          <div class="tx-amount-value ${amountClass}">
            ${amountPrefix}${tx.amount} ${tx.currency}
          </div>
          ${tx.usdValue ? `<div class="tx-amount-usd">≈ $${tx.usdValue}</div>` : ''}
        </div>
      </div>
    `;
  }

  formatTime(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    if (diff < 604800000) return `${Math.floor(diff / 86400000)}d ago`;
    
    return date.toLocaleDateString();
  }

  async refresh() {
    const refreshBtn = document.getElementById('txRefreshBtn');
    if (refreshBtn) {
      refreshBtn.classList.add('refreshing');
    }

    this.isLoading = true;
    this.updateList();

    try {
      // Fetch transactions from API
      await this.fetchTransactions();
      toast.success('Refreshed', 'Transaction history updated');
    } catch (error) {
      toast.error('Error', 'Failed to refresh transactions');
    } finally {
      this.isLoading = false;
      this.updateList();
      if (refreshBtn) {
        refreshBtn.classList.remove('refreshing');
      }
    }
  }

  async fetchTransactions() {
    // Simulate API call - replace with actual Stacks API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Mock data for demonstration
    this.transactions = [
      {
        type: 'tip',
        title: 'Tip to Creator',
        amount: -5,
        currency: 'STX',
        usdValue: '2.50',
        status: 'confirmed',
        timestamp: Date.now() - 300000
      },
      {
        type: 'reward',
        title: 'SNOZ Reward Earned',
        amount: 10,
        currency: 'SNOZ',
        status: 'confirmed',
        timestamp: Date.now() - 3600000
      },
      {
        type: 'purchase',
        title: 'Content Purchase',
        amount: -15,
        currency: 'STX',
        usdValue: '7.50',
        status: 'confirmed',
        timestamp: Date.now() - 86400000
      }
    ];
  }

  updateList() {
    const listEl = document.getElementById('txList');
    if (listEl) {
      listEl.innerHTML = this.renderTransactions();
    }
  }

  addTransaction(tx) {
    this.transactions.unshift(tx);
    this.updateList();
  }
}

// ============================================
// ERROR HANDLING
// ============================================

class ErrorHandler {
  /**
   * Show error state in an element
   * @param {HTMLElement} element - Target element
   * @param {Object} options - Error options
   */
  static showError(element, { title = 'Something went wrong', message = '', onRetry = null }) {
    element.innerHTML = `
      <div class="error-state">
        <div class="error-icon">😕</div>
        <div class="error-title">${title}</div>
        <div class="error-message">${message}</div>
        ${onRetry ? '<button class="retry-btn">Try Again</button>' : ''}
      </div>
    `;

    if (onRetry) {
      element.querySelector('.retry-btn')?.addEventListener('click', onRetry);
    }
  }

  /**
   * Handle async operations with error handling
   * @param {Function} asyncFn - Async function to execute
   * @param {Object} options - Options for error handling
   */
  static async withErrorHandling(asyncFn, { 
    loadingElement = null, 
    loadingText = 'Loading...',
    successMessage = null,
    errorMessage = 'An error occurred'
  } = {}) {
    if (loadingElement) {
      LoadingManager.show(loadingElement, loadingText);
    }

    try {
      const result = await asyncFn();
      
      if (successMessage) {
        toast.success('Success', successMessage);
      }
      
      return result;
    } catch (error) {
      console.error('Operation failed:', error);
      toast.error('Error', errorMessage);
      throw error;
    } finally {
      if (loadingElement) {
        LoadingManager.hide(loadingElement);
      }
    }
  }
}

// ============================================
// WALLET CONNECTION UI
// ============================================

class WalletConnectionUI {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.isConnected = false;
    this.address = null;
    this.network = 'mainnet';
  }

  render() {
    if (!this.container) return;

    if (this.isConnected && this.address) {
      this.renderConnected();
    } else {
      this.renderDisconnected();
    }
  }

  renderDisconnected() {
    this.container.innerHTML = `
      <div class="wallet-section">
        <h3>Connect Your Wallet</h3>
        <p>Connect your Stacks wallet to access all features</p>
        <div class="wallet-options">
          <button class="wallet-option" data-wallet="leather">
            <img src="https://leather.io/leather-logo.png" alt="Leather" onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><rect fill=%22%23f59e0b%22 width=%22100%22 height=%22100%22 rx=%2220%22/><text x=%2250%22 y=%2265%22 font-size=%2250%22 text-anchor=%22middle%22 fill=%22white%22>L</text></svg>'">
            <span>Leather</span>
          </button>
          <button class="wallet-option" data-wallet="xverse">
            <img src="https://www.xverse.app/xverse-logo.png" alt="Xverse" onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><rect fill=%22%238b5cf6%22 width=%22100%22 height=%22100%22 rx=%2220%22/><text x=%2250%22 y=%2265%22 font-size=%2250%22 text-anchor=%22middle%22 fill=%22white%22>X</text></svg>'">
            <span>Xverse</span>
          </button>
        </div>
      </div>
    `;

    // Attach click handlers
    this.container.querySelectorAll('.wallet-option').forEach(btn => {
      btn.addEventListener('click', () => {
        const wallet = btn.dataset.wallet;
        this.connect(wallet);
      });
    });
  }

  renderConnected() {
    const shortAddress = `${this.address.slice(0, 6)}...${this.address.slice(-4)}`;
    const initial = this.address.slice(2, 4).toUpperCase();

    this.container.innerHTML = `
      <div class="wallet-section">
        <div class="wallet-connected">
          <div class="wallet-avatar">${initial}</div>
          <div class="wallet-info">
            <div class="wallet-address">${shortAddress}</div>
            <div class="wallet-network">
              <span class="wallet-network-dot"></span>
              ${this.network === 'mainnet' ? 'Stacks Mainnet' : 'Stacks Testnet'}
            </div>
          </div>
          <button class="disconnect-btn" id="disconnectWallet">Disconnect</button>
        </div>
      </div>
    `;

    document.getElementById('disconnectWallet')?.addEventListener('click', () => {
      this.disconnect();
    });
  }

  async connect(walletType) {
    toast.info('Connecting...', `Opening ${walletType} wallet`);

    try {
      // Use the existing connectWallet function if available
      if (typeof connectWallet === 'function') {
        const result = await connectWallet();
        if (result) {
          this.isConnected = true;
          this.address = result.address || snozState?.address;
          this.render();
          toast.success('Connected!', `Wallet connected successfully`);
        }
      } else {
        // Fallback mock connection
        await new Promise(resolve => setTimeout(resolve, 1500));
        this.isConnected = true;
        this.address = 'SP1PTBC7PP2X11N7M3K2BTF5HWRDK4J8QMGNFTEY5';
        this.render();
        toast.success('Connected!', 'Wallet connected successfully');
      }
    } catch (error) {
      toast.error('Connection Failed', error.message || 'Could not connect wallet');
    }
  }

  disconnect() {
    this.isConnected = false;
    this.address = null;
    this.render();
    toast.info('Disconnected', 'Wallet disconnected');
    
    // Clear global state if exists
    if (typeof snozState !== 'undefined') {
      snozState.connected = false;
      snozState.address = null;
    }
  }
}

// ============================================
// COPY TO CLIPBOARD
// ============================================

function copyToClipboard(text, successMessage = 'Copied to clipboard!') {
  navigator.clipboard.writeText(text).then(() => {
    toast.success('Copied', successMessage);
  }).catch(err => {
    toast.error('Failed', 'Could not copy to clipboard');
    console.error('Copy failed:', err);
  });
}

// ============================================
// INITIALIZATION
// ============================================

document.addEventListener('DOMContentLoaded', () => {
  console.log('🎨 UI Components loaded');
  
  // Initialize transaction history if container exists
  const txHistoryContainer = document.getElementById('transactionHistory');
  if (txHistoryContainer) {
    const txHistory = new TransactionHistory('transactionHistory');
    txHistory.render();
    window.txHistory = txHistory; // Make accessible globally
  }
  
  // Initialize wallet UI if container exists
  const walletContainer = document.getElementById('walletConnection');
  if (walletContainer) {
    const walletUI = new WalletConnectionUI('walletConnection');
    walletUI.render();
    window.walletUI = walletUI; // Make accessible globally
  }
});

// Export for use in other scripts
window.toast = toast;
window.LoadingManager = LoadingManager;
window.ErrorHandler = ErrorHandler;
window.TransactionHistory = TransactionHistory;
window.WalletConnectionUI = WalletConnectionUI;
window.copyToClipboard = copyToClipboard;
