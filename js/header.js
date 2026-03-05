/**
 * SNOZCOIN Dynamic Header
 * Simple navigation without wallet connect button
 */

var DynamicHeader = (function() {
  'use strict';

  // Navigation links
  var NAV_ITEMS = [
    { href: '#getting-started', label: 'Get Started' },
    { href: '#why-buy', label: 'Why Buy' },
    { href: '/creators.html', label: 'Creators' },
    { href: '#roadmap', label: 'Roadmap' },
    { href: '#faq', label: 'FAQ' }
  ];

  // Render header HTML
  function render() {
    var currentPath = window.location.pathname;
    
    // Build navigation links
    var navHTML = '';
    for (var i = 0; i < NAV_ITEMS.length; i++) {
      var item = NAV_ITEMS[i];
      var activeClass = currentPath === item.href ? ' active' : '';
      navHTML += '<a href="' + item.href + '" class="nav-link' + activeClass + '">' + item.label + '</a>';
    }

    // Add Telegram CTA
    navHTML += '<a class="cta nav-cta" href="https://t.me/snozcoin" target="_blank">Join Telegram</a>';

    // Complete header HTML
    return '<header class="site-header">' +
      '<div class="container header-inner">' +
        '<a class="brand" href="/">' +
          '<img src="/assets/SNOZCOIN-128.png" alt="SNOZCOIN" class="brand-logo" />' +
          '<span class="brand-text">SnozCoin</span>' +
        '</a>' +
        '<nav class="nav" id="nav">' + navHTML + '</nav>' +
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

    // Render header
    container.innerHTML = render();
    attachEvents();
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
