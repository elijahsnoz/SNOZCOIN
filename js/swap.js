/**
 * SNOZCOIN Swap Interface
 * Professional DEX-style swap for stablecoins to STX
 */

// Token data with logos and contract addresses
const TOKENS = {
    STX: {
        symbol: 'STX',
        name: 'Stacks',
        logo: 'https://assets.coingecko.com/coins/images/2069/small/Stacks_logo_full.png',
        decimals: 6,
        address: 'native',
        price: 0 // Will be fetched
    },
    USDT: {
        symbol: 'USDT',
        name: 'Tether USD',
        logo: 'https://assets.coingecko.com/coins/images/325/small/Tether.png',
        decimals: 6,
        address: 'SP3K8BC0PPEVCV7NZ6QSRWPQ2JE9E5B6N3PA0KBR9.token-usdt',
        price: 1.00
    },
    USDC: {
        symbol: 'USDC',
        name: 'USD Coin',
        logo: 'https://assets.coingecko.com/coins/images/6319/small/USD_Coin_icon.png',
        decimals: 6,
        address: 'SP3K8BC0PPEVCV7NZ6QSRWPQ2JE9E5B6N3PA0KBR9.token-usdc',
        price: 1.00
    },
    DAI: {
        symbol: 'DAI',
        name: 'Dai',
        logo: 'https://assets.coingecko.com/coins/images/9956/small/4943.png',
        decimals: 18,
        address: 'SP3K8BC0PPEVCV7NZ6QSRWPQ2JE9E5B6N3PA0KBR9.token-dai',
        price: 1.00
    },
    BUSD: {
        symbol: 'BUSD',
        name: 'Binance USD',
        logo: 'https://assets.coingecko.com/coins/images/9576/small/BUSD.png',
        decimals: 18,
        address: 'SP3K8BC0PPEVCV7NZ6QSRWPQ2JE9E5B6N3PA0KBR9.token-busd',
        price: 1.00
    },
    FRAX: {
        symbol: 'FRAX',
        name: 'Frax',
        logo: 'https://assets.coingecko.com/coins/images/13422/small/FRAX_icon.png',
        decimals: 18,
        address: 'SP3K8BC0PPEVCV7NZ6QSRWPQ2JE9E5B6N3PA0KBR9.token-frax',
        price: 1.00
    },
    sUSD: {
        symbol: 'sUSD',
        name: 'sUSD',
        logo: 'https://assets.coingecko.com/coins/images/5013/small/sUSD.png',
        decimals: 18,
        address: 'SP3K8BC0PPEVCV7NZ6QSRWPQ2JE9E5B6N3PA0KBR9.token-susd',
        price: 1.00
    }
};

// DEX Routes
const DEX_ROUTES = {
    ALEX: {
        name: 'ALEX',
        logo: '🔷',
        fee: 0.003,
        url: 'https://app.alexlab.co/swap'
    },
    Velar: {
        name: 'Velar',
        logo: '🟣',
        fee: 0.003,
        url: 'https://app.velar.co/swap'
    },
    StacksSwap: {
        name: 'StacksSwap',
        logo: '🔶',
        fee: 0.0025,
        url: 'https://stacksswap.org'
    }
};

// State
let state = {
    fromToken: 'USDC',
    toToken: 'STX',
    fromAmount: '',
    toAmount: '',
    slippage: 0.5,
    deadline: 20,
    mevProtection: true,
    walletConnected: false,
    walletAddress: null,
    balances: {},
    isLoading: false,
    settingsOpen: false,
    modalOpen: false,
    selectingFor: 'from', // 'from' or 'to'
    recentTransactions: [],
    bestRoute: null,
    priceImpact: 0
};

// DOM Elements
const elements = {};

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    initializeElements();
    bindEvents();
    fetchPrices();
    loadRecentTransactions();
    updateUI();
    startPriceRefresh();
});

function initializeElements() {
    // Map HTML IDs to element references (HTML uses kebab-case, we convert to camelCase)
    elements.fromAmount = document.getElementById('from-amount');
    elements.toAmount = document.getElementById('to-amount');
    elements.fromTokenBtn = document.getElementById('from-token-btn');
    elements.toTokenBtn = document.getElementById('to-token-btn');
    elements.fromTokenIcon = document.getElementById('from-token-icon');
    elements.toTokenIcon = document.getElementById('to-token-icon');
    elements.fromTokenSymbol = document.getElementById('from-token-symbol');
    elements.toTokenSymbol = document.getElementById('to-token-symbol');
    elements.swapBtn = document.getElementById('swap-btn');
    elements.swapDirection = document.getElementById('swap-direction-btn');
    elements.settingsBtn = document.getElementById('settings-btn');
    elements.settingsPanel = document.getElementById('settings-panel');
    elements.tokenModal = document.getElementById('token-modal');
    elements.closeModal = document.getElementById('token-modal-close');
    elements.tokenSearch = document.getElementById('token-search');
    elements.tokenList = document.getElementById('token-list');
    elements.fromBalance = document.getElementById('from-balance');
    elements.toBalance = document.getElementById('to-balance');
    elements.rateDisplay = document.getElementById('swap-rate');
    elements.priceImpact = document.getElementById('price-impact');
    elements.networkFee = document.getElementById('network-fee');
    elements.minReceived = document.getElementById('min-received');
    elements.routeDisplay = document.getElementById('swap-route');
    elements.transactionList = document.getElementById('recent-txs');
    elements.connectWalletBtn = document.getElementById('swap-connect-btn');
    elements.fromUsd = document.getElementById('from-usd');
    elements.toUsd = document.getElementById('to-usd');
}

function bindEvents() {
    // Amount inputs
    if (elements.fromAmount) {
        elements.fromAmount.addEventListener('input', handleFromAmountChange);
        elements.fromAmount.addEventListener('focus', () => elements.fromAmount.select());
    }

    if (elements.toAmount) {
        elements.toAmount.addEventListener('input', handleToAmountChange);
        elements.toAmount.addEventListener('focus', () => elements.toAmount.select());
    }

    // Token selection
    if (elements.fromTokenBtn) {
        elements.fromTokenBtn.addEventListener('click', () => openTokenModal('from'));
    }

    if (elements.toTokenBtn) {
        elements.toTokenBtn.addEventListener('click', () => openTokenModal('to'));
    }

    // Swap direction
    if (elements.swapDirection) {
        elements.swapDirection.addEventListener('click', swapTokens);
    }

    // Swap button
    if (elements.swapBtn) {
        elements.swapBtn.addEventListener('click', handleSwap);
    }

    // Settings
    if (elements.settingsBtn) {
        elements.settingsBtn.addEventListener('click', toggleSettings);
    }

    if (elements.closeSettings) {
        elements.closeSettings.addEventListener('click', closeSettings);
    }

    // Slippage buttons
    document.querySelectorAll('.slippage-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            setSlippage(parseFloat(e.target.dataset.value));
            // Update active state
            document.querySelectorAll('.slippage-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
        });
    });

    // Custom slippage
    const customSlippage = document.getElementById('custom-slippage');
    if (customSlippage) {
        customSlippage.addEventListener('input', (e) => {
            const value = parseFloat(e.target.value);
            if (!isNaN(value) && value > 0 && value <= 50) {
                setSlippage(value);
                document.querySelectorAll('.slippage-btn').forEach(b => b.classList.remove('active'));
            }
        });
    }

    // Deadline
    const deadlineInput = document.getElementById('tx-deadline');
    if (deadlineInput) {
        deadlineInput.addEventListener('input', (e) => {
            const value = parseInt(e.target.value);
            if (!isNaN(value) && value > 0) {
                state.deadline = value;
            }
        });
    }

    // Quick amount buttons (25%, 50%, 75%, MAX)
    document.querySelectorAll('.quick-amount-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const percent = parseInt(e.target.dataset.percent);
            handleQuickAmount(percent);
        });
    });

    // Token modal
    if (elements.closeModal) {
        elements.closeModal.addEventListener('click', closeTokenModal);
    }

    if (elements.tokenModal) {
        elements.tokenModal.addEventListener('click', (e) => {
            if (e.target === elements.tokenModal) {
                closeTokenModal();
            }
        });
    }

    if (elements.tokenSearch) {
        elements.tokenSearch.addEventListener('input', filterTokens);
    }

    // Refresh rate
    if (elements.refreshRate) {
        elements.refreshRate.addEventListener('click', fetchPrices);
    }

    // Max buttons
    document.querySelectorAll('.max-btn').forEach(btn => {
        btn.addEventListener('click', handleMaxClick);
    });

    // Half buttons
    document.querySelectorAll('.half-btn').forEach(btn => {
        btn.addEventListener('click', handleHalfClick);
    });

    // Connect wallet
    if (elements.connectWalletBtn) {
        elements.connectWalletBtn.addEventListener('click', connectWallet);
    }

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeSettings();
            closeTokenModal();
        }
    });
}

// Price Fetching
async function fetchPrices() {
    try {
        if (elements.refreshRate) {
            elements.refreshRate.classList.add('rotating');
        }

        // Fetch STX price from CoinGecko
        const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=blockstack&vs_currencies=usd');
        const data = await response.json();
        
        if (data.blockstack && data.blockstack.usd) {
            TOKENS.STX.price = data.blockstack.usd;
        } else {
            // Fallback price
            TOKENS.STX.price = 0.50;
        }

        updateRateDisplay();
        calculateSwap();
    } catch (error) {
        console.error('Error fetching prices:', error);
        // Use fallback price
        TOKENS.STX.price = 0.50;
        updateRateDisplay();
    } finally {
        if (elements.refreshRate) {
            elements.refreshRate.classList.remove('rotating');
        }
    }
}

function startPriceRefresh() {
    // Refresh prices every 30 seconds
    setInterval(fetchPrices, 30000);
}

// Amount Handling
function handleFromAmountChange(e) {
    let value = e.target.value.replace(/[^0-9.]/g, '');
    
    // Only allow one decimal point
    const parts = value.split('.');
    if (parts.length > 2) {
        value = parts[0] + '.' + parts.slice(1).join('');
    }

    state.fromAmount = value;
    elements.fromAmount.value = value;
    calculateSwap();
}

function handleToAmountChange(e) {
    let value = e.target.value.replace(/[^0-9.]/g, '');
    
    const parts = value.split('.');
    if (parts.length > 2) {
        value = parts[0] + '.' + parts.slice(1).join('');
    }

    state.toAmount = value;
    elements.toAmount.value = value;
    calculateReverseSwap();
}

function calculateSwap() {
    if (!state.fromAmount || isNaN(parseFloat(state.fromAmount))) {
        state.toAmount = '';
        updateToAmount();
        updateRouteDisplay();
        return;
    }

    const fromToken = TOKENS[state.fromToken];
    const toToken = TOKENS[state.toToken];
    const fromAmount = parseFloat(state.fromAmount);

    // Calculate value in USD
    const valueInUsd = fromAmount * fromToken.price;

    // Calculate output amount
    let outputAmount;
    if (toToken.symbol === 'STX') {
        outputAmount = valueInUsd / toToken.price;
    } else {
        outputAmount = valueInUsd / toToken.price;
    }

    // Apply fee (0.3%)
    const fee = outputAmount * 0.003;
    outputAmount = outputAmount - fee;

    // Calculate price impact
    state.priceImpact = calculatePriceImpact(fromAmount, fromToken);

    // Apply slippage protection
    const minOutput = outputAmount * (1 - state.slippage / 100);

    state.toAmount = outputAmount.toFixed(6);
    state.bestRoute = determineBestRoute(fromAmount);

    updateToAmount();
    updateRouteDisplay();
    updateSwapButton();
}

function calculateReverseSwap() {
    if (!state.toAmount || isNaN(parseFloat(state.toAmount))) {
        state.fromAmount = '';
        updateFromAmount();
        return;
    }

    const fromToken = TOKENS[state.fromToken];
    const toToken = TOKENS[state.toToken];
    const toAmount = parseFloat(state.toAmount);

    // Calculate value in USD
    const valueInUsd = toAmount * toToken.price;

    // Calculate input amount (reverse calculation with fee)
    let inputAmount = valueInUsd / fromToken.price;
    inputAmount = inputAmount / (1 - 0.003); // Add fee back

    state.fromAmount = inputAmount.toFixed(6);

    updateFromAmount();
    updateRouteDisplay();
    updateSwapButton();
}

function calculatePriceImpact(amount, token) {
    // Simulate price impact based on amount
    // Larger amounts have higher price impact
    const liquidityPool = 1000000; // Simulated liquidity
    const impact = (amount * token.price / liquidityPool) * 100;
    return Math.min(impact, 50); // Cap at 50%
}

function determineBestRoute(amount) {
    // Determine best route based on amount and fees
    const routes = Object.keys(DEX_ROUTES);
    let bestRoute = routes[0];
    let bestOutput = 0;

    routes.forEach(route => {
        const dex = DEX_ROUTES[route];
        const output = amount * (1 - dex.fee);
        if (output > bestOutput) {
            bestOutput = output;
            bestRoute = route;
        }
    });

    return {
        dex: bestRoute,
        ...DEX_ROUTES[bestRoute]
    };
}

// UI Updates
function updateUI() {
    updateTokenButtons();
    updateBalances();
    updateRateDisplay();
    updateSwapButton();
}

function updateTokenButtons() {
    const fromToken = TOKENS[state.fromToken];
    const toToken = TOKENS[state.toToken];

    // Update from token icon and symbol (using separate elements)
    if (elements.fromTokenIcon) {
        elements.fromTokenIcon.src = fromToken.logo;
        elements.fromTokenIcon.alt = fromToken.symbol;
        elements.fromTokenIcon.onerror = function() {
            this.src = `data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="40" fill="%23a855f7"/><text x="50" y="60" text-anchor="middle" fill="white" font-size="30">${fromToken.symbol[0]}</text></svg>`;
        };
    }
    if (elements.fromTokenSymbol) {
        elements.fromTokenSymbol.textContent = fromToken.symbol;
    }

    // Update to token icon and symbol
    if (elements.toTokenIcon) {
        elements.toTokenIcon.src = toToken.logo;
        elements.toTokenIcon.alt = toToken.symbol;
        elements.toTokenIcon.onerror = function() {
            this.src = `data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="40" fill="%23a855f7"/><text x="50" y="60" text-anchor="middle" fill="white" font-size="30">${toToken.symbol[0]}</text></svg>`;
        };
    }
    if (elements.toTokenSymbol) {
        elements.toTokenSymbol.textContent = toToken.symbol;
    }
}

function updateBalances() {
    const fromBalance = state.balances[state.fromToken] || 0;
    const toBalance = state.balances[state.toToken] || 0;

    if (elements.fromBalance) {
        elements.fromBalance.textContent = formatNumber(fromBalance);
    }

    if (elements.toBalance) {
        elements.toBalance.textContent = formatNumber(toBalance);
    }
}

function updateFromAmount() {
    if (elements.fromAmount) {
        elements.fromAmount.value = state.fromAmount;
    }
}

function updateToAmount() {
    if (elements.toAmount) {
        elements.toAmount.value = state.toAmount;
    }
}

function updateRateDisplay() {
    const fromToken = TOKENS[state.fromToken];
    const toToken = TOKENS[state.toToken];

    if (elements.rateDisplay && fromToken.price && toToken.price) {
        const rate = fromToken.price / toToken.price;
        elements.rateDisplay.textContent = `1 ${fromToken.symbol} = ${rate.toFixed(6)} ${toToken.symbol}`;
    }

    if (elements.priceImpact) {
        elements.priceImpact.textContent = `${state.priceImpact.toFixed(2)}%`;
        
        // Color code based on impact
        if (state.priceImpact < 1) {
            elements.priceImpact.style.color = '#10b981';
        } else if (state.priceImpact < 3) {
            elements.priceImpact.style.color = '#f59e0b';
        } else {
            elements.priceImpact.style.color = '#ef4444';
        }
    }

    if (elements.networkFee) {
        elements.networkFee.textContent = '~$0.01';
    }
}

function updateRouteDisplay() {
    if (!elements.routeDisplay) return;

    if (!state.bestRoute || !state.fromAmount) {
        elements.routeDisplay.innerHTML = '<span class="no-route">Enter an amount to see the best route</span>';
        return;
    }

    const fromToken = TOKENS[state.fromToken];
    const toToken = TOKENS[state.toToken];

    elements.routeDisplay.innerHTML = `
        <div class="route-path">
            <div class="route-token">
                <img src="${fromToken.logo}" alt="${fromToken.symbol}" onerror="this.style.display='none'">
                <span>${fromToken.symbol}</span>
            </div>
            <div class="route-arrow">→</div>
            <div class="route-dex">
                <span class="dex-logo">${state.bestRoute.logo}</span>
                <span>${state.bestRoute.name}</span>
            </div>
            <div class="route-arrow">→</div>
            <div class="route-token">
                <img src="${toToken.logo}" alt="${toToken.symbol}" onerror="this.style.display='none'">
                <span>${toToken.symbol}</span>
            </div>
        </div>
        <div class="route-info">
            <span class="route-fee">Fee: ${(state.bestRoute.fee * 100).toFixed(2)}%</span>
            <span class="route-savings">Best rate via ${state.bestRoute.name}</span>
        </div>
    `;
}

function updateSwapButton() {
    if (!elements.swapBtn) return;
    
    const btnText = elements.swapBtn.querySelector('.swap-btn-text') || elements.swapBtn;

    if (!state.walletConnected) {
        if (btnText.classList) {
            btnText.textContent = 'Connect Wallet';
        } else {
            elements.swapBtn.innerHTML = '<span class="swap-btn-text">Connect Wallet</span>';
        }
        elements.swapBtn.disabled = false;
        return;
    }

    if (!state.fromAmount || parseFloat(state.fromAmount) === 0) {
        if (btnText.classList) {
            btnText.textContent = 'Enter Amount';
        } else {
            elements.swapBtn.innerHTML = '<span class="swap-btn-text">Enter Amount</span>';
        }
        elements.swapBtn.disabled = true;
        return;
    }

    const balance = state.balances[state.fromToken] || 1000; // Demo balance
    if (parseFloat(state.fromAmount) > balance) {
        if (btnText.classList) {
            btnText.textContent = `Insufficient ${state.fromToken}`;
        } else {
            elements.swapBtn.innerHTML = `<span class="swap-btn-text">Insufficient ${state.fromToken}</span>`;
        }
        elements.swapBtn.disabled = true;
        return;
    }

    if (state.priceImpact > 15) {
        if (btnText.classList) {
            btnText.textContent = 'Price Impact Too High';
        } else {
            elements.swapBtn.innerHTML = '<span class="swap-btn-text">Price Impact Too High</span>';
        }
        elements.swapBtn.disabled = true;
        return;
    }

    // Ready to swap
    if (btnText.classList) {
        btnText.textContent = 'Swap';
    } else {
        elements.swapBtn.innerHTML = '<span class="swap-btn-text">Swap</span>';
    }
    elements.swapBtn.disabled = false;
}

// Token Selection
function openTokenModal(selectFor) {
    state.selectingFor = selectFor;
    state.modalOpen = true;
    renderTokenList();
    
    if (elements.tokenModal) {
        elements.tokenModal.classList.add('active');
    }

    if (elements.tokenSearch) {
        elements.tokenSearch.value = '';
        elements.tokenSearch.focus();
    }
}

function closeTokenModal() {
    state.modalOpen = false;
    
    if (elements.tokenModal) {
        elements.tokenModal.classList.remove('active');
    }
}

function renderTokenList(filter = '') {
    if (!elements.tokenList) return;

    const currentToken = state.selectingFor === 'from' ? state.fromToken : state.toToken;
    const otherToken = state.selectingFor === 'from' ? state.toToken : state.fromToken;

    let html = '';
    
    Object.entries(TOKENS).forEach(([symbol, token]) => {
        // Filter by search
        if (filter && !token.name.toLowerCase().includes(filter.toLowerCase()) && 
            !token.symbol.toLowerCase().includes(filter.toLowerCase())) {
            return;
        }

        const isSelected = symbol === currentToken;
        const isDisabled = symbol === otherToken;
        const balance = state.balances[symbol] || 0;

        html += `
            <button class="token-item ${isSelected ? 'selected' : ''} ${isDisabled ? 'disabled' : ''}"
                    data-symbol="${symbol}"
                    ${isDisabled ? 'disabled' : ''}>
                <div class="token-item-left">
                    <img src="${token.logo}" alt="${token.symbol}" 
                         onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><circle cx=%2250%22 cy=%2250%22 r=%2240%22 fill=%22%23a855f7%22/><text x=%2250%22 y=%2260%22 text-anchor=%22middle%22 fill=%22white%22 font-size=%2230%22>${symbol[0]}</text></svg>'">
                    <div class="token-item-info">
                        <span class="token-item-symbol">${token.symbol}</span>
                        <span class="token-item-name">${token.name}</span>
                    </div>
                </div>
                <div class="token-item-right">
                    <span class="token-item-balance">${formatNumber(balance)}</span>
                    <span class="token-item-value">$${(balance * token.price).toFixed(2)}</span>
                </div>
            </button>
        `;
    });

    elements.tokenList.innerHTML = html;

    // Bind click events
    elements.tokenList.querySelectorAll('.token-item:not(.disabled)').forEach(item => {
        item.addEventListener('click', () => {
            selectToken(item.dataset.symbol);
        });
    });
}

function filterTokens(e) {
    renderTokenList(e.target.value);
}

function selectToken(symbol) {
    if (state.selectingFor === 'from') {
        state.fromToken = symbol;
    } else {
        state.toToken = symbol;
    }

    closeTokenModal();
    updateUI();
    calculateSwap();
}

// Swap Tokens (reverse direction)
function swapTokens() {
    const temp = state.fromToken;
    state.fromToken = state.toToken;
    state.toToken = temp;

    const tempAmount = state.fromAmount;
    state.fromAmount = state.toAmount;
    state.toAmount = tempAmount;

    // Add animation
    if (elements.swapDirection) {
        elements.swapDirection.style.transform = 'rotate(180deg)';
        setTimeout(() => {
            elements.swapDirection.style.transform = 'rotate(0deg)';
        }, 300);
    }

    updateUI();
    updateFromAmount();
    updateToAmount();
    calculateSwap();
}

// Settings
function toggleSettings() {
    state.settingsOpen = !state.settingsOpen;
    
    if (elements.settingsPanel) {
        elements.settingsPanel.classList.toggle('active', state.settingsOpen);
        elements.settingsPanel.style.display = state.settingsOpen ? 'block' : 'none';
    }
}

function closeSettings() {
    state.settingsOpen = false;
    
    if (elements.settingsPanel) {
        elements.settingsPanel.classList.remove('active');
        elements.settingsPanel.style.display = 'none';
    }
}

function setSlippage(value) {
    state.slippage = value;

    // Update UI
    document.querySelectorAll('.slippage-btn').forEach(btn => {
        btn.classList.toggle('active', parseFloat(btn.dataset.value) === value);
    });

    const customSlippage = document.getElementById('custom-slippage');
    if (customSlippage && ![0.1, 0.5, 1].includes(value)) {
        customSlippage.value = value;
    }
}

// Quick Amount Buttons (25%, 50%, 75%, MAX)
function handleQuickAmount(percent) {
    const balance = state.balances[state.fromToken] || 1000; // Demo balance fallback
    const amount = (balance * percent / 100).toFixed(6);
    state.fromAmount = amount;
    updateFromAmount();
    calculateSwap();
}

// Max/Half Buttons
function handleMaxClick(e) {
    handleQuickAmount(100);
}

function handleHalfClick(e) {
    handleQuickAmount(50);
}

// Wallet Connection - Using Stacks Connect library
async function connectWallet() {
    if (state.walletConnected) {
        handleSwap();
        return;
    }

    try {
        // Check if Stacks Connect library is loaded
        if (typeof window.StacksConnect !== 'undefined') {
            // Use Stacks Connect library
            const { showConnect } = window.StacksConnect;
            
            showConnect({
                appDetails: {
                    name: 'SNOZCOIN Swap',
                    icon: window.location.origin + '/assets/SNOZCOIN-512.png'
                },
                onFinish: async (data) => {
                    state.walletConnected = true;
                    state.walletAddress = data.userSession.loadUserData().profile.stxAddress.mainnet;
                    
                    // Update UI
                    updateConnectButton();
                    await fetchBalances();
                    updateSwapButton();
                    showNotification('Wallet connected successfully!', 'success');
                },
                onCancel: () => {
                    showNotification('Wallet connection cancelled', 'info');
                },
                userSession: new window.StacksConnect.UserSession()
            });
        } 
        // Fallback to direct Hiro Wallet provider
        else if (typeof window.StacksProvider !== 'undefined') {
            const response = await window.StacksProvider.request('stx_requestAccounts');
            
            if (response && response.result && response.result.length > 0) {
                state.walletConnected = true;
                state.walletAddress = response.result[0].address;
                
                // Fetch balances
                await fetchBalances();
                updateConnectButton();
                updateSwapButton();
                showNotification('Wallet connected successfully!', 'success');
            }
        } else {
            // No wallet found - show install options
            showWalletInstallModal();
        }
    } catch (error) {
        console.error('Wallet connection error:', error);
        showNotification('Failed to connect wallet. Please try again.', 'error');
    }
}

// Show wallet installation options
function showWalletInstallModal() {
    const modal = document.createElement('div');
    modal.className = 'wallet-install-modal';
    modal.innerHTML = `
        <div class="wallet-install-content">
            <h3>Install a Stacks Wallet</h3>
            <p>You need a Stacks wallet to swap tokens. Choose one below:</p>
            <div class="wallet-options">
                <a href="https://wallet.hiro.so/" target="_blank" rel="noopener" class="wallet-option">
                    <img src="https://wallet.hiro.so/favicon.ico" alt="Hiro">
                    <span>Hiro Wallet</span>
                    <span class="wallet-badge">Recommended</span>
                </a>
                <a href="https://www.xverse.app/" target="_blank" rel="noopener" class="wallet-option">
                    <img src="https://www.xverse.app/favicon.ico" alt="Xverse">
                    <span>Xverse Wallet</span>
                </a>
                <a href="https://leather.io/" target="_blank" rel="noopener" class="wallet-option">
                    <img src="https://leather.io/favicon.ico" alt="Leather">
                    <span>Leather Wallet</span>
                </a>
            </div>
            <button class="wallet-modal-close" onclick="this.closest('.wallet-install-modal').remove()">Close</button>
        </div>
    `;
    document.body.appendChild(modal);
}

// Update connect button state
function updateConnectButton() {
    if (elements.connectWalletBtn) {
        if (state.walletConnected && state.walletAddress) {
            const shortAddr = state.walletAddress.slice(0, 6) + '...' + state.walletAddress.slice(-4);
            elements.connectWalletBtn.innerHTML = `
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18">
                    <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/>
                    <polyline points="22 4 12 14.01 9 11.01"/>
                </svg>
                ${shortAddr}
            `;
            elements.connectWalletBtn.classList.add('connected');
        } else {
            elements.connectWalletBtn.innerHTML = `
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18">
                    <rect x="2" y="6" width="20" height="12" rx="2"/>
                    <path d="M22 10H18a2 2 0 00-2 2v0a2 2 0 002 2h4"/>
                </svg>
                Connect Wallet
            `;
            elements.connectWalletBtn.classList.remove('connected');
        }
    }
}

async function fetchBalances() {
    if (!state.walletAddress) return;

    try {
        // Fetch STX balance
        const response = await fetch(`https://api.mainnet.hiro.so/extended/v1/address/${state.walletAddress}/balances`);
        const data = await response.json();

        if (data.stx) {
            state.balances.STX = parseInt(data.stx.balance) / 1000000;
        }

        // For demo, set some mock balances for stablecoins
        // In production, you'd fetch actual token balances
        state.balances.USDC = 1000;
        state.balances.USDT = 500;
        state.balances.DAI = 250;

        updateBalances();
    } catch (error) {
        console.error('Error fetching balances:', error);
    }
}

// Swap Execution
async function handleSwap() {
    if (!state.walletConnected) {
        connectWallet();
        return;
    }

    if (!state.fromAmount || parseFloat(state.fromAmount) === 0) {
        showNotification('Please enter an amount', 'warning');
        return;
    }

    state.isLoading = true;
    updateSwapButtonLoading(true);

    try {
        // In production, this would call the actual DEX contract
        // For now, simulate a swap
        await simulateSwap();

        // Add to transaction history
        addTransaction({
            type: 'swap',
            fromToken: state.fromToken,
            toToken: state.toToken,
            fromAmount: state.fromAmount,
            toAmount: state.toAmount,
            status: 'completed',
            timestamp: Date.now(),
            txHash: '0x' + Math.random().toString(16).slice(2, 10)
        });

        showNotification(`Successfully swapped ${state.fromAmount} ${state.fromToken} for ${state.toAmount} ${state.toToken}`, 'success');

        // Reset amounts
        state.fromAmount = '';
        state.toAmount = '';
        updateFromAmount();
        updateToAmount();

        // Refresh balances
        await fetchBalances();

    } catch (error) {
        console.error('Swap error:', error);
        showNotification('Swap failed. Please try again.', 'error');
    } finally {
        state.isLoading = false;
        updateSwapButtonLoading(false);
        updateSwapButton();
    }
}

async function simulateSwap() {
    // Simulate network delay
    return new Promise(resolve => setTimeout(resolve, 2000));
}

function updateSwapButtonLoading(loading) {
    if (!elements.swapBtn) return;

    if (loading) {
        elements.swapBtn.innerHTML = `
            <span class="loading-spinner"></span>
            <span>Swapping...</span>
        `;
        elements.swapBtn.disabled = true;
    } else {
        elements.swapBtn.innerHTML = 'Swap';
    }
}

// Transaction History
function loadRecentTransactions() {
    const stored = localStorage.getItem('snozcoin_swap_transactions');
    if (stored) {
        state.recentTransactions = JSON.parse(stored);
        renderTransactions();
    }
}

function addTransaction(tx) {
    state.recentTransactions.unshift(tx);
    state.recentTransactions = state.recentTransactions.slice(0, 10); // Keep last 10
    
    localStorage.setItem('snozcoin_swap_transactions', JSON.stringify(state.recentTransactions));
    renderTransactions();
}

function renderTransactions() {
    if (!elements.transactionList) return;

    if (state.recentTransactions.length === 0) {
        elements.transactionList.innerHTML = `
            <div class="no-transactions">
                <p>No recent transactions</p>
            </div>
        `;
        return;
    }

    let html = '';
    
    state.recentTransactions.forEach(tx => {
        const fromToken = TOKENS[tx.fromToken];
        const toToken = TOKENS[tx.toToken];
        const time = formatTime(tx.timestamp);

        html += `
            <div class="transaction-item">
                <div class="transaction-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M7 16V4m0 0L3 8m4-4l4 4M17 8v12m0 0l4-4m-4 4l-4-4"/>
                    </svg>
                </div>
                <div class="transaction-info">
                    <span class="transaction-title">Swap ${tx.fromToken} → ${tx.toToken}</span>
                    <span class="transaction-details">${formatNumber(tx.fromAmount)} ${tx.fromToken} for ${formatNumber(tx.toAmount)} ${tx.toToken}</span>
                </div>
                <div class="transaction-meta">
                    <span class="transaction-status ${tx.status}">${tx.status}</span>
                    <span class="transaction-time">${time}</span>
                </div>
            </div>
        `;
    });

    elements.transactionList.innerHTML = html;
}

// Utility Functions
function formatNumber(num) {
    if (typeof num === 'string') num = parseFloat(num);
    if (isNaN(num)) return '0';
    
    if (num >= 1000000) {
        return (num / 1000000).toFixed(2) + 'M';
    } else if (num >= 1000) {
        return (num / 1000).toFixed(2) + 'K';
    } else if (num >= 1) {
        return num.toFixed(2);
    } else {
        return num.toFixed(6);
    }
}

function formatTime(timestamp) {
    const now = Date.now();
    const diff = now - timestamp;
    
    if (diff < 60000) {
        return 'Just now';
    } else if (diff < 3600000) {
        return Math.floor(diff / 60000) + 'm ago';
    } else if (diff < 86400000) {
        return Math.floor(diff / 3600000) + 'h ago';
    } else {
        return new Date(timestamp).toLocaleDateString();
    }
}

function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `swap-notification ${type}`;
    notification.innerHTML = `
        <span class="notification-icon">
            ${type === 'success' ? '✓' : type === 'error' ? '✕' : type === 'warning' ? '⚠' : 'ℹ'}
        </span>
        <span class="notification-message">${message}</span>
    `;

    document.body.appendChild(notification);

    // Animate in
    setTimeout(() => notification.classList.add('show'), 10);

    // Remove after delay
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 5000);
}

// Add CSS for notifications dynamically
const notificationStyles = document.createElement('style');
notificationStyles.textContent = `
    .swap-notification {
        position: fixed;
        bottom: 20px;
        right: 20px;
        padding: 16px 24px;
        background: rgba(30, 30, 40, 0.95);
        border: 1px solid rgba(168, 85, 247, 0.3);
        border-radius: 12px;
        display: flex;
        align-items: center;
        gap: 12px;
        transform: translateX(120%);
        transition: transform 0.3s ease;
        z-index: 10000;
        backdrop-filter: blur(20px);
    }

    .swap-notification.show {
        transform: translateX(0);
    }

    .swap-notification.success {
        border-color: rgba(16, 185, 129, 0.5);
    }

    .swap-notification.error {
        border-color: rgba(239, 68, 68, 0.5);
    }

    .swap-notification.warning {
        border-color: rgba(245, 158, 11, 0.5);
    }

    .notification-icon {
        width: 24px;
        height: 24px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 12px;
    }

    .success .notification-icon {
        background: rgba(16, 185, 129, 0.2);
        color: #10b981;
    }

    .error .notification-icon {
        background: rgba(239, 68, 68, 0.2);
        color: #ef4444;
    }

    .warning .notification-icon {
        background: rgba(245, 158, 11, 0.2);
        color: #f59e0b;
    }

    .notification-message {
        color: #fff;
        font-size: 14px;
    }

    .loading-spinner {
        width: 20px;
        height: 20px;
        border: 2px solid rgba(255,255,255,0.3);
        border-top-color: #fff;
        border-radius: 50%;
        animation: spin 0.8s linear infinite;
    }

    @keyframes spin {
        to { transform: rotate(360deg); }
    }

    .rotating {
        animation: spin 1s linear infinite;
    }
`;
document.head.appendChild(notificationStyles);

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { TOKENS, DEX_ROUTES, state };
}
