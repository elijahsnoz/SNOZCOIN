/**
 * SNOZCOIN Dynamic Header
 * Renders navigation based on wallet connection state
 */

var DynamicHeader = (function() {
  'use strict';

  // Navigation config
  var NAV_DISCONNECTED = [
    { href: '#getting-started', label: 'Get Started' },
    { href: '#why-buy', label: 'Why Buy' },
    { href: '/creators.html', label: 'Creators' },
    { href: '#roadmap', label: 'Roadmap' },
    { href: '#faq', label: 'FAQ' }
  ];

  var NAV_CONNECTED = [
    { href: '/creators.html', label: 'Creators' },
    { href: '/swap.html', label: 'Swap' },
    { href: '/dashboard.html', label: 'Dashboard' },
    { href: '/stats.html', label: 'Stats' },
    { href: '/api.html', label: 'API' },
    { href: '#roadmap', label: 'Roadmap' }
  ];

  // Render header HTML
  function render(isConnected, address) {
    var navItems = isConnected ? NAV_CONNECTED : NAV_DISCONNECTED;
    var currentPath = window.location.pathname;
    
    var navHTML = '';
    for (var i = 0; i < navItems.length; i++) {
      var item = navItems[i];
      var activeClass = currentPath === item.href ? ' active' : '';
      navHTML += '<a href="' + item.href + '" class="nav-link' + activeClass + '">' + item.label + '</a>';
    }

    var walletHTML = '';
    if (isConnected) {
      var shortAddr = WalletAuth.formatAddress(address);
      walletHTML = '<div class="wallet-dropdown-wrapper" id="walletDropdownWrapper">' +
        '<button class="wallet-dropdown-trigger" id="walletDropdownTrigger">' +
          '<span class="wallet-icon-small">💰</span>' +
          '<span>' + shortAddr + '</span>' +
          '<span class="dropdown-arrow">▼</span>' +
        '</button>' +
        '<div class="wallet-dropdown-menu" id="walletDropdownMenu">' +
          '<div class="dropdown-header">' +
            '<span class="dropdown-label">Connected</span>' +
            '<span class="dropdown-address">' + address + '</span>' +
          '</div>' +
          '<div class="dropdown-divider"></div>' +
          '<a href="/dashboard.html" class="dropdown-item">📊 Dashboard</a>' +
          '<button class="dropdown-item dropdown-item-danger" id="headerDisconnectBtn">🚪 Disconnect</button>' +
        '</div>' +
      '</div>';
    } else {
      walletHTML = '<button class="btn btn-primary wallet-connect-btn" id="headerConnectBtn">' +
        '🔗 Connect Wallet' +
      '</button>' +
      '<a class="cta nav-cta" href="https://t.me/snozcoin" target="_blank">Join Telegram</a>';
    }

    return '<header class="site-header">' +
      '<div class="container header-inner">' +
        '<a class="brand" href="/">' +
          '<img src="/assets/SNOZCOIN-128.png" alt="SNOZCOIN" class="brand-logo" />' +
          '<span class="brand-text">SnozCoin</span>' +
        '</a>' +
        '<nav class="nav" id="nav">' + navHTML + walletHTML + '</nav>' +
        '<button class="nav-toggle" id="navToggle" aria-label="Menu">' +
          '<span></span><span></span><span></span>' +
        '</button>' +
      '</div>' +
    '</header>';
  }

  // Attach event listeners
  function attachEvents() {
    // Mobile toggle
    var toggle = document.getElementById('navToggle');
    var nav = document.getElementById('nav');
    if (toggle && nav) {
      toggle.onclick = function() {
        nav.classList.toggle('show');
        toggle.classList.toggle('active');
      };
    }

    // Connect button
    var connectBtn = document.getElementById('headerConnectBtn');
    if (connectBtn) {
      connectBtn.onclick = function() {
        WalletAuth.showWalletModal().then(function(result) {
          WalletAuth.handleRedirectAfterAuth();
        }).catch(function(err) {
          if (err.message !== 'User closed wallet modal') {
            alert('Connection failed: ' + err.message);
          }
        });
      };
    }

    // Wallet dropdown
    var dropdownTrigger = document.getElementById('walletDropdownTrigger');
    var dropdownMenu = document.getElementById('walletDropdownMenu');
    if (dropdownTrigger && dropdownMenu) {
      dropdownTrigger.onclick = function(e) {
        e.stopPropagation();
        dropdownMenu.classList.toggle('show');
      };
      document.onclick = function(e) {
        if (!dropdownTrigger.contains(e.target)) {
          dropdownMenu.classList.remove('show');
        }
      };
    }

    // Disconnect button
    var disconnectBtn = document.getElementById('headerDisconnectBtn');
    if (disconnectBtn) {
      disconnectBtn.onclick = function() {
        WalletAuth.disconnect();
        window.location.href = '/';
      };
    }
  }

  // Initialize
  function init(containerId) {
    containerId = containerId || 'header-container';
    var container = document.getElementById(containerId);
    
    if (!container) {
      // Try to find and replace existing header
      var existing = document.querySelector('.site-header, header.navbar, nav.navbar');
      if (existing) {
        var wrapper = document.createElement('div');
        wrapper.id = containerId;
        existing.parentNode.insertBefore(wrapper, existing);
        existing.parentNode.removeChild(existing);
        container = wrapper;
      }
    }

    if (!container) {
      console.warn('DynamicHeader: No container found');
      return;
    }

    // Get wallet state
    var state = WalletAuth.getState();
    
    // Render header
    container.innerHTML = render(state.isConnected, state.address);
    attachEvents();

    // Listen for state changes
    WalletAuth.on('stateChange', function(newState) {
      container.innerHTML = render(newState.isConnected, newState.address);
      attachEvents();
    });
  }

  // Auto-init when ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      setTimeout(init, 50);
    });
  } else {
    setTimeout(init, 50);
  }

  return {
    init: init,
    render: render
  };
})();
