/**
 * SNOZCOIN Onboarding System
 * Handles first-time user registration and profile setup
 * User types: Creator, Supporter, Corporate, VC
 */

(function() {
    'use strict';

    // ============================================================
    // CONFIGURATION
    // ============================================================
    var CONFIG = {
        storageKey: 'snoz_user_profile',
        walletStorageKey: 'snoz_dashboard_state',
        avatars: [
            { id: 'cat', emoji: '🐱', name: 'Cat' },
            { id: 'dog', emoji: '🐶', name: 'Dog' },
            { id: 'fox', emoji: '🦊', name: 'Fox' },
            { id: 'lion', emoji: '🦁', name: 'Lion' },
            { id: 'bear', emoji: '🐻', name: 'Bear' },
            { id: 'panda', emoji: '🐼', name: 'Panda' },
            { id: 'unicorn', emoji: '🦄', name: 'Unicorn' },
            { id: 'dragon', emoji: '🐉', name: 'Dragon' },
            { id: 'alien', emoji: '👽', name: 'Alien' },
            { id: 'robot', emoji: '🤖', name: 'Robot' },
            { id: 'ghost', emoji: '👻', name: 'Ghost' },
            { id: 'rocket', emoji: '🚀', name: 'Rocket' }
        ],
        userTypes: [
            { id: 'creator', icon: '🎨', name: 'Creator', desc: 'Share content, receive tips and build your audience' },
            { id: 'supporter', icon: '💝', name: 'Supporter', desc: 'Support your favorite creators with tips and subscriptions' },
            { id: 'corporate', icon: '🏢', name: 'Corporate', desc: 'Partner with creators for brand collaborations' },
            { id: 'vc', icon: '💼', name: 'VC / Investor', desc: 'Invest in the creator economy ecosystem' }
        ],
        countries: [
            'United States', 'United Kingdom', 'Canada', 'Australia', 'Germany', 'France', 'Japan', 
            'South Korea', 'Singapore', 'India', 'Brazil', 'Mexico', 'Netherlands', 'Sweden', 
            'Switzerland', 'Spain', 'Italy', 'Portugal', 'Ireland', 'New Zealand', 'Nigeria',
            'South Africa', 'Kenya', 'Ghana', 'UAE', 'Saudi Arabia', 'Israel', 'Poland', 
            'Czech Republic', 'Austria', 'Belgium', 'Denmark', 'Norway', 'Finland', 'Argentina',
            'Chile', 'Colombia', 'Peru', 'Philippines', 'Indonesia', 'Malaysia', 'Thailand',
            'Vietnam', 'Taiwan', 'Hong Kong', 'Other'
        ]
    };

    // ============================================================
    // WALLET PROVIDERS
    // ============================================================
    var WALLET_PROVIDERS = {
        metamask: {
            name: 'MetaMask',
            icon: '🦊',
            detect: function() {
                return typeof window.ethereum !== 'undefined' && window.ethereum.isMetaMask;
            },
            connect: function() {
                return window.ethereum.request({ method: 'eth_requestAccounts' })
                    .then(function(accounts) { return accounts[0]; });
            },
            getAddress: function() {
                return window.ethereum && window.ethereum.selectedAddress ? window.ethereum.selectedAddress : null;
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
                    .then(function(resp) { return resp.publicKey.toString(); });
            },
            getAddress: function() {
                return window.solana && window.solana.publicKey ? window.solana.publicKey.toString() : null;
            }
        }
    };

    // ============================================================
    // ONBOARDING STATE
    // ============================================================
    var OnboardingState = {
        step: 1,
        walletAddress: null,
        walletType: null,
        profile: {
            username: '',
            country: '',
            avatar: '',
            userType: '',
            profileImage: null,
            createdAt: null
        }
    };

    // ============================================================
    // STORAGE HELPERS
    // ============================================================
    function saveProfile(profile) {
        try {
            localStorage.setItem(CONFIG.storageKey, JSON.stringify(profile));
        } catch (e) { console.error('Profile save failed:', e); }
    }

    function loadProfile() {
        try {
            var saved = localStorage.getItem(CONFIG.storageKey);
            return saved ? JSON.parse(saved) : null;
        } catch (e) { return null; }
    }

    function isUserRegistered() {
        var profile = loadProfile();
        return profile && profile.username && profile.userType && profile.walletAddress;
    }

    function saveWalletState(address, type) {
        try {
            localStorage.setItem(CONFIG.walletStorageKey, JSON.stringify({
                walletAddress: address,
                walletType: type
            }));
        } catch (e) { console.error('Wallet save failed:', e); }
    }

    // ============================================================
    // ONBOARDING MODAL
    // ============================================================
    function showOnboardingModal() {
        var existing = document.getElementById('onboarding-modal');
        if (existing) existing.remove();

        var modal = document.createElement('div');
        modal.id = 'onboarding-modal';
        modal.className = 'onboarding-overlay';
        
        // Start with wallet connect step
        OnboardingState.step = 1;
        modal.innerHTML = getWalletConnectStep();
        
        document.body.appendChild(modal);
        initWalletButtons();
        
        // Close on overlay click (but not during critical steps)
        modal.addEventListener('click', function(e) {
            if (e.target === modal && OnboardingState.step === 1) {
                modal.remove();
            }
        });
    }

    // ============================================================
    // STEP 1: WALLET CONNECT
    // ============================================================
    function getWalletConnectStep() {
        var metamaskAvailable = WALLET_PROVIDERS.metamask.detect();
        var phantomAvailable = WALLET_PROVIDERS.phantom.detect();
        
        return '<div class="onboarding-modal">' +
            '<div class="onboarding-header">' +
            '<div class="step-indicator"><span class="step-dot active"></span><span class="step-dot"></span><span class="step-dot"></span></div>' +
            '<h2>Welcome to SNOZCOIN</h2>' +
            '<p>Connect your wallet to get started</p>' +
            '</div>' +
            '<div class="onboarding-body">' +
            '<div class="wallet-options">' +
            '<button class="wallet-option-btn" id="connect-metamask" ' + (metamaskAvailable ? '' : 'data-install="true"') + '>' +
            '<span class="wallet-icon">🦊</span>' +
            '<div class="wallet-info">' +
            '<span class="wallet-name">MetaMask</span>' +
            '<span class="wallet-status ' + (metamaskAvailable ? 'available' : 'not-installed') + '">' + 
            (metamaskAvailable ? 'Available' : 'Install') + '</span>' +
            '</div>' +
            '</button>' +
            '<button class="wallet-option-btn" id="connect-phantom" ' + (phantomAvailable ? '' : 'data-install="true"') + '>' +
            '<span class="wallet-icon">👻</span>' +
            '<div class="wallet-info">' +
            '<span class="wallet-name">Phantom</span>' +
            '<span class="wallet-status ' + (phantomAvailable ? 'available' : 'not-installed') + '">' + 
            (phantomAvailable ? 'Available' : 'Install') + '</span>' +
            '</div>' +
            '</button>' +
            '</div>' +
            '<p class="wallet-note">🔒 Non-custodial. We never access your private keys.</p>' +
            '</div>' +
            '<button class="onboarding-close" id="close-onboarding">&times;</button>' +
            '</div>';
    }

    function initWalletButtons() {
        var metamaskBtn = document.getElementById('connect-metamask');
        var phantomBtn = document.getElementById('connect-phantom');
        var closeBtn = document.getElementById('close-onboarding');

        if (closeBtn) {
            closeBtn.onclick = function() {
                document.getElementById('onboarding-modal').remove();
            };
        }

        if (metamaskBtn) {
            metamaskBtn.onclick = function() {
                if (metamaskBtn.dataset.install === 'true') {
                    window.open('https://metamask.io/download/', '_blank');
                } else {
                    connectWallet('metamask');
                }
            };
        }

        if (phantomBtn) {
            phantomBtn.onclick = function() {
                if (phantomBtn.dataset.install === 'true') {
                    window.open('https://phantom.app/', '_blank');
                } else {
                    connectWallet('phantom');
                }
            };
        }
    }

    function connectWallet(walletType) {
        var provider = WALLET_PROVIDERS[walletType];
        showNotification('Connecting to ' + provider.name + '...', 'info');

        provider.connect()
            .then(function(address) {
                OnboardingState.walletAddress = address;
                OnboardingState.walletType = walletType;
                OnboardingState.profile.walletAddress = address;
                
                saveWalletState(address, walletType);
                
                // Check if user already has a profile
                var existingProfile = loadProfile();
                if (existingProfile && existingProfile.walletAddress === address && existingProfile.userType) {
                    // User already registered, redirect to dashboard
                    showNotification('Welcome back, ' + existingProfile.username + '!', 'success');
                    setTimeout(function() {
                        window.location.href = '/dashboard.html';
                    }, 1000);
                } else {
                    // New user, continue onboarding
                    showProfileSetupStep();
                }
            })
            .catch(function(err) {
                console.error('Wallet connection failed:', err);
                showNotification('Connection failed: ' + (err.message || 'User rejected'), 'error');
            });
    }

    // ============================================================
    // STEP 2: PROFILE SETUP
    // ============================================================
    function showProfileSetupStep() {
        OnboardingState.step = 2;
        var modal = document.getElementById('onboarding-modal');
        if (!modal) return;

        var countriesOptions = CONFIG.countries.map(function(c) {
            return '<option value="' + c + '">' + c + '</option>';
        }).join('');

        var avatarOptions = CONFIG.avatars.map(function(a) {
            return '<button class="avatar-btn" data-avatar="' + a.id + '" data-emoji="' + a.emoji + '" title="' + a.name + '">' + a.emoji + '</button>';
        }).join('');

        modal.innerHTML = '<div class="onboarding-modal onboarding-modal-wide">' +
            '<div class="onboarding-header">' +
            '<div class="step-indicator"><span class="step-dot completed">✓</span><span class="step-dot active"></span><span class="step-dot"></span></div>' +
            '<h2>Create Your Profile</h2>' +
            '<p>Tell us about yourself</p>' +
            '</div>' +
            '<div class="onboarding-body">' +
            '<div class="profile-form">' +
            // Username
            '<div class="form-group">' +
            '<label for="profile-username">Username <span class="required">*</span></label>' +
            '<input type="text" id="profile-username" placeholder="Choose a unique username" maxlength="20" />' +
            '<span class="form-hint">3-20 characters, letters, numbers, underscores</span>' +
            '</div>' +
            // Country
            '<div class="form-group">' +
            '<label for="profile-country">Country <span class="required">*</span></label>' +
            '<select id="profile-country">' +
            '<option value="">Select your country</option>' +
            countriesOptions +
            '</select>' +
            '</div>' +
            // Avatar
            '<div class="form-group">' +
            '<label>Choose Avatar <span class="required">*</span></label>' +
            '<div class="avatar-grid">' + avatarOptions + '</div>' +
            '<input type="hidden" id="selected-avatar" value="" />' +
            '</div>' +
            // Profile Image Upload (optional)
            '<div class="form-group">' +
            '<label>Profile Image <span class="optional">(optional)</span></label>' +
            '<div class="image-upload-area" id="image-upload-area">' +
            '<div class="upload-placeholder" id="upload-placeholder">' +
            '<span class="upload-icon">📷</span>' +
            '<span>Click or drag to upload</span>' +
            '</div>' +
            '<img id="profile-image-preview" class="image-preview hidden" />' +
            '<input type="file" id="profile-image-input" accept="image/*" class="hidden" />' +
            '</div>' +
            '</div>' +
            '</div>' +
            '</div>' +
            '<div class="onboarding-footer">' +
            '<button class="btn-secondary" id="back-to-wallet">← Back</button>' +
            '<button class="btn-primary" id="continue-to-type">Continue →</button>' +
            '</div>' +
            '</div>';

        initProfileSetupListeners();
    }

    function initProfileSetupListeners() {
        var usernameInput = document.getElementById('profile-username');
        var countrySelect = document.getElementById('profile-country');
        var avatarBtns = document.querySelectorAll('.avatar-btn');
        var selectedAvatarInput = document.getElementById('selected-avatar');
        var imageUploadArea = document.getElementById('image-upload-area');
        var imageInput = document.getElementById('profile-image-input');
        var imagePreview = document.getElementById('profile-image-preview');
        var uploadPlaceholder = document.getElementById('upload-placeholder');
        var backBtn = document.getElementById('back-to-wallet');
        var continueBtn = document.getElementById('continue-to-type');

        // Avatar selection
        for (var i = 0; i < avatarBtns.length; i++) {
            avatarBtns[i].onclick = function() {
                // Remove selected from all
                for (var j = 0; j < avatarBtns.length; j++) {
                    avatarBtns[j].classList.remove('selected');
                }
                this.classList.add('selected');
                selectedAvatarInput.value = this.dataset.avatar;
                OnboardingState.profile.avatar = this.dataset.emoji;
            };
        }

        // Image upload
        imageUploadArea.onclick = function() {
            imageInput.click();
        };

        imageInput.onchange = function(e) {
            var file = e.target.files[0];
            if (file) {
                var reader = new FileReader();
                reader.onload = function(ev) {
                    imagePreview.src = ev.target.result;
                    imagePreview.classList.remove('hidden');
                    uploadPlaceholder.classList.add('hidden');
                    OnboardingState.profile.profileImage = ev.target.result;
                };
                reader.readAsDataURL(file);
            }
        };

        // Drag and drop
        imageUploadArea.ondragover = function(e) {
            e.preventDefault();
            imageUploadArea.classList.add('dragover');
        };
        imageUploadArea.ondragleave = function() {
            imageUploadArea.classList.remove('dragover');
        };
        imageUploadArea.ondrop = function(e) {
            e.preventDefault();
            imageUploadArea.classList.remove('dragover');
            var file = e.dataTransfer.files[0];
            if (file && file.type.startsWith('image/')) {
                var reader = new FileReader();
                reader.onload = function(ev) {
                    imagePreview.src = ev.target.result;
                    imagePreview.classList.remove('hidden');
                    uploadPlaceholder.classList.add('hidden');
                    OnboardingState.profile.profileImage = ev.target.result;
                };
                reader.readAsDataURL(file);
            }
        };

        // Back button
        backBtn.onclick = function() {
            var modal = document.getElementById('onboarding-modal');
            modal.innerHTML = getWalletConnectStep();
            initWalletButtons();
        };

        // Continue button
        continueBtn.onclick = function() {
            var username = usernameInput.value.trim();
            var country = countrySelect.value;
            var avatar = selectedAvatarInput.value;

            // Validation
            if (!username || !/^[a-zA-Z0-9_]{3,20}$/.test(username)) {
                showNotification('Please enter a valid username (3-20 chars)', 'error');
                usernameInput.focus();
                return;
            }
            if (!country) {
                showNotification('Please select your country', 'error');
                countrySelect.focus();
                return;
            }
            if (!avatar) {
                showNotification('Please choose an avatar', 'error');
                return;
            }

            OnboardingState.profile.username = username;
            OnboardingState.profile.country = country;

            showUserTypeStep();
        };
    }

    // ============================================================
    // STEP 3: USER TYPE SELECTION
    // ============================================================
    function showUserTypeStep() {
        OnboardingState.step = 3;
        var modal = document.getElementById('onboarding-modal');
        if (!modal) return;

        var typeOptions = CONFIG.userTypes.map(function(t) {
            return '<button class="user-type-btn" data-type="' + t.id + '">' +
                '<span class="type-icon">' + t.icon + '</span>' +
                '<div class="type-info">' +
                '<span class="type-name">' + t.name + '</span>' +
                '<span class="type-desc">' + t.desc + '</span>' +
                '</div>' +
                '</button>';
        }).join('');

        modal.innerHTML = '<div class="onboarding-modal onboarding-modal-wide">' +
            '<div class="onboarding-header">' +
            '<div class="step-indicator"><span class="step-dot completed">✓</span><span class="step-dot completed">✓</span><span class="step-dot active"></span></div>' +
            '<h2>How will you use SNOZCOIN?</h2>' +
            '<p>Select your primary role</p>' +
            '</div>' +
            '<div class="onboarding-body">' +
            '<div class="user-type-grid">' + typeOptions + '</div>' +
            '</div>' +
            '<div class="onboarding-footer">' +
            '<button class="btn-secondary" id="back-to-profile">← Back</button>' +
            '<button class="btn-primary" id="complete-onboarding" disabled>Complete Setup</button>' +
            '</div>' +
            '</div>';

        initUserTypeListeners();
    }

    function initUserTypeListeners() {
        var typeBtns = document.querySelectorAll('.user-type-btn');
        var completeBtn = document.getElementById('complete-onboarding');
        var backBtn = document.getElementById('back-to-profile');

        // User type selection
        for (var i = 0; i < typeBtns.length; i++) {
            typeBtns[i].onclick = function() {
                for (var j = 0; j < typeBtns.length; j++) {
                    typeBtns[j].classList.remove('selected');
                }
                this.classList.add('selected');
                OnboardingState.profile.userType = this.dataset.type;
                completeBtn.disabled = false;
            };
        }

        // Back button
        backBtn.onclick = function() {
            showProfileSetupStep();
        };

        // Complete button
        completeBtn.onclick = function() {
            if (!OnboardingState.profile.userType) {
                showNotification('Please select your user type', 'error');
                return;
            }

            completeOnboarding();
        };
    }

    // ============================================================
    // COMPLETE ONBOARDING
    // ============================================================
    function completeOnboarding() {
        OnboardingState.profile.createdAt = new Date().toISOString();
        
        // Save profile
        saveProfile(OnboardingState.profile);

        // Show success
        var modal = document.getElementById('onboarding-modal');
        modal.innerHTML = '<div class="onboarding-modal">' +
            '<div class="onboarding-success">' +
            '<div class="success-icon">🎉</div>' +
            '<h2>Welcome to SNOZCOIN!</h2>' +
            '<p>Your profile has been created successfully.</p>' +
            '<div class="profile-summary">' +
            '<div class="summary-avatar">' + OnboardingState.profile.avatar + '</div>' +
            '<div class="summary-info">' +
            '<span class="summary-username">@' + OnboardingState.profile.username + '</span>' +
            '<span class="summary-type">' + getTypeName(OnboardingState.profile.userType) + '</span>' +
            '</div>' +
            '</div>' +
            '<button class="btn-primary btn-lg" id="go-to-dashboard">Go to Dashboard →</button>' +
            '</div>' +
            '</div>';

        document.getElementById('go-to-dashboard').onclick = function() {
            window.location.href = '/dashboard.html';
        };

        showNotification('Account created successfully!', 'success');
    }

    function getTypeName(typeId) {
        for (var i = 0; i < CONFIG.userTypes.length; i++) {
            if (CONFIG.userTypes[i].id === typeId) {
                return CONFIG.userTypes[i].name;
            }
        }
        return typeId;
    }

    // ============================================================
    // NOTIFICATION
    // ============================================================
    function showNotification(message, type) {
        type = type || 'success';
        var existing = document.querySelector('.onboarding-notification');
        if (existing) existing.remove();

        var notification = document.createElement('div');
        notification.className = 'onboarding-notification notification-' + type;
        notification.textContent = message;
        document.body.appendChild(notification);

        setTimeout(function() { notification.classList.add('show'); }, 10);
        setTimeout(function() {
            notification.classList.remove('show');
            setTimeout(function() { notification.remove(); }, 300);
        }, 3000);
    }

    // ============================================================
    // INJECT STYLES
    // ============================================================
    function injectStyles() {
        var style = document.createElement('style');
        style.id = 'onboarding-styles';
        style.textContent = 
            '.onboarding-overlay{position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.85);display:flex;align-items:center;justify-content:center;z-index:10000;backdrop-filter:blur(8px);padding:20px;overflow-y:auto}' +
            '.onboarding-modal{background:linear-gradient(135deg,#1a1a2e 0%,#16213e 100%);border-radius:24px;padding:40px;width:100%;max-width:420px;box-shadow:0 25px 80px rgba(0,0,0,0.6);border:1px solid rgba(255,255,255,0.1);position:relative;animation:modalSlideIn 0.3s ease}' +
            '.onboarding-modal-wide{max-width:520px}' +
            '@keyframes modalSlideIn{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}' +
            '.onboarding-close{position:absolute;top:15px;right:15px;background:none;border:none;color:#666;font-size:28px;cursor:pointer;padding:5px;line-height:1;transition:color 0.2s}.onboarding-close:hover{color:#fff}' +
            '.onboarding-header{text-align:center;margin-bottom:30px}' +
            '.onboarding-header h2{color:#fff;font-size:26px;margin:15px 0 10px;font-weight:700}' +
            '.onboarding-header p{color:#888;font-size:15px;margin:0}' +
            '.step-indicator{display:flex;justify-content:center;gap:10px;margin-bottom:10px}' +
            '.step-dot{width:12px;height:12px;border-radius:50%;background:rgba(255,255,255,0.2);transition:all 0.3s}' +
            '.step-dot.active{background:linear-gradient(135deg,#8b5cf6 0%,#06b6d4 100%);transform:scale(1.2)}' +
            '.step-dot.completed{background:#10b981;font-size:8px;display:flex;align-items:center;justify-content:center;color:#fff}' +
            '.wallet-options{display:flex;flex-direction:column;gap:12px}' +
            '.wallet-option-btn{display:flex;align-items:center;gap:15px;padding:18px 22px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:14px;cursor:pointer;transition:all 0.3s;width:100%}' +
            '.wallet-option-btn:hover{background:rgba(255,255,255,0.1);border-color:rgba(255,255,255,0.2);transform:translateX(5px)}' +
            '.wallet-icon{font-size:32px}' +
            '.wallet-info{display:flex;flex-direction:column;align-items:flex-start;gap:2px}' +
            '.wallet-name{color:#fff;font-size:17px;font-weight:600}' +
            '.wallet-status{font-size:12px;padding:2px 8px;border-radius:10px}' +
            '.wallet-status.available{background:rgba(16,185,129,0.2);color:#10b981}' +
            '.wallet-status.not-installed{background:rgba(239,68,68,0.2);color:#ef4444}' +
            '.wallet-note{text-align:center;color:#666;font-size:13px;margin-top:20px}' +
            '.profile-form{display:flex;flex-direction:column;gap:20px}' +
            '.form-group{display:flex;flex-direction:column;gap:8px}' +
            '.form-group label{color:#fff;font-size:14px;font-weight:500}' +
            '.form-group .required{color:#ef4444}' +
            '.form-group .optional{color:#666;font-weight:400}' +
            '.form-group input,.form-group select{padding:14px 16px;border-radius:12px;border:1px solid rgba(255,255,255,0.15);background:rgba(0,0,0,0.3);color:#fff;font-size:15px;outline:none;transition:border-color 0.3s}' +
            '.form-group input:focus,.form-group select:focus{border-color:#8b5cf6}' +
            '.form-group select{cursor:pointer}' +
            '.form-group select option{background:#1a1a2e;color:#fff}' +
            '.form-hint{color:#666;font-size:12px}' +
            '.avatar-grid{display:grid;grid-template-columns:repeat(6,1fr);gap:8px}' +
            '.avatar-btn{width:48px;height:48px;border-radius:12px;border:2px solid rgba(255,255,255,0.1);background:rgba(255,255,255,0.05);font-size:24px;cursor:pointer;transition:all 0.2s;display:flex;align-items:center;justify-content:center}' +
            '.avatar-btn:hover{border-color:rgba(255,255,255,0.3);transform:scale(1.1)}' +
            '.avatar-btn.selected{border-color:#8b5cf6;background:rgba(139,92,246,0.2);transform:scale(1.15)}' +
            '.image-upload-area{border:2px dashed rgba(255,255,255,0.2);border-radius:12px;padding:30px;text-align:center;cursor:pointer;transition:all 0.3s;position:relative;overflow:hidden}' +
            '.image-upload-area:hover,.image-upload-area.dragover{border-color:#8b5cf6;background:rgba(139,92,246,0.1)}' +
            '.upload-placeholder{display:flex;flex-direction:column;align-items:center;gap:8px;color:#666}' +
            '.upload-placeholder.hidden{display:none}' +
            '.upload-icon{font-size:32px}' +
            '.image-preview{width:100%;max-height:150px;object-fit:cover;border-radius:8px}' +
            '.image-preview.hidden{display:none}' +
            '.user-type-grid{display:grid;gap:12px}' +
            '.user-type-btn{display:flex;align-items:center;gap:16px;padding:20px;background:rgba(255,255,255,0.05);border:2px solid rgba(255,255,255,0.1);border-radius:14px;cursor:pointer;transition:all 0.3s;text-align:left;width:100%}' +
            '.user-type-btn:hover{background:rgba(255,255,255,0.08);border-color:rgba(255,255,255,0.2)}' +
            '.user-type-btn.selected{border-color:#8b5cf6;background:rgba(139,92,246,0.15)}' +
            '.type-icon{font-size:36px;width:50px;height:50px;display:flex;align-items:center;justify-content:center;background:rgba(255,255,255,0.05);border-radius:12px}' +
            '.type-info{display:flex;flex-direction:column;gap:4px}' +
            '.type-name{color:#fff;font-size:16px;font-weight:600}' +
            '.type-desc{color:#888;font-size:13px}' +
            '.onboarding-footer{display:flex;justify-content:space-between;margin-top:30px;gap:15px}' +
            '.btn-secondary{padding:14px 24px;background:rgba(255,255,255,0.1);border:1px solid rgba(255,255,255,0.2);border-radius:12px;color:#fff;font-size:15px;font-weight:500;cursor:pointer;transition:all 0.3s}' +
            '.btn-secondary:hover{background:rgba(255,255,255,0.15)}' +
            '.btn-primary{padding:14px 24px;background:linear-gradient(135deg,#8b5cf6 0%,#06b6d4 100%);border:none;border-radius:12px;color:#fff;font-size:15px;font-weight:600;cursor:pointer;transition:all 0.3s;flex:1}' +
            '.btn-primary:hover:not(:disabled){transform:translateY(-2px);box-shadow:0 10px 30px rgba(139,92,246,0.3)}' +
            '.btn-primary:disabled{opacity:0.5;cursor:not-allowed}' +
            '.btn-lg{padding:18px 32px;font-size:17px}' +
            '.onboarding-success{text-align:center;padding:20px 0}' +
            '.success-icon{font-size:64px;margin-bottom:20px}' +
            '.profile-summary{display:flex;align-items:center;justify-content:center;gap:15px;margin:25px 0;padding:20px;background:rgba(255,255,255,0.05);border-radius:16px}' +
            '.summary-avatar{font-size:48px}' +
            '.summary-info{display:flex;flex-direction:column;align-items:flex-start;gap:4px}' +
            '.summary-username{color:#fff;font-size:18px;font-weight:600}' +
            '.summary-type{color:#8b5cf6;font-size:14px}' +
            '.onboarding-notification{position:fixed;bottom:30px;right:30px;padding:16px 26px;border-radius:12px;color:#fff;font-weight:500;z-index:10001;transform:translateX(120%);transition:transform 0.3s ease;box-shadow:0 10px 40px rgba(0,0,0,0.3)}' +
            '.onboarding-notification.show{transform:translateX(0)}' +
            '.notification-success{background:linear-gradient(135deg,#059669 0%,#10b981 100%)}' +
            '.notification-error{background:linear-gradient(135deg,#dc2626 0%,#ef4444 100%)}' +
            '.notification-info{background:linear-gradient(135deg,#2563eb 0%,#3b82f6 100%)}' +
            '.hidden{display:none!important}';
        document.head.appendChild(style);
    }

    // ============================================================
    // INITIALIZE
    // ============================================================
    function init() {
        injectStyles();

        // Bind "Get Started" buttons across the site
        document.addEventListener('click', function(e) {
            var target = e.target.closest('#getting-started-connect-btn, .get-started-btn, [data-action="get-started"]');
            if (target) {
                e.preventDefault();
                e.stopPropagation();
                
                // Check if already registered
                if (isUserRegistered()) {
                    window.location.href = '/dashboard.html';
                } else {
                    showOnboardingModal();
                }
            }
        });

        // Also directly bind to hero button
        var heroBtn = document.getElementById('hero-get-started-btn');
        if (heroBtn) {
            heroBtn.addEventListener('click', function(e) {
                e.preventDefault();
                if (isUserRegistered()) {
                    window.location.href = '/dashboard.html';
                } else {
                    showOnboardingModal();
                }
            });
        }

        console.log('Onboarding system initialized');
    }

    // Expose globally BEFORE init runs
    window.SnozOnboarding = {
        show: showOnboardingModal,
        isRegistered: isUserRegistered,
        getProfile: loadProfile
    };

    // Run on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
