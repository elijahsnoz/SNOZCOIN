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
// CONNECTION STATUS INDICATOR
// ============================================

const ConnectionStatus = {
  element: null,
  
  init() {
    this.element = document.getElementById('connection-status');
  },
  
  update(status, message) {
    if (!this.element) {
      this.element = document.getElementById('connection-status');
    }
    
    if (!this.element) return;
    
    const dot = this.element.querySelector('.status-dot');
    const text = this.element.querySelector('.status-text');
    
    // Remove all status classes
    this.element.classList.remove('status-checking', 'status-connected', 'status-disconnected', 'status-error', 'status-connecting');
    
    // Add new status class
    this.element.classList.add(`status-${status}`);
    
    // Update dot color
    if (dot) {
      dot.className = 'status-dot';
      if (status === 'connected') {
        dot.style.background = '#00d1b2';
      } else if (status === 'error') {
        dot.style.background = '#ff3860';
      } else if (status === 'connecting' || status === 'checking') {
        dot.style.background = '#ffdd57';
      } else {
        dot.style.background = '#666';
      }
    }
    
    // Update text
    if (text) {
      text.textContent = message;
    }
    
    // Hide after connected or show for errors
    if (status === 'connected') {
      setTimeout(() => {
        if (this.element) {
          this.element.style.opacity = '0';
          setTimeout(() => {
            if (this.element) this.element.style.display = 'none';
          }, 300);
        }
      }, 2000);
    } else if (status === 'disconnected') {
      this.element.style.display = 'none';
    } else {
      this.element.style.display = 'flex';
      this.element.style.opacity = '1';
    }
  }
};

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
// WALLET CONNECTION MODAL
// ============================================

class WalletModal {
  constructor() {
    this.modal = null;
    this.isOpen = false;
    this.currentState = 'select'; // 'select' | 'connecting' | 'success' | 'error' | 'no-wallet'
    this.init();
  }

  init() {
    // Create modal if it doesn't exist
    if (!document.getElementById('wallet-modal')) {
      this.createModal();
    }
    this.modal = document.getElementById('wallet-modal');
    this.bindEvents();
  }

  createModal() {
    const modalHTML = `
      <div id="wallet-modal" class="wallet-modal" role="dialog" aria-modal="true" aria-labelledby="wallet-modal-title">
        <div class="wallet-modal-backdrop"></div>
        <div class="wallet-modal-container">
          <div class="wallet-modal-content">
            <!-- Header -->
            <div class="wallet-modal-header">
              <h2 id="wallet-modal-title">Connect Wallet</h2>
              <button class="wallet-modal-close" aria-label="Close modal">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M18 6L6 18M6 6l12 12"/>
                </svg>
              </button>
            </div>

            <!-- Body - Different states -->
            <div class="wallet-modal-body">
              <!-- Wallet Selection State -->
              <div class="wallet-state" id="wallet-state-select">
                <p class="wallet-modal-description">Choose a wallet to connect to SNOZCOIN. Your wallet will be used to sign transactions securely.</p>
                
                <div class="wallet-list">
                  <button class="wallet-item" data-wallet="leather">
                    <div class="wallet-item-icon">
                      <img src="https://leather.io/logo.png" alt="Leather" onerror="this.innerHTML='👝'; this.style.fontSize='1.5rem';">
                    </div>
                    <div class="wallet-item-info">
                      <span class="wallet-item-name">Leather</span>
                      <span class="wallet-item-desc">Browser extension for Stacks</span>
                    </div>
                    <span class="wallet-item-badge">Recommended</span>
                    <svg class="wallet-item-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M9 18l6-6-6-6"/>
                    </svg>
                  </button>

                  <button class="wallet-item" data-wallet="xverse">
                    <div class="wallet-item-icon">
                      <img src="https://www.xverse.app/icon.png" alt="Xverse" onerror="this.innerHTML='📱'; this.style.fontSize='1.5rem';">
                    </div>
                    <div class="wallet-item-info">
                      <span class="wallet-item-name">Xverse</span>
                      <span class="wallet-item-desc">Mobile & browser wallet</span>
                    </div>
                    <svg class="wallet-item-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M9 18l6-6-6-6"/>
                    </svg>
                  </button>
                </div>

                <div class="wallet-modal-footer">
                  <p class="wallet-security-note">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                    </svg>
                    Non-custodial: We never access your private keys
                  </p>
                </div>
              </div>

              <!-- Connecting State -->
              <div class="wallet-state hidden" id="wallet-state-connecting">
                <div class="wallet-connecting-animation">
                  <div class="wallet-spinner"></div>
                  <p class="connecting-text">Connecting to <span id="connecting-wallet-name">wallet</span>...</p>
                  <p class="connecting-hint">Please approve the connection request in your wallet</p>
                </div>
              </div>

              <!-- Success State -->
              <div class="wallet-state hidden" id="wallet-state-success">
                <div class="wallet-success-content">
                  <div class="success-icon">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <circle cx="12" cy="12" r="10"/>
                      <path d="M9 12l2 2 4-4"/>
                    </svg>
                  </div>
                  <h3>Connected!</h3>
                  <p class="connected-address" id="connected-address">SP1P...FTEY5</p>
                  <div class="success-actions">
                    <button class="btn btn-primary" id="wallet-continue-btn">Continue</button>
                  </div>
                </div>
              </div>

              <!-- Error State -->
              <div class="wallet-state hidden" id="wallet-state-error">
                <div class="wallet-error-content">
                  <div class="error-icon">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <circle cx="12" cy="12" r="10"/>
                      <path d="M15 9l-6 6M9 9l6 6"/>
                    </svg>
                  </div>
                  <h3>Connection Failed</h3>
                  <p class="error-message" id="wallet-error-message">Unable to connect to wallet</p>
                  <div class="error-actions">
                    <button class="btn btn-secondary" id="wallet-retry-btn">Try Again</button>
                    <button class="btn btn-ghost" id="wallet-back-btn">Back to Wallets</button>
                  </div>
                </div>
              </div>

              <!-- No Wallet Detected State -->
              <div class="wallet-state hidden" id="wallet-state-no-wallet">
                <div class="wallet-no-wallet-content">
                  <div class="no-wallet-icon">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <rect x="2" y="4" width="20" height="16" rx="2"/>
                      <path d="M16 12h.01"/>
                      <path d="M12 12h.01"/>
                      <path d="M8 12h.01"/>
                    </svg>
                  </div>
                  <h3>No Wallet Detected</h3>
                  <p>You need a Stacks wallet to use SNOZCOIN. Install one of these trusted wallets:</p>
                  
                  <div class="install-wallet-options">
                    <a href="https://leather.io/install-extension" target="_blank" rel="noopener" class="install-wallet-btn">
                      <span>👝</span>
                      <div>
                        <strong>Install Leather</strong>
                        <small>Recommended for desktop</small>
                      </div>
                    </a>
                    <a href="https://www.xverse.app/download" target="_blank" rel="noopener" class="install-wallet-btn">
                      <span>📱</span>
                      <div>
                        <strong>Install Xverse</strong>
                        <small>Great for mobile</small>
                      </div>
                    </a>
                  </div>

                  <button class="btn btn-ghost" id="wallet-refresh-btn" style="margin-top: 1.5rem;">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M23 4v6h-6M1 20v-6h6"/>
                      <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/>
                    </svg>
                    I've installed a wallet - Refresh
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);
  }

  bindEvents() {
    // Close button
    const closeBtn = this.modal.querySelector('.wallet-modal-close');
    closeBtn?.addEventListener('click', () => this.close());

    // Backdrop click
    const backdrop = this.modal.querySelector('.wallet-modal-backdrop');
    backdrop?.addEventListener('click', () => this.close());

    // Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isOpen) {
        this.close();
      }
    });

    // Wallet selection
    const walletItems = this.modal.querySelectorAll('.wallet-item');
    walletItems.forEach(item => {
      item.addEventListener('click', () => {
        const walletType = item.dataset.wallet;
        this.selectWallet(walletType);
      });
    });

    // Continue button (success state)
    const continueBtn = this.modal.querySelector('#wallet-continue-btn');
    continueBtn?.addEventListener('click', () => this.close());

    // Retry button (error state)
    const retryBtn = this.modal.querySelector('#wallet-retry-btn');
    retryBtn?.addEventListener('click', () => this.selectWallet(this.lastSelectedWallet));

    // Back button (error state)
    const backBtn = this.modal.querySelector('#wallet-back-btn');
    backBtn?.addEventListener('click', () => this.showState('select'));

    // Refresh button (no-wallet state)
    const refreshBtn = this.modal.querySelector('#wallet-refresh-btn');
    refreshBtn?.addEventListener('click', () => {
      window.location.reload();
    });
  }

  open() {
    if (!this.modal) this.init();
    
    // Check if wallet is available first
    if (!this.isWalletAvailable()) {
      this.showState('no-wallet');
    } else {
      this.showState('select');
    }
    
    this.modal.classList.add('open');
    this.isOpen = true;
    document.body.style.overflow = 'hidden';
    
    // Focus trap
    const firstFocusable = this.modal.querySelector('button, [href], input, select, textarea');
    firstFocusable?.focus();
  }

  close() {
    this.modal.classList.remove('open');
    this.isOpen = false;
    document.body.style.overflow = '';
  }

  showState(state) {
    this.currentState = state;
    const states = this.modal.querySelectorAll('.wallet-state');
    states.forEach(s => s.classList.add('hidden'));
    
    const targetState = this.modal.querySelector(`#wallet-state-${state}`);
    if (targetState) {
      targetState.classList.remove('hidden');
    }
  }

  isWalletAvailable() {
    if (typeof window === 'undefined') return false;
    const hasLeather = window.LeatherProvider || window.HiroWalletProvider || (window.btc && window.btc.request);
    const hasXverse = window.XverseProviders || window.BitcoinProvider;
    const hasStacksConnect = window.StacksProvider;
    return hasLeather || hasXverse || hasStacksConnect;
  }

  async selectWallet(walletType) {
    this.lastSelectedWallet = walletType;
    this.showState('connecting');
    
    const walletNameEl = this.modal.querySelector('#connecting-wallet-name');
    if (walletNameEl) {
      walletNameEl.textContent = walletType === 'leather' ? 'Leather' : 'Xverse';
    }

    try {
      // Call the global connectWallet function
      const address = await connectWallet();
      
      if (address) {
        // Success
        const addressEl = this.modal.querySelector('#connected-address');
        if (addressEl) {
          addressEl.textContent = `${address.slice(0, 6)}...${address.slice(-4)}`;
        }
        this.showState('success');
        
        // Auto-close after 2 seconds
        setTimeout(() => {
          this.close();
        }, 2000);
      } else {
        // No address returned - check if wallet was detected
        if (!this.isWalletAvailable()) {
          this.showState('no-wallet');
        } else {
          const errorEl = this.modal.querySelector('#wallet-error-message');
          if (errorEl) {
            errorEl.textContent = 'Connection was cancelled or rejected';
          }
          this.showState('error');
        }
      }
    } catch (error) {
      console.error('Wallet connection error:', error);
      const errorEl = this.modal.querySelector('#wallet-error-message');
      if (errorEl) {
        errorEl.textContent = error.message || 'Unable to connect to wallet';
      }
      this.showState('error');
    }
  }
}

// Create global wallet modal instance
let walletModal = null;

function openWalletModal() {
  if (!walletModal) {
    walletModal = new WalletModal();
  }
  walletModal.open();
}

// ============================================
// ONBOARDING TOOLTIPS SYSTEM
// ============================================

class OnboardingTour {
  constructor() {
    this.steps = [];
    this.currentStep = 0;
    this.isActive = false;
    this.overlay = null;
    this.tooltip = null;
    this.storageKey = 'snozcoin_onboarding_completed';
  }

  /**
   * Define the onboarding steps
   */
  defineSteps() {
    this.steps = [
      {
        target: '#getting-started',
        title: 'Welcome to SNOZCOIN! 👋',
        content: 'This guide will help you get started with the platform. Follow the steps below to set up your wallet and start supporting creators.',
        position: 'bottom',
        highlight: false
      },
      {
        target: '#snoz-connect-btn, .wallet-connect-btn',
        title: 'Connect Your Wallet',
        content: 'Click here to connect your Stacks wallet. You\'ll need Leather or Xverse to interact with the platform.',
        position: 'bottom',
        highlight: true
      },
      {
        target: '#creators',
        title: 'Discover Creators',
        content: 'Browse and support your favorite creators. Tip them directly with STX — no middlemen, no hidden fees.',
        position: 'top',
        highlight: false
      },
      {
        target: '#snoz-token',
        title: 'Earn SNOZ Rewards',
        content: 'Every tip and purchase earns you SNOZ tokens. Build your reputation and unlock exclusive perks!',
        position: 'top',
        highlight: false
      },
      {
        target: '#transparency',
        title: 'Verify Everything',
        content: 'We\'re 100% transparent. Check our open-source code, smart contracts, and security practices anytime.',
        position: 'top',
        highlight: false
      }
    ];
  }

  /**
   * Check if user has completed onboarding
   */
  hasCompleted() {
    return localStorage.getItem(this.storageKey) === 'true';
  }

  /**
   * Mark onboarding as completed
   */
  markCompleted() {
    localStorage.setItem(this.storageKey, 'true');
  }

  /**
   * Reset onboarding (for testing or user request)
   */
  reset() {
    localStorage.removeItem(this.storageKey);
    this.currentStep = 0;
  }

  /**
   * Start the onboarding tour
   */
  start() {
    if (this.isActive) return;
    
    this.defineSteps();
    this.currentStep = 0;
    this.isActive = true;
    this.createOverlay();
    this.showStep(0);
  }

  /**
   * Create the overlay and tooltip elements
   */
  createOverlay() {
    // Create overlay
    if (!this.overlay) {
      this.overlay = document.createElement('div');
      this.overlay.className = 'onboarding-overlay';
      this.overlay.innerHTML = `
        <div class="onboarding-spotlight"></div>
      `;
      document.body.appendChild(this.overlay);
    }

    // Create tooltip
    if (!this.tooltip) {
      this.tooltip = document.createElement('div');
      this.tooltip.className = 'onboarding-tooltip';
      this.tooltip.innerHTML = `
        <div class="onboarding-tooltip-arrow"></div>
        <div class="onboarding-tooltip-content">
          <div class="onboarding-tooltip-header">
            <h4 class="onboarding-tooltip-title"></h4>
            <button class="onboarding-tooltip-close" aria-label="Close tour">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M18 6L6 18M6 6l12 12"/>
              </svg>
            </button>
          </div>
          <p class="onboarding-tooltip-text"></p>
          <div class="onboarding-tooltip-footer">
            <div class="onboarding-progress">
              <span class="onboarding-step-current">1</span> of <span class="onboarding-step-total">5</span>
            </div>
            <div class="onboarding-actions">
              <button class="btn btn-ghost onboarding-skip">Skip Tour</button>
              <button class="btn btn-primary onboarding-next">Next</button>
            </div>
          </div>
        </div>
      `;
      document.body.appendChild(this.tooltip);

      // Bind events
      this.tooltip.querySelector('.onboarding-tooltip-close').addEventListener('click', () => this.end());
      this.tooltip.querySelector('.onboarding-skip').addEventListener('click', () => this.end());
      this.tooltip.querySelector('.onboarding-next').addEventListener('click', () => this.next());
    }

    this.overlay.classList.add('active');
  }

  /**
   * Show a specific step
   */
  showStep(index) {
    if (index < 0 || index >= this.steps.length) {
      this.end();
      return;
    }

    const step = this.steps[index];
    const target = document.querySelector(step.target);

    if (!target) {
      // Target not found, skip to next step
      console.warn(`Onboarding target not found: ${step.target}`);
      this.next();
      return;
    }

    // Scroll target into view
    target.scrollIntoView({ behavior: 'smooth', block: 'center' });

    // Wait for scroll to complete
    setTimeout(() => {
      this.positionTooltip(target, step);
      this.updateTooltipContent(step, index);
      
      if (step.highlight) {
        this.highlightTarget(target);
      } else {
        this.clearHighlight();
      }
    }, 400);
  }

  /**
   * Position the tooltip relative to target
   */
  positionTooltip(target, step) {
    const rect = target.getBoundingClientRect();
    const tooltipRect = this.tooltip.getBoundingClientRect();
    const padding = 16;

    let top, left;
    
    // Remove previous position classes
    this.tooltip.classList.remove('position-top', 'position-bottom', 'position-left', 'position-right');
    
    switch (step.position) {
      case 'top':
        top = rect.top - tooltipRect.height - padding + window.scrollY;
        left = rect.left + (rect.width / 2) - (tooltipRect.width / 2);
        this.tooltip.classList.add('position-top');
        break;
      case 'bottom':
        top = rect.bottom + padding + window.scrollY;
        left = rect.left + (rect.width / 2) - (tooltipRect.width / 2);
        this.tooltip.classList.add('position-bottom');
        break;
      case 'left':
        top = rect.top + (rect.height / 2) - (tooltipRect.height / 2) + window.scrollY;
        left = rect.left - tooltipRect.width - padding;
        this.tooltip.classList.add('position-left');
        break;
      case 'right':
        top = rect.top + (rect.height / 2) - (tooltipRect.height / 2) + window.scrollY;
        left = rect.right + padding;
        this.tooltip.classList.add('position-right');
        break;
      default:
        top = rect.bottom + padding + window.scrollY;
        left = rect.left + (rect.width / 2) - (tooltipRect.width / 2);
        this.tooltip.classList.add('position-bottom');
    }

    // Keep tooltip within viewport
    left = Math.max(padding, Math.min(left, window.innerWidth - tooltipRect.width - padding));
    
    this.tooltip.style.top = `${top}px`;
    this.tooltip.style.left = `${left}px`;
    this.tooltip.classList.add('active');
  }

  /**
   * Update tooltip content
   */
  updateTooltipContent(step, index) {
    this.tooltip.querySelector('.onboarding-tooltip-title').textContent = step.title;
    this.tooltip.querySelector('.onboarding-tooltip-text').textContent = step.content;
    this.tooltip.querySelector('.onboarding-step-current').textContent = index + 1;
    this.tooltip.querySelector('.onboarding-step-total').textContent = this.steps.length;
    
    // Update button text for last step
    const nextBtn = this.tooltip.querySelector('.onboarding-next');
    if (index === this.steps.length - 1) {
      nextBtn.textContent = 'Get Started!';
    } else {
      nextBtn.textContent = 'Next';
    }
  }

  /**
   * Highlight the target element
   */
  highlightTarget(target) {
    const spotlight = this.overlay.querySelector('.onboarding-spotlight');
    const rect = target.getBoundingClientRect();
    const padding = 8;

    spotlight.style.top = `${rect.top - padding + window.scrollY}px`;
    spotlight.style.left = `${rect.left - padding}px`;
    spotlight.style.width = `${rect.width + padding * 2}px`;
    spotlight.style.height = `${rect.height + padding * 2}px`;
    spotlight.classList.add('active');
  }

  /**
   * Clear highlight
   */
  clearHighlight() {
    const spotlight = this.overlay.querySelector('.onboarding-spotlight');
    spotlight.classList.remove('active');
  }

  /**
   * Go to next step
   */
  next() {
    this.currentStep++;
    if (this.currentStep >= this.steps.length) {
      this.end();
    } else {
      this.showStep(this.currentStep);
    }
  }

  /**
   * Go to previous step
   */
  prev() {
    this.currentStep = Math.max(0, this.currentStep - 1);
    this.showStep(this.currentStep);
  }

  /**
   * End the tour
   */
  end() {
    this.isActive = false;
    this.markCompleted();
    
    if (this.overlay) {
      this.overlay.classList.remove('active');
    }
    if (this.tooltip) {
      this.tooltip.classList.remove('active');
    }
    this.clearHighlight();

    // Show completion toast
    if (toast) {
      toast.success('Tour Complete!', 'You\'re all set to start using SNOZCOIN');
    }
  }
}

// Global onboarding instance
let onboardingTour = null;

function startOnboardingTour() {
  if (!onboardingTour) {
    onboardingTour = new OnboardingTour();
  }
  onboardingTour.start();
}

function resetOnboarding() {
  if (!onboardingTour) {
    onboardingTour = new OnboardingTour();
  }
  onboardingTour.reset();
}

// ============================================
// FIRST-TIME USER WELCOME BANNER
// ============================================

class WelcomeBanner {
  constructor() {
    this.storageKey = 'snozcoin_welcome_dismissed';
    this.banner = null;
  }

  shouldShow() {
    return !localStorage.getItem(this.storageKey) && !onboardingTour?.hasCompleted();
  }

  dismiss() {
    localStorage.setItem(this.storageKey, 'true');
    if (this.banner) {
      this.banner.classList.add('dismissed');
      setTimeout(() => {
        this.banner.remove();
      }, 400);
    }
  }

  show() {
    if (!this.shouldShow()) return;

    this.banner = document.createElement('div');
    this.banner.className = 'welcome-banner';
    this.banner.innerHTML = `
      <div class="welcome-banner-content">
        <div class="welcome-banner-icon">👋</div>
        <div class="welcome-banner-text">
          <strong>Welcome to SNOZCOIN!</strong>
          <span>New here? Take a quick tour to learn how the platform works.</span>
        </div>
        <div class="welcome-banner-actions">
          <button class="btn btn-primary welcome-start-tour">Start Tour</button>
          <button class="btn btn-ghost welcome-dismiss">Maybe Later</button>
        </div>
        <button class="welcome-banner-close" aria-label="Dismiss">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M18 6L6 18M6 6l12 12"/>
          </svg>
        </button>
      </div>
    `;

    // Insert after header
    const header = document.querySelector('.site-header');
    if (header) {
      header.after(this.banner);
    } else {
      document.body.prepend(this.banner);
    }

    // Show with animation
    requestAnimationFrame(() => {
      this.banner.classList.add('visible');
    });

    // Bind events
    this.banner.querySelector('.welcome-start-tour').addEventListener('click', () => {
      this.dismiss();
      startOnboardingTour();
    });

    this.banner.querySelector('.welcome-dismiss').addEventListener('click', () => {
      this.dismiss();
    });

    this.banner.querySelector('.welcome-banner-close').addEventListener('click', () => {
      this.dismiss();
    });
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
  
  // Initialize wallet modal
  walletModal = new WalletModal();
  
  // Override connect button clicks to use modal
  const connectButtons = document.querySelectorAll('#snoz-connect-btn, #getting-started-connect-btn, .wallet-connect-trigger');
  connectButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      openWalletModal();
    });
  });

  // Initialize onboarding system
  onboardingTour = new OnboardingTour();
  
  // Show welcome banner for first-time users
  const welcomeBanner = new WelcomeBanner();
  welcomeBanner.show();

  // Initialize platform metrics
  const platformMetrics = new PlatformMetrics();
  platformMetrics.init();
});

// ============================================
// PLATFORM METRICS SYSTEM
// ============================================

class PlatformMetrics {
  constructor() {
    this.isDemo = true; // Set to false when contracts are deployed
    this.refreshInterval = null;
    this.animationDuration = 1500;
    this.hasAnimated = false;
    
    // Demo data - will be replaced with live on-chain data
    this.demoData = {
      'metric-total-tips': { value: 12847, format: 'number' },
      'metric-creators': { value: 156, format: 'number' },
      'metric-content': { value: 1234, format: 'number' },
      'metric-snoz-distributed': { value: 2.4, format: 'millions' }
    };
  }

  init() {
    // Animate metrics on scroll into view
    this.setupIntersectionObserver();
    
    // If not demo mode, start fetching live data
    if (!this.isDemo) {
      this.startLiveUpdates();
    }
  }

  setupIntersectionObserver() {
    const metricsSection = document.getElementById('metrics');
    if (!metricsSection) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && !this.hasAnimated) {
          this.animateMetrics();
          this.hasAnimated = true;
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.2 });

    observer.observe(metricsSection);
  }

  animateMetrics() {
    const metricElements = [
      'metric-total-tips',
      'metric-creators', 
      'metric-content',
      'metric-snoz-distributed'
    ];
    
    metricElements.forEach((id, index) => {
      const element = document.getElementById(id);
      if (!element) return;
      
      const data = this.demoData[id];
      if (!data) return;
      
      // Stagger animation
      setTimeout(() => {
        element.setAttribute('data-animated', 'true');
        this.animateNumber(element, data.value, data.format);
      }, index * 150);
    });
  }

  animateNumber(element, targetValue, format) {
    const startValue = 0;
    const duration = this.animationDuration;
    const startTime = performance.now();

    const animate = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function (ease-out cubic)
      const easeOut = 1 - Math.pow(1 - progress, 3);
      
      const currentValue = startValue + (targetValue - startValue) * easeOut;
      
      let displayValue;
      if (format === 'millions') {
        displayValue = currentValue.toFixed(1) + 'M';
      } else {
        displayValue = Math.round(currentValue).toLocaleString('en-US');
      }

      element.textContent = displayValue;

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }

  async startLiveUpdates() {
    // Fetch initial data
    await this.fetchLiveData();
    
    // Refresh every 30 seconds
    this.refreshInterval = setInterval(() => {
      this.fetchLiveData();
    }, 30000);
  }

  async fetchLiveData() {
    try {
      // TODO: Replace with actual Stacks API calls when contracts are deployed
      // This would call the read-only functions from our contracts
      
      // Example: Fetch from snoz-rewards-engine
      // const response = await fetch('https://stacks-node-api.mainnet.stacks.co/v2/contracts/call-read/...');
      // const totalTips = await callReadOnlyFunction('snoz-rewards-engine', 'get-total-tips-volume');
      
      console.log('[PlatformMetrics] Live data fetch would happen here');
    } catch (error) {
      console.error('[PlatformMetrics] Failed to fetch live data:', error);
    }
  }

  stopLiveUpdates() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
      this.refreshInterval = null;
    }
  }
}

// Export for use in other scripts
window.toast = toast;
window.LoadingManager = LoadingManager;
window.ErrorHandler = ErrorHandler;
window.TransactionHistory = TransactionHistory;
window.WalletConnectionUI = WalletConnectionUI;
window.ConnectionStatus = ConnectionStatus;
window.copyToClipboard = copyToClipboard;
window.WalletModal = WalletModal;
window.openWalletModal = openWalletModal;
window.OnboardingTour = OnboardingTour;
window.startOnboardingTour = startOnboardingTour;
window.resetOnboarding = resetOnboarding;
window.PlatformMetrics = PlatformMetrics;
