/**
 * SNOZCOIN Route Guard
 * Protects private routes by requiring wallet connection
 */

const RouteGuard = (function() {
  'use strict';

  // Pages that require wallet connection
  const PROTECTED_ROUTES = [
    '/dashboard.html',
    '/settings.html'
  ];

  // Pages that should redirect if already connected
  const AUTH_ROUTES = [
    // Add login/connect pages here if needed
  ];

  /**
   * Check if current page is protected
   */
  function isProtectedRoute(path = window.location.pathname) {
    return PROTECTED_ROUTES.some(route => path === route || path.endsWith(route));
  }

  /**
   * Check if current page is an auth route
   */
  function isAuthRoute(path = window.location.pathname) {
    return AUTH_ROUTES.some(route => path === route || path.endsWith(route));
  }

  /**
   * Initialize route guard
   */
  function init() {
    const currentPath = window.location.pathname;
    const isConnected = WalletAuth.isConnected();

    // If on protected route and not connected, redirect to home with modal
    if (isProtectedRoute(currentPath) && !isConnected) {
      // Store intended destination
      sessionStorage.setItem('snozcoin_redirect_after_auth', currentPath);
      
      // Redirect to home
      window.location.href = '/?connect=true';
      return false;
    }

    // If on auth route and already connected, redirect to dashboard
    if (isAuthRoute(currentPath) && isConnected) {
      window.location.href = '/dashboard.html';
      return false;
    }

    // Check URL params for auto-connect modal
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('connect') === 'true' && !isConnected) {
      // Trigger connect modal after page load
      setTimeout(() => {
        const connectBtn = document.getElementById('headerConnectBtn');
        if (connectBtn) {
          connectBtn.click();
        } else if (typeof showWalletSelectionModal === 'function') {
          showWalletSelectionModal();
        }
      }, 500);
    }

    return true;
  }

  /**
   * Require auth for specific actions
   */
  function requireAuth(callback, options = {}) {
    const { redirectUrl = '/', showModal = true } = options;
    
    if (WalletAuth.isConnected()) {
      return callback();
    }

    // Store callback action
    sessionStorage.setItem('snozcoin_pending_action', callback.toString());
    
    if (showModal && typeof showWalletSelectionModal === 'function') {
      showWalletSelectionModal();
    } else {
      window.location.href = redirectUrl + '?connect=true';
    }
    
    return false;
  }

  /**
   * Display auth required message
   */
  function showAuthRequired(message = 'Please connect your wallet to continue') {
    if (typeof showToast === 'function') {
      showToast(message, 'warning');
    } else {
      alert(message);
    }
  }

  // Public API
  return {
    init,
    isProtectedRoute,
    isAuthRoute,
    requireAuth,
    showAuthRequired,
    PROTECTED_ROUTES
  };
})();

// Auto-initialize when DOM is ready
if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      // Wait for WalletAuth to initialize first
      setTimeout(() => RouteGuard.init(), 50);
    });
  } else {
    setTimeout(() => RouteGuard.init(), 50);
  }
}
