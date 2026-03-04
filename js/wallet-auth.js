/**
 * SNOZCOIN Wallet Authentication Service
 * Handles Stacks wallet connection, state persistence, and auth events
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

  // Private state
  let _state = {
    isConnected: false,
    address: null,
    walletType: null, // 'leather', 'xverse', 'okx'
    userData: null
  };

  // Event listeners
  const _listeners = {
    connect: [],
    disconnect: [],
    stateChange: []
  };

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
   * Format wallet address for display (SP1X...ABCD)
   */
  function formatAddress(address) {
    if (!address) return '';
    if (address.length <= 12) return address;
    return `${address.slice(0, 5)}...${address.slice(-4)}`;
  }

  /**
   * Connect wallet using Stacks Connect
   */
  async function connect(walletType = 'leather') {
    // Check if Stacks Connect is available
    if (typeof window.StacksProvider === 'undefined' && 
        typeof window.LeatherProvider === 'undefined' &&
        typeof window.XverseProviders === 'undefined') {
      
      // Open wallet install page
      const walletUrls = {
        leather: 'https://leather.io/install-extension',
        xverse: 'https://www.xverse.app/',
        okx: 'https://www.okx.com/web3'
      };
      
      const installUrl = walletUrls[walletType] || walletUrls.leather;
      window.open(installUrl, '_blank');
      throw new Error('Please install a Stacks wallet to continue');
    }

    try {
      // Use @stacks/connect if available (loaded via CDN)
      if (window.StacksConnect) {
        return await _connectWithStacksConnect(walletType);
      }
      
      // Fallback to direct provider access
      return await _connectDirect(walletType);
    } catch (error) {
      console.error('Wallet connection failed:', error);
      throw error;
    }
  }

  /**
   * Connect using @stacks/connect library
   */
  async function _connectWithStacksConnect(walletType) {
    const { showConnect, AppConfig, UserSession } = window.StacksConnect || {};
    
    if (!showConnect) {
      return _connectDirect(walletType);
    }

    return new Promise((resolve, reject) => {
      const appConfig = new AppConfig(['store_write', 'publish_data']);
      const userSession = new UserSession({ appConfig });

      showConnect({
        appDetails: {
          name: CONFIG.appName,
          icon: CONFIG.appIconUrl
        },
        redirectTo: CONFIG.redirectTo,
        onFinish: () => {
          const userData = userSession.loadUserData();
          const address = userData.profile.stxAddress[CONFIG.network];
          
          _state = {
            isConnected: true,
            address: address,
            walletType: walletType,
            userData: userData
          };
          
          _saveState();
          _emit('connect', _state);
          _emit('stateChange', _state);
          
          resolve(_state);
        },
        onCancel: () => {
          reject(new Error('User cancelled connection'));
        },
        userSession: userSession
      });
    });
  }

  /**
   * Direct provider connection (fallback)
   */
  async function _connectDirect(walletType) {
    let provider = null;
    
    // Detect available provider
    if (walletType === 'leather' && window.LeatherProvider) {
      provider = window.LeatherProvider;
    } else if (walletType === 'xverse' && window.XverseProviders?.StacksProvider) {
      provider = window.XverseProviders.StacksProvider;
    } else if (window.StacksProvider) {
      provider = window.StacksProvider;
    }

    if (!provider) {
      throw new Error(`${walletType} wallet not found`);
    }

    try {
      const response = await provider.request({ method: 'stx_requestAccounts' });
      
      if (response && response.result && response.result.addresses) {
        const addresses = response.result.addresses;
        const stxAddress = addresses.find(a => a.symbol === 'STX');
        
        if (stxAddress) {
          _state = {
            isConnected: true,
            address: stxAddress.address,
            walletType: walletType,
            userData: { addresses }
          };
          
          _saveState();
          _emit('connect', _state);
          _emit('stateChange', _state);
          
          return _state;
        }
      }
      
      throw new Error('No STX address found');
    } catch (error) {
      // Try legacy method
      if (provider.connect) {
        const result = await provider.connect();
        if (result && result.address) {
          _state = {
            isConnected: true,
            address: result.address,
            walletType: walletType,
            userData: result
          };
          
          _saveState();
          _emit('connect', _state);
          _emit('stateChange', _state);
          
          return _state;
        }
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
