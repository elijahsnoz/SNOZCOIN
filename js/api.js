/**
 * SNOZCOIN API Page JavaScript
 * Handles:
 * - Code copy functionality
 * - API key management UI
 * - Mobile navigation
 */

document.addEventListener('DOMContentLoaded', function() {
  // Initialize code copy buttons
  initCodeCopy();
  
  // Initialize API key management
  initAPIKeyManagement();
  
  // Initialize mobile navigation
  initMobileNav();
});

/**
 * Initialize code copy functionality
 */
function initCodeCopy() {
  const copyButtons = document.querySelectorAll('.code-copy');
  
  copyButtons.forEach(btn => {
    btn.addEventListener('click', async () => {
      const codeId = btn.getAttribute('data-code');
      const codeBlock = document.getElementById(codeId);
      
      if (codeBlock) {
        try {
          // Get text content, stripping HTML tags
          const code = codeBlock.textContent;
          await navigator.clipboard.writeText(code);
          
          // Show success feedback
          const originalText = btn.innerHTML;
          btn.innerHTML = `
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
              <path d="M20 6L9 17l-5-5"/>
            </svg>
            Copied!
          `;
          btn.style.color = '#22c55e';
          
          setTimeout(() => {
            btn.innerHTML = originalText;
            btn.style.color = '';
          }, 2000);
        } catch (err) {
          console.error('Failed to copy:', err);
        }
      }
    });
  });
}

/**
 * Initialize API key management
 */
function initAPIKeyManagement() {
  const createKeyBtn = document.getElementById('create-api-key');
  const connectPrompt = document.querySelector('.connect-prompt-mini');
  const keysList = document.querySelector('.api-keys-list');
  
  // Check if wallet is connected (mock for demo)
  const isConnected = false; // Would check actual wallet state
  
  if (connectPrompt && keysList) {
    if (isConnected) {
      connectPrompt.style.display = 'none';
      keysList.style.display = 'block';
    } else {
      keysList.style.display = 'none';
      connectPrompt.style.display = 'flex';
    }
  }
  
  // Create new API key
  if (createKeyBtn) {
    createKeyBtn.addEventListener('click', () => {
      if (!isConnected) {
        showToast('Please connect your wallet first', 'warning');
        return;
      }
      
      // Would open a modal or trigger key creation
      showToast('API key creation coming soon!', 'info');
    });
  }
  
  // Copy key buttons
  const copyKeyBtns = document.querySelectorAll('.api-key-item .btn-icon[title="Copy key"]');
  copyKeyBtns.forEach(btn => {
    btn.addEventListener('click', async () => {
      // In production, this would copy the full key
      showToast('API key copied to clipboard!', 'success');
    });
  });
  
  // Revoke key buttons
  const revokeKeyBtns = document.querySelectorAll('.api-key-item .btn-icon[title="Revoke key"]');
  revokeKeyBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      if (confirm('Are you sure you want to revoke this API key? This action cannot be undone.')) {
        showToast('API key revoked', 'success');
        // Would trigger actual key revocation
      }
    });
  });
}

/**
 * Initialize mobile navigation
 */
function initMobileNav() {
  const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
  const navLinks = document.querySelector('.nav-links');
  
  if (mobileMenuBtn && navLinks) {
    mobileMenuBtn.addEventListener('click', () => {
      navLinks.classList.toggle('show');
      mobileMenuBtn.classList.toggle('active');
    });
    
    // Close on outside click
    document.addEventListener('click', (e) => {
      if (!navLinks.contains(e.target) && !mobileMenuBtn.contains(e.target)) {
        navLinks.classList.remove('show');
        mobileMenuBtn.classList.remove('active');
      }
    });
  }
}

/**
 * Show toast notification
 */
function showToast(message, type = 'info') {
  // Check if toast container exists, create if not
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }
  
  const icons = {
    success: '✓',
    error: '✕',
    warning: '⚠',
    info: 'ℹ'
  };
  
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <span class="toast-icon">${icons[type] || icons.info}</span>
    <span class="toast-message">${message}</span>
    <button class="toast-close" onclick="this.parentElement.remove()">×</button>
  `;
  
  container.appendChild(toast);
  
  // Trigger animation
  setTimeout(() => toast.classList.add('show'), 10);
  
  // Auto remove
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

/**
 * Smooth scroll for anchor links
 */
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function(e) {
    const href = this.getAttribute('href');
    if (href.length > 1) {
      e.preventDefault();
      const target = document.querySelector(href);
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  });
});
