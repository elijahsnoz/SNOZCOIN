/**
 * SNOZCOIN Dynamic Header
 * Renders navigation with cat paw wallet button, username display, and logout
 */

var DynamicHeader = (function() {
  'use strict';

  // Navigation config - disconnected state
  var NAV_DISCONNECTED = [
    { href: '#getting-started', label: 'Get Started' },
    { href: '#why-buy', label: 'Why Buy' },
    { href: '/creators.html', label: 'Creators' },
    { href: '#roadmap', label: 'Roadmap' },
    { href: '#faq', label: 'FAQ' }
  ];

  // Navigation config - connected state
  var NAV_CONNECTED = [
    { href: '/creators.html', label: 'Creators' },
    { href: '/swap.html', label: 'Swap' },
    { href: '/dashboard.html', label: 'Dashboard' },
    { href: '/stats.html', label: 'Stats' },
    { href: '#roadmap', label: 'Roadmap' }
  ];

  // Render header HTML
  function render(walletState, userState) {
    var isConnected = walletState && walletState.isConnected;
    var address = walletState ? walletState.address : null;
    var username = userState ? userState.username : null;
    
    var navItems = isConnected ? NAV_CONNECTED : NAV_DISCONNECTED;
    var currentPath = window.location.pathname;
    
    // Build navigation links
    var navHTML = '';
    for (var i = 0; i < navItems.length; i++) {
      var item = navItems[i];
      var activeClass = currentPath === item.href ? ' active' : '';
      navHTML += '<a href="' + item.href + '" class="nav-link' + activeClass + '">' + item.label + '</a>';
    }

    // Build wallet section
    var walletHTML = '';
    
    if (isConnected) {
      // Connected state - show user profile dropdown
      var displayName = username ? '@' + username : WalletAuth.formatAddress(address);
      
      walletHTML = '<div class="user-profile-wrapper" id="userProfileWrapper">' +
        '<button class="user-profile-btn" id="userProfileBtn">' +
          '<span class="user-avatar">' + WalletAuth.getCatPawIcon(24) + '</span>' +
          '<span class="user-name">' + displayName + '</span>' +
          '<span class="dropdown-arrow">▼</span>' +
        '</button>' +
        '<div class="user-dropdown" id="userDropdown">' +
          '<div class="user-dropdown-header">' +
            '<span class="user-dropdown-avatar">' + WalletAuth.getCatPawIcon(32) + '</span>' +
            '<div class="user-dropdown-info">' +
              '<span class="user-dropdown-name">' + (username ? '@' + username : 'No username') + '</span>' +
              '<span class="user-dropdown-address">' + WalletAuth.formatAddress(address) + '</span>' +
            '</div>' +
          '</div>' +
          '<div class="user-dropdown-divider"></div>' +
          '<a href="/dashboard.html" class="user-dropdown-item">' +
            '<span>📊</span> Dashboard' +
          '</a>' +
          '<a href="/profile.html" class="user-dropdown-item">' +
            '<span>👤</span> Profile' +
          '</a>' +
          (username ? '' : '<button class="user-dropdown-item" id="setUsernameBtn"><span>✏️</span> Set Username</button>') +
          '<div class="user-dropdown-divider"></div>' +
          '<button class="user-dropdown-item user-dropdown-logout" id="logoutBtn">' +
            '<span>🚪</span> Logout' +
          '</button>' +
        '</div>' +
      '</div>';
    } else {
      // Disconnected state - show cat paw connect button
      walletHTML = '<button class="cat-paw-btn" id="catPawConnectBtn" title="Connect Wallet">' +
        '<span class="cat-paw-icon">' + WalletAuth.getCatPawIcon(28) + '</span>' +
        '<span class="cat-paw-text">Connect</span>' +
      '</button>' +
      '<a class="cta nav-cta" href="https://t.me/snozcoin" target="_blank">Join Telegram</a>';
    }

    // Complete header HTML
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

    // Cat paw connect button
    var catPawBtn = document.getElementById('catPawConnectBtn');
    if (catPawBtn) {
      catPawBtn.onclick = function() {
        WalletAuth.showWalletModal().then(function(result) {
          WalletAuth.handleRedirectAfterAuth();
        }).catch(function(err) {
          if (err.message !== 'User closed wallet modal') {
            console.error('Connection failed:', err);
          }
        });
      };
    }

    // User profile dropdown
    var profileBtn = document.getElementById('userProfileBtn');
    var dropdown = document.getElementById('userDropdown');
    if (profileBtn && dropdown) {
      profileBtn.onclick = function(e) {
        e.stopPropagation();
        dropdown.classList.toggle('show');
      };
      
      // Close dropdown when clicking outside
      document.addEventListener('click', function(e) {
        if (dropdown.classList.contains('show') && !profileBtn.contains(e.target) && !dropdown.contains(e.target)) {
          dropdown.classList.remove('show');
        }
      });
    }

    // Set username button
    var setUsernameBtn = document.getElementById('setUsernameBtn');
    if (setUsernameBtn) {
      setUsernameBtn.onclick = function() {
        if (dropdown) dropdown.classList.remove('show');
        WalletAuth.showUsernameModal().then(function() {
          // Refresh header after username is set
          init();
        }).catch(function() {});
      };
    }

    // Logout button
    var logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
      logoutBtn.onclick = function() {
        WalletAuth.logout();
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

    // Get wallet and user state
    var walletState = WalletAuth.getState();
    var userState = WalletAuth.getUser();
    
    // Render header
    container.innerHTML = render(walletState, userState);
    attachEvents();

    // Listen for state changes
    WalletAuth.on('stateChange', function(newState) {
      var userState = WalletAuth.getUser();
      container.innerHTML = render(newState, userState);
      attachEvents();
    });

    WalletAuth.on('userChange', function(newUser) {
      var walletState = WalletAuth.getState();
      container.innerHTML = render(walletState, newUser);
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
