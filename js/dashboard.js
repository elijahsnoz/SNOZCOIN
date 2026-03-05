/**
 * SNOZCOIN Dashboard
 * Creator Dashboard with MetaMask and Phantom wallet integration
 */

(function() {
    'use strict';

    // WALLET PROVIDERS (MetaMask & Phantom)
    var WALLET_PROVIDERS = {
        metamask: {
            name: 'MetaMask',
            icon: '🦊',
            detect: function() {
                return typeof window.ethereum !== 'undefined' && window.ethereum.isMetaMask;
            },
            connect: function() {
                return window.ethereum.request({ method: 'eth_requestAccounts' })
                    .then(function(accounts) {
                        return accounts[0];
                    });
            },
            getAddress: function() {
                if (window.ethereum && window.ethereum.selectedAddress) {
                    return window.ethereum.selectedAddress;
                }
                return null;
            },
            getBalance: function(address) {
                var alchemyUrl = 'https://eth-mainnet.g.alchemy.com/v2/demo';
                return fetch(alchemyUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        jsonrpc: '2.0',
                        method: 'eth_getBalance',
                        params: [address, 'latest'],
                        id: 1
                    })
                })
                .then(function(r) { return r.json(); })
                .then(function(data) {
                    if (data.result) {
                        var wei = parseInt(data.result, 16);
                        return (wei / 1e18).toFixed(4) + ' ETH';
                    }
                    return '0 ETH';
                })
                .catch(function() { return '0 ETH'; });
            }
        },
        phantom: {
            name: 'Phantom',
            icon: '👻',
            detect: function() {
                return typeof window.solana !== 'undefined' && window.solana.isPhantom;
            },
            connect: function() {
                return window.solana.connect()
                    .then(function(resp) {
                        return resp.publicKey.toString();
                    });
            },
            getAddress: function() {
                if (window.solana && window.solana.publicKey) {
                    return window.solana.publicKey.toString();
                }
                return null;
            },
            getBalance: function(address) {
                return fetch('https://api.mainnet-beta.solana.com', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        jsonrpc: '2.0',
                        id: 1,
                        method: 'getBalance',
                        params: [address]
                    })
                })
                .then(function(r) { return r.json(); })
                .then(function(data) {
                    if (data.result && data.result.value) {
                        var sol = data.result.value / 1e9;
                        return sol.toFixed(4) + ' SOL';
                    }
                    return '0 SOL';
                })
                .catch(function() { return '0 SOL'; });
            }
        }
    };

    // DASHBOARD STATE
    var DashboardState = {
        isConnected: false,
        walletAddress: null,
        walletType: null,
        walletBalance: null,
        username: null
    };

    // STORAGE
    var STORAGE_KEY = 'snoz_dashboard_state';
    var USER_STORAGE_KEY = 'snoz_user_profile';

    function saveState() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify({
                walletAddress: DashboardState.walletAddress,
                walletType: DashboardState.walletType,
                username: DashboardState.username
            }));
        } catch (e) { console.error('Save failed:', e); }
    }

    function loadState() {
        try {
            var saved = localStorage.getItem(STORAGE_KEY);
            return saved ? JSON.parse(saved) : null;
        } catch (e) { return null; }
    }

    function saveUserProfile(profile) {
        try {
            localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(profile));
        } catch (e) { console.error('Profile save failed:', e); }
    }

    function loadUserProfile() {
        try {
            var saved = localStorage.getItem(USER_STORAGE_KEY);
            return saved ? JSON.parse(saved) : null;
        } catch (e) { return null; }
    }

    // WALLET MODAL
    function showWalletModal() {
        var existing = document.getElementById('dashboard-wallet-modal');
        if (existing) existing.remove();

        var modal = document.createElement('div');
        modal.id = 'dashboard-wallet-modal';
        modal.className = 'wallet-modal-overlay';
        modal.innerHTML = '<div class="wallet-modal">' +
            '<div class="wallet-modal-header">' +
            '<h3>Connect Wallet</h3>' +
            '<button class="wallet-modal-close" id="close-modal-btn">&times;</button>' +
            '</div>' +
            '<div class="wallet-modal-body">' +
            '<p class="wallet-modal-subtitle">Choose your wallet to access the creator dashboard</p>' +
            '<div class="wallet-options">' +
            '<button class="wallet-option" id="metamask-btn">' +
            '<span class="wallet-icon">🦊</span>' +
            '<span class="wallet-name">MetaMask</span>' +
            '<span class="wallet-status" id="metamask-status"></span>' +
            '</button>' +
            '<button class="wallet-option" id="phantom-btn">' +
            '<span class="wallet-icon">👻</span>' +
            '<span class="wallet-name">Phantom</span>' +
            '<span class="wallet-status" id="phantom-status"></span>' +
            '</button>' +
            '</div></div></div>';

        document.body.appendChild(modal);

        document.getElementById('close-modal-btn').onclick = function() { modal.remove(); };

        var metamaskBtn = document.getElementById('metamask-btn');
        var phantomBtn = document.getElementById('phantom-btn');
        var metamaskStatus = document.getElementById('metamask-status');
        var phantomStatus = document.getElementById('phantom-status');

        if (WALLET_PROVIDERS.metamask.detect()) {
            metamaskStatus.textContent = 'Available';
            metamaskStatus.style.color = '#4ade80';
            metamaskBtn.onclick = function() { connectWallet('metamask'); };
        } else {
            metamaskStatus.textContent = 'Not Installed';
            metamaskStatus.style.color = '#f87171';
            metamaskBtn.onclick = function() { window.open('https://metamask.io/download/', '_blank'); };
        }

        if (WALLET_PROVIDERS.phantom.detect()) {
            phantomStatus.textContent = 'Available';
            phantomStatus.style.color = '#4ade80';
            phantomBtn.onclick = function() { connectWallet('phantom'); };
        } else {
            phantomStatus.textContent = 'Not Installed';
            phantomStatus.style.color = '#f87171';
            phantomBtn.onclick = function() { window.open('https://phantom.app/', '_blank'); };
        }

        modal.addEventListener('click', function(e) {
            if (e.target === modal) modal.remove();
        });
    }

    // USERNAME MODAL
    function showUsernameModal() {
        var existing = document.getElementById('username-modal');
        if (existing) existing.remove();

        var modal = document.createElement('div');
        modal.id = 'username-modal';
        modal.className = 'wallet-modal-overlay';
        modal.innerHTML = '<div class="wallet-modal">' +
            '<div class="wallet-modal-header"><h3>Create Your Profile</h3></div>' +
            '<div class="wallet-modal-body">' +
            '<p class="wallet-modal-subtitle">Choose a username for your creator profile</p>' +
            '<div class="username-form">' +
            '<input type="text" id="username-input" placeholder="Enter username" maxlength="20" />' +
            '<p class="username-hint">3-20 characters, letters, numbers, underscores only</p>' +
            '<button id="save-username-btn" class="btn-primary">Save Username</button>' +
            '</div></div></div>';

        document.body.appendChild(modal);

        var input = document.getElementById('username-input');
        var saveBtn = document.getElementById('save-username-btn');
        input.focus();

        saveBtn.onclick = function() {
            var username = input.value.trim();
            if (/^[a-zA-Z0-9_]{3,20}$/.test(username)) {
                DashboardState.username = username;
                saveState();
                saveUserProfile({
                    username: username,
                    walletAddress: DashboardState.walletAddress,
                    createdAt: new Date().toISOString()
                });
                modal.remove();
                updateDashboardUI();
                showNotification('Profile created! Welcome, ' + username);
            } else {
                input.style.borderColor = '#f87171';
                showNotification('Invalid username', 'error');
            }
        };

        input.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') saveBtn.click();
        });
    }

    // WALLET CONNECTION
    function connectWallet(walletType) {
        var provider = WALLET_PROVIDERS[walletType];
        if (!provider || !provider.detect()) {
            showNotification(provider ? provider.name + ' not installed' : 'Unknown wallet', 'error');
            return;
        }

        showNotification('Connecting to ' + provider.name + '...', 'info');

        provider.connect()
            .then(function(address) {
                DashboardState.isConnected = true;
                DashboardState.walletAddress = address;
                DashboardState.walletType = walletType;
                saveState();

                var modal = document.getElementById('dashboard-wallet-modal');
                if (modal) modal.remove();

                return provider.getBalance(address).then(function(balance) {
                    DashboardState.walletBalance = balance;
                    return address;
                });
            })
            .then(function() {
                var profile = loadUserProfile();
                if (profile && profile.username && profile.walletAddress === DashboardState.walletAddress) {
                    DashboardState.username = profile.username;
                    updateDashboardUI();
                    showNotification('Welcome back, ' + DashboardState.username + '!');
                } else {
                    showUsernameModal();
                }
            })
            .catch(function(err) {
                console.error('Connection failed:', err);
                showNotification('Failed to connect: ' + (err.message || 'Unknown error'), 'error');
            });
    }

    function disconnectWallet() {
        DashboardState.isConnected = false;
        DashboardState.walletAddress = null;
        DashboardState.walletType = null;
        DashboardState.walletBalance = null;
        DashboardState.username = null;
        localStorage.removeItem(STORAGE_KEY);
        updateDashboardUI();
        showNotification('Wallet disconnected');
    }

    function checkWalletConnection() {
        var savedState = loadState();
        if (!savedState || !savedState.walletAddress || !savedState.walletType) return false;

        var provider = WALLET_PROVIDERS[savedState.walletType];
        if (!provider || !provider.detect()) return false;

        var currentAddress = provider.getAddress();
        if (currentAddress && currentAddress.toLowerCase() === savedState.walletAddress.toLowerCase()) {
            DashboardState.isConnected = true;
            DashboardState.walletAddress = currentAddress;
            DashboardState.walletType = savedState.walletType;
            DashboardState.username = savedState.username;

            provider.getBalance(currentAddress).then(function(balance) {
                DashboardState.walletBalance = balance;
                updateDashboardUI();
            });
            return true;
        }
        return false;
    }

    // UI UPDATES
    function updateDashboardUI() {
        var connectSection = document.getElementById('dashboard-not-connected');
        var dashboardConnected = document.getElementById('dashboard-connected');
        var demoBadge = document.querySelector('.dashboard-badge');

        if (DashboardState.isConnected) {
            if (connectSection) connectSection.style.display = 'none';
            if (dashboardConnected) {
                dashboardConnected.style.display = 'block';
                dashboardConnected.classList.remove('hidden-default');
            }
            if (demoBadge) demoBadge.style.display = 'none';
            updateUserInfo();
            updateStats();
        } else {
            if (connectSection) connectSection.style.display = 'block';
            if (dashboardConnected) {
                dashboardConnected.style.display = 'none';
                dashboardConnected.classList.add('hidden-default');
            }
        }
        addLogoutButton();
    }

    function addLogoutButton() {
        var userCard = document.querySelector('.dashboard-user-card');
        if (!userCard) return;

        var existingBtn = document.getElementById('dashboard-logout-btn');
        if (existingBtn) existingBtn.remove();

        if (DashboardState.isConnected) {
            var logoutBtn = document.createElement('button');
            logoutBtn.id = 'dashboard-logout-btn';
            logoutBtn.className = 'btn btn-ghost btn-sm logout-btn';
            logoutBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16,17 21,12 16,7"/><line x1="21" y1="12" x2="9" y2="12"/></svg> Logout';
            logoutBtn.onclick = disconnectWallet;
            userCard.appendChild(logoutBtn);
        }
    }

    function updateUserInfo() {
        var usernameEl = document.getElementById('dashboard-username');
        var addressEl = document.getElementById('dashboard-address');
        var tierEl = document.getElementById('dashboard-tier');
        var avatarEl = document.getElementById('dashboard-avatar');

        // Try to get profile from onboarding
        var profile = null;
        try {
            var saved = localStorage.getItem('snoz_user_profile');
            if (saved) profile = JSON.parse(saved);
        } catch (e) {}

        // Update username
        if (usernameEl) {
            if (profile && profile.username) {
                usernameEl.textContent = profile.username;
            } else if (DashboardState.username) {
                usernameEl.textContent = DashboardState.username;
            } else {
                usernameEl.textContent = 'Creator';
            }
        }

        // Update address
        if (addressEl) {
            var walletIcon = DashboardState.walletType === 'metamask' ? '🦊' : '👻';
            addressEl.textContent = walletIcon + ' ' + formatAddress(DashboardState.walletAddress);
        }

        // Update avatar
        if (avatarEl && profile && profile.avatar) {
            avatarEl.innerHTML = '<span class="avatar-emoji">' + profile.avatar + '</span>';
            avatarEl.classList.add('has-avatar');
        }

        // Update tier with user type
        if (tierEl) {
            var tierValue = tierEl.querySelector('.tier-value');
            if (tierValue && profile && profile.userType) {
                var typeNames = { creator: 'Creator', supporter: 'Supporter', corporate: 'Corporate', vc: 'VC' };
                var typeColors = { creator: 'creator', supporter: 'supporter', corporate: 'corporate', vc: 'vc' };
                tierValue.textContent = typeNames[profile.userType] || 'Active';
                tierValue.className = 'tier-value ' + (typeColors[profile.userType] || 'bronze');
            } else if (tierValue) {
                tierValue.textContent = 'Active';
                tierValue.className = 'tier-value bronze';
            }
        }

        // Update balance display
        var snozBalanceEl = document.getElementById('stat-snoz-balance');
        if (snozBalanceEl && DashboardState.walletBalance) {
            snozBalanceEl.textContent = DashboardState.walletBalance;
        }

        // Add user type badge and country
        addUserTypeBadge(profile);
    }

    function addUserTypeBadge(profile) {
        var userCard = document.querySelector('.dashboard-user-card');
        if (!userCard) return;

        // Remove existing badge
        var existingBadge = document.getElementById('user-type-badge');
        if (existingBadge) existingBadge.remove();

        if (profile && profile.userType) {
            var typeIcons = { creator: '🎨', supporter: '💝', corporate: '🏢', vc: '💼' };
            var typeNames = { creator: 'Creator', supporter: 'Supporter', corporate: 'Corporate', vc: 'Investor' };
            
            var badge = document.createElement('div');
            badge.id = 'user-type-badge';
            badge.className = 'user-type-badge badge-' + profile.userType;
            badge.innerHTML = '<span class="badge-icon">' + (typeIcons[profile.userType] || '') + '</span>' +
                '<span class="badge-text">' + (typeNames[profile.userType] || '') + '</span>';
            
            var userInfo = userCard.querySelector('.user-info');
            if (userInfo) {
                userInfo.appendChild(badge);
            }

            // Add country if available
            if (profile.country) {
                var countryEl = document.createElement('span');
                countryEl.className = 'user-country';
                countryEl.textContent = '📍 ' + profile.country;
                var userDetails = userCard.querySelector('.user-details');
                if (userDetails && !userDetails.querySelector('.user-country')) {
                    userDetails.appendChild(countryEl);
                }
            }
        }
    }

    function updateStats() {
        var earningsEl = document.getElementById('stat-total-earnings');
        var tipsEl = document.getElementById('stat-tips-received');
        var contentEl = document.getElementById('stat-content-count');
        if (earningsEl) earningsEl.textContent = '0 STX';
        if (tipsEl) tipsEl.textContent = '0';
        if (contentEl) contentEl.textContent = '0';
    }

    function formatAddress(address) {
        if (!address) return '';
        if (address.length <= 12) return address;
        return address.substring(0, 6) + '...' + address.substring(address.length - 4);
    }

    function showNotification(message, type) {
        type = type || 'success';
        var existing = document.querySelector('.dashboard-notification');
        if (existing) existing.remove();

        var notification = document.createElement('div');
        notification.className = 'dashboard-notification notification-' + type;
        notification.textContent = message;
        document.body.appendChild(notification);

        setTimeout(function() { notification.classList.add('show'); }, 10);
        setTimeout(function() {
            notification.classList.remove('show');
            setTimeout(function() { notification.remove(); }, 300);
        }, 3000);
    }

    function initEventListeners() {
        var connectBtn = document.getElementById('dashboard-connect-main');
        if (connectBtn) connectBtn.onclick = showWalletModal;

        var triggerBtns = document.querySelectorAll('.wallet-connect-trigger');
        for (var i = 0; i < triggerBtns.length; i++) {
            triggerBtns[i].onclick = function(e) {
                e.preventDefault();
                showWalletModal();
            };
        }
    }

    function injectStyles() {
        var style = document.createElement('style');
        style.textContent = '.wallet-modal-overlay{position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.8);display:flex;align-items:center;justify-content:center;z-index:10000;backdrop-filter:blur(4px)}.wallet-modal{background:linear-gradient(135deg,#1a1a2e 0%,#16213e 100%);border-radius:20px;padding:30px;width:90%;max-width:400px;box-shadow:0 20px 60px rgba(0,0,0,0.5);border:1px solid rgba(255,255,255,0.1)}.wallet-modal-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:20px}.wallet-modal-header h3{color:#fff;font-size:24px;margin:0}.wallet-modal-close{background:none;border:none;color:#888;font-size:28px;cursor:pointer;padding:0;line-height:1}.wallet-modal-close:hover{color:#fff}.wallet-modal-subtitle{color:#888;margin-bottom:25px;font-size:14px}.wallet-options{display:flex;flex-direction:column;gap:12px}.wallet-option{display:flex;align-items:center;gap:15px;padding:16px 20px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:12px;cursor:pointer;transition:all 0.3s ease}.wallet-option:hover{background:rgba(255,255,255,0.1);border-color:rgba(255,255,255,0.2);transform:translateX(5px)}.wallet-icon{font-size:28px}.wallet-name{color:#fff;font-size:16px;font-weight:500;flex:1}.wallet-status{font-size:12px}.username-form{display:flex;flex-direction:column;gap:15px}#username-input{padding:14px 18px;border-radius:10px;border:1px solid rgba(255,255,255,0.2);background:rgba(0,0,0,0.3);color:#fff;font-size:16px;outline:none}#username-input:focus{border-color:#8b5cf6}.username-hint{color:#666;font-size:12px;margin:0}.btn-primary{padding:14px 28px;background:linear-gradient(135deg,#8b5cf6 0%,#06b6d4 100%);border:none;border-radius:10px;color:#fff;font-size:16px;font-weight:600;cursor:pointer;transition:all 0.3s ease}.btn-primary:hover{transform:translateY(-2px);box-shadow:0 10px 30px rgba(139,92,246,0.3)}.dashboard-notification{position:fixed;bottom:30px;right:30px;padding:15px 25px;border-radius:10px;color:#fff;font-weight:500;z-index:10001;transform:translateX(120%);transition:transform 0.3s ease}.dashboard-notification.show{transform:translateX(0)}.notification-success{background:linear-gradient(135deg,#059669 0%,#10b981 100%)}.notification-error{background:linear-gradient(135deg,#dc2626 0%,#ef4444 100%)}.notification-info{background:linear-gradient(135deg,#2563eb 0%,#3b82f6 100%)}.logout-btn{position:absolute;top:15px;right:15px;display:flex;align-items:center;gap:6px;padding:8px 14px;background:rgba(239,68,68,0.1);border:1px solid rgba(239,68,68,0.3);color:#ef4444;border-radius:8px;font-size:13px;cursor:pointer;transition:all 0.3s ease}.logout-btn:hover{background:rgba(239,68,68,0.2);border-color:rgba(239,68,68,0.5)}.dashboard-user-card{position:relative}' +
            '.user-type-badge{display:inline-flex;align-items:center;gap:6px;padding:6px 12px;border-radius:20px;font-size:12px;font-weight:600;margin-top:10px}' +
            '.badge-creator{background:linear-gradient(135deg,rgba(139,92,246,0.2),rgba(6,182,212,0.2));color:#8b5cf6;border:1px solid rgba(139,92,246,0.3)}' +
            '.badge-supporter{background:linear-gradient(135deg,rgba(236,72,153,0.2),rgba(244,114,182,0.2));color:#ec4899;border:1px solid rgba(236,72,153,0.3)}' +
            '.badge-corporate{background:linear-gradient(135deg,rgba(59,130,246,0.2),rgba(96,165,250,0.2));color:#3b82f6;border:1px solid rgba(59,130,246,0.3)}' +
            '.badge-vc{background:linear-gradient(135deg,rgba(245,158,11,0.2),rgba(251,191,36,0.2));color:#f59e0b;border:1px solid rgba(245,158,11,0.3)}' +
            '.badge-icon{font-size:14px}.badge-text{text-transform:uppercase;letter-spacing:0.5px}' +
            '.user-country{display:block;color:#888;font-size:12px;margin-top:5px}' +
            '.avatar-emoji{font-size:32px;line-height:1}' +
            '.has-avatar{background:rgba(139,92,246,0.1)!important;border:2px solid rgba(139,92,246,0.3)!important}' +
            '.tier-value.creator{background:linear-gradient(135deg,#8b5cf6,#06b6d4);color:#fff}' +
            '.tier-value.supporter{background:linear-gradient(135deg,#ec4899,#f472b6);color:#fff}' +
            '.tier-value.corporate{background:linear-gradient(135deg,#3b82f6,#60a5fa);color:#fff}' +
            '.tier-value.vc{background:linear-gradient(135deg,#f59e0b,#fbbf24);color:#000}';
        document.head.appendChild(style);
    }

    function init() {
        injectStyles();
        var wasConnected = checkWalletConnection();
        if (!wasConnected) updateDashboardUI();
        initEventListeners();
        console.log('Dashboard initialized');
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    window.DashboardState = DashboardState;
    window.showWalletModal = showWalletModal;
    window.disconnectWallet = disconnectWallet;

})();
