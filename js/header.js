/**
 * SNOZCOIN Dynamic Header Component
 * Renders navigation based on wallet connection state
 */

const DynamicHeader = (function() {
  'use strict';

  // Navigation configurations
  const NAV_CONFIG = {
    // When wallet is NOT connected
    disconnected: [
      { href: '#getting-started', label: 'Get Started', type: 'anchor' },
      { href: '#why-buy', label: 'Why Buy', type: 'anchor' },
      { href: '/creators.html', label: 'Creators', type: 'link' },
      { href: '#roadmap', label: 'Roadmap', type: 'anchor' },
      { href: '#faq', label: 'FAQ', type: 'anchor' }
    ],
    // When wallet IS connected
    connected: [
      { href: '/creators.html', label: 'Creators', type: 'link' },
      { href: '/swap.html', label: 'Swap', type: 'link', highlight: true },
      { href: '/dashboard.html', label: 'Dashboard', type: 'link' },
      { href: '/stats.html', label: 'Stats', type: 'link' },
      { href: '/api.html', label: 'API', type: 'link' },
      { href: '#roadmap', label: 'Roadmap', type: 'anchor' }
    ],
    // Wallet dropdown menu items
    walletDropdown: [
      { href: '/dashboard.html', label: 'Dashboard', icon: '📊' },
      { href: '/settings.html', label: 'Settings', icon: '⚙️' },
      { action: 'disconnect', label: 'Disconnect', icon: '🚪' }
    ],
    // CTA when disconnected
    ctaDisconnected: { href: 'https://t.me/snozcoin', label: 'Join Telegram', external: true }
  };

  // Current page detection for active states
  const currentPath = window.location.pathname;

  /**
   * Generate header HTML
   */
  function render(isConnected, walletAddress) {
    const navItems = isConnected ? NAV_CONFIG.connected : NAV_CONFIG.disconnected;
    
    return `
      <header class="site-header" id="dynamic-header">
        <div class="container header-inner">
          <a class="brand" href="/">
            <picture>
              <source srcset="/assets/SNOZCOIN-128.webp" type="image/webp">
              <img src="/assets/SNOZCOIN-128.png" alt="SNOZCOIN logo" class="brand-logo" />
            </picture>
            <span class="brand-text">SnozCoin</span>
          </a>
          
          <nav class="nav" id="nav">
            ${renderNavItems(navItems)}
            ${isConnected ? renderWalletDropdown(walletAddress) : renderConnectButton()}
          </nav>
          
          <button class="nav-toggle" id="navToggle" aria-label="Toggle navigation">
            <span></span><span></span><span></span>
          </button>
        </div>
      </header>
    `;
  }

  /**
   * Render navigation items
   */
  function renderNavItems(items) {
    return items.map(item => {
      const isActive = item.type === 'link' && currentPath === item.href;
      const activeClass = isActive ? ' active' : '';
      const highlightClass = item.highlight ? ' nav-highlight' : '';
      
      return `<a href="${item.href}" class="nav-link${activeClass}${highlightClass}">${item.label}</a>`;
    }).join('');
  }

  /**
   * Render connect wallet button
   */
  function renderConnectButton() {
    return `
      <button class="btn btn-primary wallet-connect-btn" id="headerConnectBtn">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18">
          <rect x="2" y="6" width="20" height="12" rx="2"/>
          <path d="M22 10H18a2 2 0 00-2 2v0a2 2 0 002 2h4"/>
        </svg>
        <span>Connect Wallet</span>
      </button>
      <a class="cta nav-cta" href="${NAV_CONFIG.ctaDisconnected.href}" target="_blank" rel="noopener">
        ${NAV_CONFIG.ctaDisconnected.label}
      </a>
    `;
  }

  /**
   * Render wallet dropdown when connected
   */
  function renderWalletDropdown(address) {
    const formattedAddress = WalletAuth.formatAddress(address);
    
    return `
      <div class="wallet-dropdown-wrapper" id="walletDropdownWrapper">
        <button class="wallet-dropdown-trigger" id="walletDropdownTrigger" aria-expanded="false">
          <span class="wallet-avatar">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18">
              <rect x="2" y="6" width="20" height="12" rx="2"/>
              <path d="M22 10H18a2 2 0 00-2 2v0a2 2 0 002 2h4"/>
              <circle cx="18" cy="12" r="1" fill="currentColor"/>
            </svg>
          </span>
          <span class="wallet-address-text">${formattedAddress}</span>
          <svg class="dropdown-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
            <path d="M6 9l6 6 6-6"/>
          </svg>
        </button>
        
        <div class="wallet-dropdown-menu" id="walletDropdownMenu">
          <div class="dropdown-header">
            <span class="dropdown-label">Connected Wallet</span>
            <span class="dropdown-address">${address}</span>
          </div>
          <div class="dropdown-divider"></div>
          ${NAV_CONFIG.walletDropdown.map(item => {
            if (item.action === 'disconnect') {
              return `
                <button class="dropdown-item dropdown-item-danger" id="headerDisconnectBtn">
                  <span class="dropdown-icon">${item.icon}</span>
                  <span>${item.label}</span>
                </button>
              `;
            }
            return `
              <a href="${item.href}" class="dropdown-item">
                <span class="dropdown-icon">${item.icon}</span>
                <span>${item.label}</span>
              </a>
            `;
          }).join('')}
        </div>
      </div>
    `;
  }

  /**
   * Initialize the header and attach event listeners
   */
  function init(containerId = 'header-container') {
    console.log('DynamicHeader.init called with container:', containerId);
    const container = document.getElementById(containerId);
    
    // If no container, try to replace existing header
    if (!container) {
      console.log('Container not found, looking for existing header...');
      const existingHeader = document.querySelector('.site-header, header.navbar');
      if (existingHeader) {
        const wrapper = document.createElement('div');
        wrapper.id = containerId;
        existingHeader.parentNode.insertBefore(wrapper, existingHeader);
        existingHeader.remove();
        return init(containerId);
      }
      console.error('Header container not found');
      return;
    }

    console.log('Container found, getting wallet state...');
    // Get initial state
    const state = WalletAuth.getState();
    console.log('Wallet state:', state);
    
    // Render header
    container.innerHTML = render(state.isConnected, state.address);
    console.log('Header rendered');
    
    // Attach event listeners
    attachEventListeners();
    
    // Subscribe to wallet state changes
    WalletAuth.on('stateChange', (newState) => {
      console.log('Wallet state changed:', newState);
      container.innerHTML = render(newState.isConnected, newState.address);
      attachEventListeners();
    });
  }

  /**
   * Attach all event listeners
   */
  function attachEventListeners() {
    console.log('attachEventListeners called');
    
    // Mobile nav toggle
    const navToggle = document.getElementById('navToggle');
    const nav = document.getElementById('nav');
    
    if (navToggle && nav) {
      navToggle.addEventListener('click', () => {
        nav.classList.toggle('show');
        navToggle.classList.toggle('active');
      });
      
      // Close nav when clicking a link
      nav.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
          nav.classList.remove('show');
          navToggle.classList.remove('active');
        });
      });
    }

    // Connect wallet button
    const connectBtn = document.getElementById('headerConnectBtn');
    console.log('Connect button found:', connectBtn);
    if (connectBtn) {
      connectBtn.addEventListener('click', handleConnect);
      console.log('Connect button listener attached');
    } else {
      console.warn('Connect button NOT found - user may already be connected');
    }

    // Wallet dropdown toggle
    const dropdownTrigger = document.getElementById('walletDropdownTrigger');
    const dropdownMenu = document.getElementById('walletDropdownMenu');
    
    if (dropdownTrigger && dropdownMenu) {
      dropdownTrigger.addEventListener('click', (e) => {
        e.stopPropagation();
        const isOpen = dropdownMenu.classList.toggle('show');
        dropdownTrigger.setAttribute('aria-expanded', isOpen);
      });
      
      // Close dropdown when clicking outside
      document.addEventListener('click', (e) => {
        if (!dropdownTrigger.contains(e.target) && !dropdownMenu.contains(e.target)) {
          dropdownMenu.classList.remove('show');
          dropdownTrigger.setAttribute('aria-expanded', 'false');
        }
      });
    }

    // Disconnect button
    const disconnectBtn = document.getElementById('headerDisconnectBtn');
    if (disconnectBtn) {
      disconnectBtn.addEventListener('click', handleDisconnect);
    }
  }

  /**
   * Handle wallet connection
   */
  async function handleConnect() {
    console.log('handleConnect called');
    const btn = document.getElementById('headerConnectBtn');
    if (!btn) {
      console.error('Connect button not found');
      return;
    }

    try {
      console.log('Showing wallet modal...');
      // Show wallet selection modal
      const result = await WalletAuth.showWalletModal();
      console.log('Wallet connected:', result);
      
      // Redirect to dashboard after successful connection
      WalletAuth.handleRedirectAfterAuth();
      
    } catch (error) {
      console.error('Connection failed:', error);
      
      // Only show error if it's not just closing the modal
      if (error.message !== 'User closed wallet modal') {
        // Show error toast if available
        if (typeof showToast === 'function') {
          showToast(error.message || 'Failed to connect wallet', 'error');
        }
      }
    }
  }

  /**
   * Handle wallet disconnection
   */
  function handleDisconnect() {
    WalletAuth.disconnect();
    
    // Show success message
    if (typeof showToast === 'function') {
      showToast('Wallet disconnected', 'info');
    }

    // Redirect to home if on a protected page
    const protectedPages = ['/dashboard.html', '/settings.html'];
    if (protectedPages.includes(window.location.pathname)) {
      window.location.href = '/';
    }
  }

  // Public API
  return {
    init,
    render,
    NAV_CONFIG
  };
})();

// Auto-initialize when DOM is ready
if (typeof document !== 'undefined') {
  console.log('DynamicHeader: Setting up auto-initialization');
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      console.log('DOMContentLoaded - initializing DynamicHeader');
      DynamicHeader.init();
    });
  } else {
    // Small delay to ensure WalletAuth is initialized first
    console.log('Document already loaded - initializing DynamicHeader with delay');
    setTimeout(() => DynamicHeader.init(), 10);
  }
}
