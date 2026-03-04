/**
 * SNOZCOIN Wallet Authentication Service
 * Handles multi-wallet connection, state persistence, and auth events
 * Supports: Xverse, Leather, Phantom, MetaMask, Trust Wallet
 */

const WalletAuth = (function() {
  'use strict';

  // Configuration
  const CONFIG = {
    appName: 'SNOZCOIN',
    appIconUrl: 'https://snozcoin.xyz/assets/SNOZCOIN-512.png',
    redirectTo: '/dashboard.html',
    storageKey: 'snozcoin_wallet',
    network: 'mainnet' // 'mainnet' or 'testnet'
  };

  // Supported wallets configuration
  const WALLETS = {
    xverse: {
      name: 'Xverse',
      icon: '🟠',
      iconUrl: 'https://www.xverse.app/favicon.ico',
      type: 'stacks',
      installUrl: 'https://www.xverse.app/',
      detect: () => typeof window.XverseProviders !== 'undefined' || typeof window.BitcoinProvider !== 'undefined'
    },
    leather: {
      name: 'Leather',
      icon: '🟤',
      iconUrl: 'https://leather.io/favicon.ico',
      type: 'stacks',
      installUrl: 'https://leather.io/install-extension',
      detect: () => typeof window.LeatherProvider !== 'undefined' || typeof window.HiroWalletProvider !== 'undefined'
    },
    phantom: {
      name: 'Phantom',
      icon: '👻',
      iconUrl: 'https://phantom.app/favicon.ico',
      type: 'solana',
      installUrl: 'https://phantom.app/',
      detect: () => typeof window.phantom?.solana !== 'undefined'
    },
    metamask: {
      name: 'MetaMask',
      icon: '🦊',
      iconUrl: 'https://metamask.io/favicon.ico',
      type: 'evm',
      installUrl: 'https://metamask.io/download/',
      detect: () => typeof window.ethereum !== 'undefined' && window.ethereum.isMetaMask
    },
    trustwallet: {
      name: 'Trust Wallet',
      icon: '🛡️',
      iconUrl: 'https://trustwallet.com/favicon.ico',
      type: 'evm',
      installUrl: 'https://trustwallet.com/',
      detect: () => typeof window.trustwallet !== 'undefined' || (typeof window.ethereum !== 'undefined' && window.ethereum.isTrust)
    }
  };

  // Private state
  let _state = {
    isConnected: false,
    address: null,
    walletType: null,
    walletName: null,
    chainType: null, // 'stacks', 'evm', 'solana'
    userData: null
  };

  // Event listeners
  const _listeners = {
    connect: [],
    disconnect: [],
    stateChange: []
  };

  // Modal element reference
  let _modalElement = null;

  /**
   * Initialize wallet state from localStorage
   */
  function init() {
    const saved = localStorage.getItem(CONFIG.storageKey);
    if (saved) {
      try {
        const data = JSON.parse(saved);
        if (data.address && data.isConnected) {
          _state = { ...data };
          _emit('stateChange', _state);
        }
      } catch (e) {
        console.warn('Failed to restore wallet state:', e);
        localStorage.removeItem(CONFIG.storageKey);
      }
    }
    return _state;
  }

  /**
   * Save state to localStorage
   */
  function _saveState() {
    localStorage.setItem(CONFIG.storageKey, JSON.stringify(_state));
  }

  /**
   * Emit event to listeners
   */
  function _emit(event, data) {
    if (_listeners[event]) {
      _listeners[event].forEach(fn => fn(data));
    }
  }

  /**
   * Format wallet address for display
   */
  function formatAddress(address) {
    if (!address) return '';
    if (address.length <= 12) return address;
    return `${address.slice(0, 5)}...${address.slice(-4)}`;
  }

  /**
   * Get detected wallets
   */
  function getDetectedWallets() {
    const detected = [];
    for (const [key, wallet] of Object.entries(WALLETS)) {
      if (wallet.detect()) {
        detected.push({ id: key, ...wallet });
      }
    }
    return detected;
  }

  /**
   * Get all supported wallets
   */
  function getAllWallets() {
    return Object.entries(WALLETS).map(([id, wallet]) => ({
      id,
      ...wallet,
      installed: wallet.detect()
    }));
  }

  /**
   * Show wallet selection modal
   */
  function showWalletModal() {
    console.log('showWalletModal called');
    return new Promise((resolve, reject) => {
      // Remove existing modal if any
      hideWalletModal();

      const wallets = getAllWallets();
      console.log('Available wallets:', wallets);
      
      const modalHTML = `
        <div class="wallet-modal-overlay" id="walletModalOverlay">
          <div class="wallet-modal" role="dialog" aria-labelledby="walletModalTitle">
            <div class="wallet-modal-header">
              <h2 id="walletModalTitle">Connect Wallet</h2>
              <button class="wallet-modal-close" id="walletModalClose" aria-label="Close">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M18 6L6 18M6 6l12 12"/>
                </svg>
              </button>
            </div>
            <div class="wallet-modal-body">
              <p class="wallet-modal-subtitle">Choose your preferred wallet to connect to SNOZCOIN</p>
              <div class="wallet-list">
                ${wallets.map(wallet => `
                  <button class="wallet-option ${wallet.installed ? 'installed' : 'not-installed'}" 
                          data-wallet-id="${wallet.id}"
                          data-wallet-type="${wallet.type}">
                    <span class="wallet-option-icon">${wallet.icon}</span>
                    <span class="wallet-option-info">
                      <span class="wallet-option-name">${wallet.name}</span>
                      <span class="wallet-option-status">${wallet.installed ? 'Detected' : 'Not installed'}</span>
                    </span>
                    ${!wallet.installed ? '<span class="wallet-option-install">Install →</span>' : '<span class="wallet-option-arrow">→</span>'}
                  </button>
                `).join('')}
              </div>
              <div class="wallet-modal-footer">
                <p class="wallet-modal-note">
                  <strong>Recommended:</strong> Xverse or Leather for Stacks blockchain
                </p>
              </div>
            </div>
          </div>
        </div>
      `;

      console.log('Creating modal element...');
      // Add modal to DOM
      const modalContainer = document.createElement('div');
      modalContainer.innerHTML = modalHTML;
      _modalElement = modalContainer.firstElementChild;
      document.body.appendChild(_modalElement);
      console.log('Modal added to DOM:', _modalElement);

      // Prevent body scroll
      document.body.style.overflow = 'hidden';

      // Attach event listeners
      const closeBtn = document.getElementById('walletModalClose');
      const overlay = document.getElementById('walletModalOverlay');
      console.log('Modal elements:', { closeBtn, overlay });
      
      const handleClose = () => {
        hideWalletModal();
        reject(new Error('User closed wallet modal'));
      };

      closeBtn.addEventListener('click', handleClose);
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) handleClose();
      });

      // Handle escape key
      const handleEscape = (e) => {
        if (e.key === 'Escape') {
          handleClose();
          document.removeEventListener('keydown', handleEscape);
        }
      };
      document.addEventListener('keydown', handleEscape);

      // Handle wallet selection
      const walletButtons = _modalElement.querySelectorAll('.wallet-option');
      walletButtons.forEach(btn => {
        btn.addEventListener('click', async () => {
          const walletId = btn.dataset.walletId;
          const wallet = WALLETS[walletId];
          
          if (!wallet.detect()) {
            // Wallet not installed, open install page
            window.open(wallet.installUrl, '_blank');
            return;
          }

          // Show loading state
          btn.classList.add('loading');
          btn.innerHTML = `
            <span class="wallet-option-icon">${wallet.icon}</span>
            <span class="wallet-option-info">
              <span class="wallet-option-name">${wallet.name}</span>
              <span class="wallet-option-status">Connecting...</span>
            </span>
            <span class="wallet-option-spinner"></span>
          `;

          try {
            const result = await connect(walletId);
            hideWalletModal();
            resolve(result);
          } catch (error) {
            btn.classList.remove('loading');
            btn.innerHTML = `
              <span class="wallet-option-icon">${wallet.icon}</span>
              <span class="wallet-option-info">
                <span class="wallet-option-name">${wallet.name}</span>
                <span class="wallet-option-status wallet-error">Connection failed</span>
              </span>
              <span class="wallet-option-arrow">→</span>
            `;
          }
        });
      });
    });
  }

  /**
   * Hide wallet selection modal
   */
  function hideWalletModal() {
    if (_modalElement) {
      _modalElement.remove();
      _modalElement = null;
      document.body.style.overflow = '';
    }
  }

  /**
   * Connect wallet by type
   */
  async function connect(walletId = 'xverse') {
    const wallet = WALLETS[walletId];
    
    if (!wallet) {
      throw new Error(`Unknown wallet: ${walletId}`);
    }

    if (!wallet.detect()) {
      throw new Error(`${wallet.name} wallet not detected`);
    }

    try {
      let result;
      
      switch (wallet.type) {
        case 'stacks':
          result = await _connectStacksWallet(walletId);
          break;
        case 'evm':
          result = await _connectEVMWallet(walletId);
          break;
        case 'solana':
          result = await _connectSolanaWallet(walletId);
          break;
        default:
          throw new Error(`Unsupported wallet type: ${wallet.type}`);
      }

      return result;
    } catch (error) {
      console.error(`${wallet.name} connection failed:`, error);
      throw error;
    }
  }

  /**
   * Connect Stacks wallet (Xverse, Leather)
   */
  async function _connectStacksWallet(walletId) {
    let provider = null;

    // Get the appropriate provider
    if (walletId === 'leather') {
      provider = window.LeatherProvider || window.HiroWalletProvider;
    } else if (walletId === 'xverse') {
      provider = window.XverseProviders?.StacksProvider || window.BitcoinProvider;
    }

    // Fallback to generic StacksProvider
    if (!provider && window.StacksProvider) {
      provider = window.StacksProvider;
    }

    if (!provider) {
      throw new Error(`${WALLETS[walletId].name} provider not found`);
    }

    // Try modern RPC method first
    try {
      const response = await provider.request({ method: 'stx_requestAccounts' });
      
      if (response?.result?.addresses) {
        const addresses = response.result.addresses;
        const stxAddress = addresses.find(a => a.symbol === 'STX' || a.type === 'stacks');
        
        if (stxAddress) {
          _state = {
            isConnected: true,
            address: stxAddress.address,
            walletType: walletId,
            walletName: WALLETS[walletId].name,
            chainType: 'stacks',
            userData: { addresses }
          };
          
          _saveState();
          _emit('connect', _state);
          _emit('stateChange', _state);
          
          return _state;
        }
      }
    } catch (e) {
      console.log('Modern RPC failed, trying legacy method...');
    }

    // Try legacy connect method
    if (typeof provider.connect === 'function') {
      const result = await provider.connect();
      
      if (result?.addresses?.[0]) {
        const addr = result.addresses[0];
        _state = {
          isConnected: true,
          address: addr.address || addr,
          walletType: walletId,
          walletName: WALLETS[walletId].name,
          chainType: 'stacks',
          userData: result
        };
        
        _saveState();
        _emit('connect', _state);
        _emit('stateChange', _state);
        
        return _state;
      }
    }

    // Try getAddresses for Xverse
    if (walletId === 'xverse' && window.BitcoinProvider) {
      try {
        const getAddressOptions = {
          payload: {
            purposes: ['stacks'],
            message: 'Connect to SNOZCOIN',
            network: { type: CONFIG.network === 'mainnet' ? 'Mainnet' : 'Testnet' }
          },
          onFinish: (response) => response,
          onCancel: () => { throw new Error('User cancelled'); }
        };
        
        // This uses Xverse's getAddress API
        if (window.sats?.getAddress) {
          const response = await window.sats.getAddress(getAddressOptions);
          if (response?.addresses) {
            const stacksAddr = response.addresses.find(a => a.purpose === 'stacks');
            if (stacksAddr) {
              _state = {
                isConnected: true,
                address: stacksAddr.address,
                walletType: walletId,
                walletName: WALLETS[walletId].name,
                chainType: 'stacks',
                userData: response
              };
              
              _saveState();
              _emit('connect', _state);
              _emit('stateChange', _state);
              
              return _state;
            }
          }
        }
      } catch (e) {
        console.log('Xverse getAddress failed:', e);
      }
    }

    throw new Error('Failed to get wallet address');
  }

  /**
   * Connect EVM wallet (MetaMask, Trust Wallet)
   */
  async function _connectEVMWallet(walletId) {
    let provider = null;

    if (walletId === 'metamask') {
      provider = window.ethereum;
    } else if (walletId === 'trustwallet') {
      provider = window.trustwallet?.ethereum || window.ethereum;
    }

    if (!provider) {
      throw new Error(`${WALLETS[walletId].name} provider not found`);
    }

    try {
      const accounts = await provider.request({ method: 'eth_requestAccounts' });
      
      if (accounts && accounts.length > 0) {
        _state = {
          isConnected: true,
          address: accounts[0],
          walletType: walletId,
          walletName: WALLETS[walletId].name,
          chainType: 'evm',
          userData: { accounts }
        };
        
        _saveState();
        _emit('connect', _state);
        _emit('stateChange', _state);
        
        return _state;
      }
      
      throw new Error('No accounts found');
    } catch (error) {
      if (error.code === 4001) {
        throw new Error('User rejected the connection request');
      }
      throw error;
    }
  }

  /**
   * Connect Solana wallet (Phantom)
   */
  async function _connectSolanaWallet(walletId) {
    const provider = window.phantom?.solana;

    if (!provider) {
      throw new Error('Phantom wallet not found');
    }

    try {
      const response = await provider.connect();
      
      if (response?.publicKey) {
        _state = {
          isConnected: true,
          address: response.publicKey.toString(),
          walletType: walletId,
          walletName: WALLETS[walletId].name,
          chainType: 'solana',
          userData: { publicKey: response.publicKey.toString() }
        };
        
        _saveState();
        _emit('connect', _state);
        _emit('stateChange', _state);
        
        return _state;
      }
      
      throw new Error('Failed to get public key');
    } catch (error) {
      if (error.code === 4001) {
        throw new Error('User rejected the connection request');
      }
      throw error;
    }
  }

  /**
   * Disconnect wallet
   */
  function disconnect() {
    _state = {
      isConnected: false,
      address: null,
      walletType: null,
      userData: null
    };
    
    localStorage.removeItem(CONFIG.storageKey);
    _emit('disconnect', _state);
    _emit('stateChange', _state);
    
    return _state;
  }

  /**
   * Check if wallet is connected
   */
  function isConnected() {
    return _state.isConnected;
  }

  /**
   * Get current wallet state
   */
  function getState() {
    return { ..._state };
  }

  /**
   * Get connected address
   */
  function getAddress() {
    return _state.address;
  }

  /**
   * Subscribe to wallet events
   */
  function on(event, callback) {
    if (_listeners[event]) {
      _listeners[event].push(callback);
    }
    return () => off(event, callback);
  }

  /**
   * Unsubscribe from wallet events
   */
  function off(event, callback) {
    if (_listeners[event]) {
      _listeners[event] = _listeners[event].filter(fn => fn !== callback);
    }
  }

  /**
   * Require wallet connection (for route protection)
   */
  function requireAuth(redirectUrl = '/') {
    if (!_state.isConnected) {
      sessionStorage.setItem('snozcoin_redirect_after_auth', window.location.pathname);
      window.location.href = redirectUrl;
      return false;
    }
    return true;
  }

  /**
   * Handle post-auth redirect
   */
  function handleRedirectAfterAuth() {
    const redirect = sessionStorage.getItem('snozcoin_redirect_after_auth');
    if (redirect) {
      sessionStorage.removeItem('snozcoin_redirect_after_auth');
      window.location.href = redirect;
    } else {
      window.location.href = CONFIG.redirectTo;
    }
  }

  // Public API
  return {
    init,
    connect,
    disconnect,
    isConnected,
    getState,
    getAddress,
    formatAddress,
    on,
    off,
    requireAuth,
    handleRedirectAfterAuth,
    showWalletModal,
    hideWalletModal,
    getDetectedWallets,
    getAllWallets,
    WALLETS,
    CONFIG
  };
})();

// Auto-initialize on load
if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => WalletAuth.init());
  } else {
    WalletAuth.init();
  }
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = WalletAuth;
}
