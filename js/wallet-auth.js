/**
 * SNOZCOIN Wallet Authentication Service
 * Simplified wallet connection for MetaMask and Phantom wallets
 * With username creation and logout functionality
 */

var WalletAuth = (function() {
  'use strict';

  var CONFIG = {
    appName: 'SNOZCOIN',
    redirectTo: '/dashboard.html',
    storageKey: 'snozcoin_wallet',
    userStorageKey: 'snozcoin_user'
  };

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
    }
  ];

  var _state = {
    isConnected: false,
    address: null,
    walletType: null,
    walletName: null
  };

  var _user = {
    username: null,
    createdAt: null
  };

  var _listeners = {
    connect: [],
    disconnect: [],
    stateChange: [],
    userChange: []
  };

  var _modal = null;

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
      var userSaved = localStorage.getItem(CONFIG.userStorageKey);
      if (userSaved) {
        var userData = JSON.parse(userSaved);
        if (userData && userData.username) {
          _user = userData;
          _emit('userChange', _user);
        }
      }
    } catch (e) {
      console.warn('WalletAuth init error:', e);
    }
    return _state;
  }

  function _saveState() {
    try {
      localStorage.setItem(CONFIG.storageKey, JSON.stringify(_state));
    } catch (e) {
      console.warn('Failed to save wallet state:', e);
    }
  }

  function _saveUser() {
    try {
      localStorage.setItem(CONFIG.userStorageKey, JSON.stringify(_user));
    } catch (e) {
      console.warn('Failed to save user profile:', e);
    }
  }

  function _emit(event, data) {
    if (_listeners[event]) {
      for (var i = 0; i < _listeners[event].length; i++) {
        _listeners[event][i](data);
      }
    }
  }

  function formatAddress(addr) {
    if (!addr) return '';
    if (addr.length <= 10) return addr;
    return addr.slice(0, 6) + '...' + addr.slice(-4);
  }

  function getState() {
    return {
      isConnected: _state.isConnected,
      address: _state.address,
      walletType: _state.walletType,
      walletName: _state.walletName
    };
  }

  function getUser() {
    return {
      username: _user.username,
      createdAt: _user.createdAt
    };
  }

  function isConnected() {
    return _state.isConnected;
  }

  function hasUsername() {
    return _user.username !== null && _user.username !== '';
  }

  function getAddress() {
    return _state.address;
  }

  function getUsername() {
    return _user.username;
  }

  function on(event, callback) {
    if (_listeners[event]) {
      _listeners[event].push(callback);
    }
  }

  function off(event, callback) {
    if (_listeners[event]) {
      _listeners[event] = _listeners[event].filter(function(fn) { return fn !== callback; });
    }
  }

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

  function getCatPawIcon(size) {
    size = size || 24;
    return '<svg width="' + size + '" height="' + size + '" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">' +
      '<ellipse cx="32" cy="44" rx="14" ry="12" fill="currentColor"/>' +
      '<ellipse cx="18" cy="28" rx="7" ry="8" fill="currentColor"/>' +
      '<ellipse cx="46" cy="28" rx="7" ry="8" fill="currentColor"/>' +
      '<ellipse cx="12" cy="42" rx="6" ry="7" fill="currentColor"/>' +
      '<ellipse cx="52" cy="42" rx="6" ry="7" fill="currentColor"/>' +
    '</svg>';
  }

  function showWalletModal() {
    return new Promise(function(resolve, reject) {
      hideWalletModal();
      var wallets = getAllWallets();
      
      var html = '<div class="wallet-modal-overlay" id="walletModalOverlay">' +
        '<div class="wallet-modal">' +
          '<div class="wallet-modal-header">' +
            '<div class="wallet-modal-icon">' + getCatPawIcon(48) + '</div>' +
            '<h2>Connect Your Wallet</h2>' +
            '<button class="wallet-modal-close" id="walletModalClose">&times;</button>' +
          '</div>' +
          '<div class="wallet-modal-body">' +
            '<p class="wallet-modal-subtitle">Choose your preferred wallet to access SNOZCOIN</p>' +
            '<div class="wallet-list">';
      
      for (var i = 0; i < wallets.length; i++) {
        var wallet = wallets[i];
        var statusText = wallet.installed ? 'Ready to connect' : 'Click to install';
        var statusClass = wallet.installed ? 'detected' : 'not-installed';
        
        html += '<button class="wallet-option ' + statusClass + '" data-wallet="' + wallet.id + '">' +
          '<span class="wallet-icon">' + wallet.icon + '</span>' +
          '<span class="wallet-info">' +
            '<span class="wallet-name">' + wallet.name + '</span>' +
            '<span class="wallet-status">' + statusText + '</span>' +
          '</span>' +
          '<span class="wallet-arrow">→</span>' +
        '</button>';
      }
      
      html += '</div>' +
            '<p class="wallet-modal-footer">New to crypto? <a href="https://metamask.io/learn/" target="_blank">Learn more</a></p>' +
          '</div>' +
        '</div>' +
      '</div>';

      var container = document.createElement('div');
      container.innerHTML = html;
      _modal = container.firstChild;
      document.body.appendChild(_modal);
      document.body.style.overflow = 'hidden';

      setTimeout(function() {
        _modal.classList.add('show');
      }, 10);

      function closeModal() {
        _modal.classList.remove('show');
        setTimeout(function() {
          hideWalletModal();
          reject(new Error('User closed wallet modal'));
        }, 200);
      }

      document.getElementById('walletModalClose').onclick = closeModal;
      document.getElementById('walletModalOverlay').onclick = function(e) {
        if (e.target.id === 'walletModalOverlay') closeModal();
      };

      document.onkeydown = function(e) {
        if (e.key === 'Escape') closeModal();
      };

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

            btn.classList.add('connecting');
            btn.innerHTML = '<span class="wallet-icon">' + walletData.icon + '</span>' +
              '<span class="wallet-info">' +
                '<span class="wallet-name">' + walletData.name + '</span>' +
                '<span class="wallet-status">Connecting...</span>' +
              '</span>' +
              '<span class="wallet-spinner"></span>';

            connect(walletId).then(function(result) {
              hideWalletModal();
              if (!hasUsername()) {
                showUsernameModal().then(function() {
                  resolve(result);
                }).catch(function() {
                  resolve(result);
                });
              } else {
                resolve(result);
              }
            }).catch(function(err) {
              btn.classList.remove('connecting');
              btn.classList.add('error');
              btn.innerHTML = '<span class="wallet-icon">' + walletData.icon + '</span>' +
                '<span class="wallet-info">' +
                  '<span class="wallet-name">' + walletData.name + '</span>' +
                  '<span class="wallet-status wallet-error">Failed - Try again</span>' +
                '</span>' +
                '<span class="wallet-arrow">→</span>';
              setTimeout(function() {
                btn.classList.remove('error');
              }, 2000);
            });
          };
        })(buttons[j]);
      }
    });
  }

  function showUsernameModal() {
    return new Promise(function(resolve, reject) {
      hideWalletModal();

      var html = '<div class="wallet-modal-overlay show" id="usernameModalOverlay">' +
        '<div class="wallet-modal username-modal">' +
          '<div class="wallet-modal-header">' +
            '<div class="wallet-modal-icon">' + getCatPawIcon(48) + '</div>' +
            '<h2>Create Your Username</h2>' +
          '</div>' +
          '<div class="wallet-modal-body">' +
            '<p class="wallet-modal-subtitle">Choose a unique username for your SNOZCOIN profile</p>' +
            '<div class="username-input-wrapper">' +
              '<span class="username-prefix">@</span>' +
              '<input type="text" id="usernameInput" class="username-input" placeholder="yourname" maxlength="20" autocomplete="off" />' +
            '</div>' +
            '<p class="username-rules">3-20 characters, letters, numbers, and underscores only</p>' +
            '<p class="username-error" id="usernameError"></p>' +
            '<button class="btn btn-primary btn-full" id="saveUsernameBtn" disabled>Create Username</button>' +
            '<button class="btn btn-ghost btn-full" id="skipUsernameBtn">Skip for now</button>' +
          '</div>' +
        '</div>' +
      '</div>';

      var container = document.createElement('div');
      container.innerHTML = html;
      _modal = container.firstChild;
      document.body.appendChild(_modal);
      document.body.style.overflow = 'hidden';

      var input = document.getElementById('usernameInput');
      var saveBtn = document.getElementById('saveUsernameBtn');
      var skipBtn = document.getElementById('skipUsernameBtn');
      var errorEl = document.getElementById('usernameError');

      function validateUsername(value) {
        if (!value || value.length < 3) {
          return { valid: false, error: 'Username must be at least 3 characters' };
        }
        if (value.length > 20) {
          return { valid: false, error: 'Username must be 20 characters or less' };
        }
        if (!/^[a-zA-Z0-9_]+$/.test(value)) {
          return { valid: false, error: 'Only letters, numbers, and underscores allowed' };
        }
        if (/^[0-9]/.test(value)) {
          return { valid: false, error: 'Username cannot start with a number' };
        }
        return { valid: true, error: '' };
      }

      input.oninput = function() {
        var value = input.value.trim().toLowerCase();
        input.value = value;
        var result = validateUsername(value);
        if (value.length > 0 && !result.valid) {
          errorEl.textContent = result.error;
          errorEl.style.display = 'block';
          saveBtn.disabled = true;
        } else {
          errorEl.style.display = 'none';
          saveBtn.disabled = value.length < 3;
        }
      };

      input.onkeydown = function(e) {
        if (e.key === 'Enter' && !saveBtn.disabled) {
          saveBtn.click();
        }
      };

      saveBtn.onclick = function() {
        var username = input.value.trim().toLowerCase();
        var result = validateUsername(username);
        if (!result.valid) {
          errorEl.textContent = result.error;
          errorEl.style.display = 'block';
          return;
        }

        _user = {
          username: username,
          createdAt: new Date().toISOString()
        };
        _saveUser();
        _emit('userChange', _user);

        hideWalletModal();
        resolve(username);
      };

      skipBtn.onclick = function() {
        hideWalletModal();
        reject(new Error('User skipped username creation'));
      };

      setTimeout(function() {
        input.focus();
      }, 100);
    });
  }

  function hideWalletModal() {
    if (_modal && _modal.parentNode) {
      _modal.parentNode.removeChild(_modal);
    }
    _modal = null;
    document.body.style.overflow = '';
    document.onkeydown = null;
  }

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
    }
    
    return Promise.reject(new Error('Unsupported wallet type'));
  }

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

  function disconnect() {
    _state = {
      isConnected: false,
      address: null,
      walletType: null,
      walletName: null
    };
    _user = {
      username: null,
      createdAt: null
    };
    try {
      localStorage.removeItem(CONFIG.storageKey);
      localStorage.removeItem(CONFIG.userStorageKey);
    } catch (e) {}
    _emit('disconnect', _state);
    _emit('stateChange', _state);
    _emit('userChange', _user);
    return _state;
  }

  function logout() {
    return disconnect();
  }

  function handleRedirectAfterAuth() {
    var redirect = sessionStorage.getItem('snozcoin_redirect');
    if (redirect) {
      sessionStorage.removeItem('snozcoin_redirect');
      window.location.href = redirect;
    } else {
      window.location.href = CONFIG.redirectTo;
    }
  }

  function requireAuth(redirectUrl) {
    if (!_state.isConnected) {
      sessionStorage.setItem('snozcoin_redirect', window.location.pathname);
      window.location.href = redirectUrl || '/';
      return false;
    }
    return true;
  }

  function updateUsername(newUsername) {
    if (!newUsername || newUsername.length < 3) {
      return false;
    }
    _user.username = newUsername.toLowerCase();
    _saveUser();
    _emit('userChange', _user);
    return true;
  }

  init();

  return {
    init: init,
    connect: connect,
    disconnect: disconnect,
    logout: logout,
    isConnected: isConnected,
    hasUsername: hasUsername,
    getState: getState,
    getUser: getUser,
    getAddress: getAddress,
    getUsername: getUsername,
    updateUsername: updateUsername,
    formatAddress: formatAddress,
    on: on,
    off: off,
    showWalletModal: showWalletModal,
    showUsernameModal: showUsernameModal,
    hideWalletModal: hideWalletModal,
    getAllWallets: getAllWallets,
    getCatPawIcon: getCatPawIcon,
    handleRedirectAfterAuth: handleRedirectAfterAuth,
    requireAuth: requireAuth,
    CONFIG: CONFIG
  };
})();
