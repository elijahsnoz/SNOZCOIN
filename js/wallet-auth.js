/**
 * SNOZCOIN Wallet Authentication Service
 * Simplified wallet connection for MetaMask, Phantom, and Stacks wallets
 */

var WalletAuth = (function() {
  'use strict';

  // Configuration
  var CONFIG = {
    appName: 'SNOZCOIN',
    redirectTo: '/dashboard.html',
    storageKey: 'snozcoin_wallet'
  };

  // Supported wallets
  var WALLETS = [
    {
      id: 'metamask',
      name: 'MetaMask',
      icon: '🦊',
      type: 'evm',
      installUrl: 'https://metamask.io/download/',
      detect: function() { 
        return typeof window.ethereum !== 'undefined' && window.ethereum.isMetaMask; 
      }
    },
    {
      id: 'phantom',
      name: 'Phantom',
      icon: '👻',
      type: 'solana',
      installUrl: 'https://phantom.app/',
      detect: function() { 
        return window.phantom && window.phantom.solana; 
      }
    },
    {
      id: 'xverse',
      name: 'Xverse',
      icon: '🟠',
      type: 'stacks',
      installUrl: 'https://www.xverse.app/',
      detect: function() { 
        return typeof window.XverseProviders !== 'undefined' || typeof window.BitcoinProvider !== 'undefined'; 
      }
    },
    {
      id: 'leather',
      name: 'Leather',
      icon: '🟤',
      type: 'stacks',
      installUrl: 'https://leather.io/install-extension',
      detect: function() { 
        return typeof window.LeatherProvider !== 'undefined' || typeof window.HiroWalletProvider !== 'undefined'; 
      }
    }
  ];

  // State
  var _state = {
    isConnected: false,
    address: null,
    walletType: null,
    walletName: null
  };

  // Event listeners
  var _listeners = {
    connect: [],
    disconnect: [],
    stateChange: []
  };

  // Modal reference
  var _modal = null;

  // Initialize from localStorage
  function init() {
    try {
      var saved = localStorage.getItem(CONFIG.storageKey);
      if (saved) {
        var data = JSON.parse(saved);
        if (data && data.address) {
          _state = data;
          _emit('stateChange', _state);
        }
      }
    } catch (e) {
      console.warn('WalletAuth init error:', e);
    }
    return _state;
  }

  // Save state
  function _saveState() {
    try {
      localStorage.setItem(CONFIG.storageKey, JSON.stringify(_state));
    } catch (e) {
      console.warn('Failed to save wallet state:', e);
    }
  }

  // Emit events
  function _emit(event, data) {
    if (_listeners[event]) {
      _listeners[event].forEach(function(fn) { fn(data); });
    }
  }

  // Format address
  function formatAddress(addr) {
    if (!addr) return '';
    if (addr.length <= 10) return addr;
    return addr.slice(0, 6) + '...' + addr.slice(-4);
  }

  // Get state
  function getState() {
    return {
      isConnected: _state.isConnected,
      address: _state.address,
      walletType: _state.walletType,
      walletName: _state.walletName
    };
  }

  // Check if connected
  function isConnected() {
    return _state.isConnected;
  }

  // Get address
  function getAddress() {
    return _state.address;
  }

  // Subscribe to events
  function on(event, callback) {
    if (_listeners[event]) {
      _listeners[event].push(callback);
    }
  }

  // Unsubscribe
  function off(event, callback) {
    if (_listeners[event]) {
      _listeners[event] = _listeners[event].filter(function(fn) { return fn !== callback; });
    }
  }

  // Get all wallets with install status
  function getAllWallets() {
    return WALLETS.map(function(w) {
      return {
        id: w.id,
        name: w.name,
        icon: w.icon,
        type: w.type,
        installUrl: w.installUrl,
        installed: w.detect()
      };
    });
  }

  // Show wallet modal
  function showWalletModal() {
    return new Promise(function(resolve, reject) {
      // Remove existing modal
      hideWalletModal();

      var wallets = getAllWallets();
      
      // Create modal HTML
      var html = '<div class="wallet-modal-overlay" id="walletModalOverlay">' +
        '<div class="wallet-modal">' +
          '<div class="wallet-modal-header">' +
            '<h2>Connect Wallet</h2>' +
            '<button class="wallet-modal-close" id="walletModalClose">&times;</button>' +
          '</div>' +
          '<div class="wallet-modal-body">' +
            '<p class="wallet-modal-subtitle">Select a wallet to connect</p>' +
            '<div class="wallet-list">';
      
      for (var i = 0; i < wallets.length; i++) {
        var wallet = wallets[i];
        var statusText = wallet.installed ? 'Detected' : 'Not installed';
        var statusClass = wallet.installed ? 'detected' : 'not-installed';
        var actionText = wallet.installed ? '→' : 'Install →';
        
        html += '<button class="wallet-option ' + statusClass + '" data-wallet="' + wallet.id + '">' +
          '<span class="wallet-icon">' + wallet.icon + '</span>' +
          '<span class="wallet-info">' +
            '<span class="wallet-name">' + wallet.name + '</span>' +
            '<span class="wallet-status">' + statusText + '</span>' +
          '</span>' +
          '<span class="wallet-action">' + actionText + '</span>' +
        '</button>';
      }
      
      html += '</div>' +
            '<p class="wallet-modal-note"><strong>Recommended:</strong> MetaMask or Phantom</p>' +
          '</div>' +
        '</div>' +
      '</div>';

      // Add to page
      var container = document.createElement('div');
      container.innerHTML = html;
      _modal = container.firstChild;
      document.body.appendChild(_modal);
      document.body.style.overflow = 'hidden';

      // Close handlers
      function closeModal() {
        hideWalletModal();
        reject(new Error('User closed wallet modal'));
      }

      document.getElementById('walletModalClose').onclick = closeModal;
      document.getElementById('walletModalOverlay').onclick = function(e) {
        if (e.target.id === 'walletModalOverlay') closeModal();
      };

      // Wallet click handlers
      var buttons = _modal.querySelectorAll('.wallet-option');
      for (var j = 0; j < buttons.length; j++) {
        (function(btn) {
          btn.onclick = function() {
            var walletId = btn.getAttribute('data-wallet');
            var walletData = null;
            for (var k = 0; k < WALLETS.length; k++) {
              if (WALLETS[k].id === walletId) {
                walletData = WALLETS[k];
                break;
              }
            }
            
            if (!walletData.detect()) {
              window.open(walletData.installUrl, '_blank');
              return;
            }

            // Show connecting state
            btn.innerHTML = '<span class="wallet-icon">' + walletData.icon + '</span>' +
              '<span class="wallet-info">' +
                '<span class="wallet-name">' + walletData.name + '</span>' +
                '<span class="wallet-status">Connecting...</span>' +
              '</span>' +
              '<span class="wallet-spinner"></span>';

            connect(walletId).then(function(result) {
              hideWalletModal();
              resolve(result);
            }).catch(function(err) {
              btn.innerHTML = '<span class="wallet-icon">' + walletData.icon + '</span>' +
                '<span class="wallet-info">' +
                  '<span class="wallet-name">' + walletData.name + '</span>' +
                  '<span class="wallet-status wallet-error">Failed - Try again</span>' +
                '</span>' +
                '<span class="wallet-action">→</span>';
            });
          };
        })(buttons[j]);
      }
    });
  }

  // Hide modal
  function hideWalletModal() {
    if (_modal && _modal.parentNode) {
      _modal.parentNode.removeChild(_modal);
    }
    _modal = null;
    document.body.style.overflow = '';
  }

  // Connect to wallet
  function connect(walletId) {
    var wallet = null;
    for (var i = 0; i < WALLETS.length; i++) {
      if (WALLETS[i].id === walletId) {
        wallet = WALLETS[i];
        break;
      }
    }
    
    if (!wallet) {
      return Promise.reject(new Error('Unknown wallet'));
    }

    if (wallet.type === 'evm') {
      return connectEVM(wallet);
    } else if (wallet.type === 'solana') {
      return connectSolana(wallet);
    } else if (wallet.type === 'stacks') {
      return connectStacks(wallet);
    }
    
    return Promise.reject(new Error('Unsupported wallet type'));
  }

  // Connect EVM (MetaMask)
  function connectEVM(wallet) {
    return new Promise(function(resolve, reject) {
      if (!window.ethereum) {
        reject(new Error('MetaMask not found'));
        return;
      }

      window.ethereum.request({ method: 'eth_requestAccounts' })
        .then(function(accounts) {
          if (accounts && accounts.length > 0) {
            _state = {
              isConnected: true,
              address: accounts[0],
              walletType: wallet.id,
              walletName: wallet.name
            };
            _saveState();
            _emit('connect', _state);
            _emit('stateChange', _state);
            resolve(_state);
          } else {
            reject(new Error('No accounts found'));
          }
        })
        .catch(function(err) {
          reject(err);
        });
    });
  }

  // Connect Solana (Phantom)
  function connectSolana(wallet) {
    return new Promise(function(resolve, reject) {
      if (!window.phantom || !window.phantom.solana) {
        reject(new Error('Phantom not found'));
        return;
      }

      window.phantom.solana.connect()
        .then(function(resp) {
          if (resp && resp.publicKey) {
            _state = {
              isConnected: true,
              address: resp.publicKey.toString(),
              walletType: wallet.id,
              walletName: wallet.name
            };
            _saveState();
            _emit('connect', _state);
            _emit('stateChange', _state);
            resolve(_state);
          } else {
            reject(new Error('No public key'));
          }
        })
        .catch(function(err) {
          reject(err);
        });
    });
  }

  // Connect Stacks (Xverse/Leather)
  function connectStacks(wallet) {
    return new Promise(function(resolve, reject) {
      var provider = null;
      
      if (wallet.id === 'leather') {
        provider = window.LeatherProvider || window.HiroWalletProvider;
      } else if (wallet.id === 'xverse') {
        provider = window.XverseProviders ? window.XverseProviders.StacksProvider : null;
        if (!provider) provider = window.BitcoinProvider;
      }
      
      if (!provider && window.StacksProvider) {
        provider = window.StacksProvider;
      }

      if (!provider) {
        reject(new Error(wallet.name + ' not found'));
        return;
      }

      // Try modern method
      if (provider.request) {
        provider.request({ method: 'stx_requestAccounts' })
          .then(function(resp) {
            if (resp && resp.result && resp.result.addresses) {
              var stxAddr = null;
              for (var i = 0; i < resp.result.addresses.length; i++) {
                var a = resp.result.addresses[i];
                if (a.symbol === 'STX' || a.type === 'stacks') {
                  stxAddr = a;
                  break;
                }
              }
              if (stxAddr) {
                _state = {
                  isConnected: true,
                  address: stxAddr.address,
                  walletType: wallet.id,
                  walletName: wallet.name
                };
                _saveState();
                _emit('connect', _state);
                _emit('stateChange', _state);
                resolve(_state);
                return;
              }
            }
            reject(new Error('No STX address found'));
          })
          .catch(function(err) {
            // Try legacy connect
            if (provider.connect) {
              provider.connect().then(function(result) {
                if (result && result.addresses && result.addresses[0]) {
                  _state = {
                    isConnected: true,
                    address: result.addresses[0].address || result.addresses[0],
                    walletType: wallet.id,
                    walletName: wallet.name
                  };
                  _saveState();
                  _emit('connect', _state);
                  _emit('stateChange', _state);
                  resolve(_state);
                } else {
                  reject(new Error('Connection failed'));
                }
              }).catch(reject);
            } else {
              reject(err);
            }
          });
      } else if (provider.connect) {
        provider.connect().then(function(result) {
          if (result && result.addresses && result.addresses[0]) {
            _state = {
              isConnected: true,
              address: result.addresses[0].address || result.addresses[0],
              walletType: wallet.id,
              walletName: wallet.name
            };
            _saveState();
            _emit('connect', _state);
            _emit('stateChange', _state);
            resolve(_state);
          } else {
            reject(new Error('Connection failed'));
          }
        }).catch(reject);
      } else {
        reject(new Error('No connect method available'));
      }
    });
  }

  // Disconnect
  function disconnect() {
    _state = {
      isConnected: false,
      address: null,
      walletType: null,
      walletName: null
    };
    try {
      localStorage.removeItem(CONFIG.storageKey);
    } catch (e) {}
    _emit('disconnect', _state);
    _emit('stateChange', _state);
    return _state;
  }

  // Redirect after auth
  function handleRedirectAfterAuth() {
    var redirect = sessionStorage.getItem('snozcoin_redirect');
    if (redirect) {
      sessionStorage.removeItem('snozcoin_redirect');
      window.location.href = redirect;
    } else {
      window.location.href = CONFIG.redirectTo;
    }
  }

  // Require auth
  function requireAuth(redirectUrl) {
    if (!_state.isConnected) {
      sessionStorage.setItem('snozcoin_redirect', window.location.pathname);
      window.location.href = redirectUrl || '/';
      return false;
    }
    return true;
  }

  // Initialize on load
  init();

  // Public API
  return {
    init: init,
    connect: connect,
    disconnect: disconnect,
    isConnected: isConnected,
    getState: getState,
    getAddress: getAddress,
    formatAddress: formatAddress,
    on: on,
    off: off,
    showWalletModal: showWalletModal,
    hideWalletModal: hideWalletModal,
    getAllWallets: getAllWallets,
    handleRedirectAfterAuth: handleRedirectAfterAuth,
    requireAuth: requireAuth,
    CONFIG: CONFIG
  };
})();
