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

// Wallet configurations with icons
const WALLETS = {
    hiro: {
        name: 'Hiro Wallet',
        icon: 'https://wallet.hiro.so/favicon.ico',
        iconSvg: `<svg viewBox="0 0 24 24" fill="#FF5500" width="24" height="24"><rect width="24" height="24" rx="6" fill="#FF5500"/><path d="M7 7h10v2H7zM7 11h10v2H7zM7 15h10v2H7z" fill="white"/></svg>`,
        type: 'stacks'
    },
    phantom: {
        name: 'Phantom',
        icon: 'https://phantom.app/favicon.ico',
        iconSvg: `<svg viewBox="0 0 128 128" fill="none" width="24" height="24"><rect width="128" height="128" rx="26" fill="url(#phantom-gradient)"/><defs><linearGradient id="phantom-gradient" x1="0" y1="0" x2="128" y2="128"><stop stop-color="#534BB1"/><stop offset="1" stop-color="#551BF9"/></linearGradient></defs><path d="M110.5 64.3c0-3.5-.4-6.9-1-10.2-2.4-12.3-9.6-23-19.8-30.2C80.3 17.1 68.3 14 56 16c-20.5 3.3-36.2 20.3-38 41-.1.8-.1 1.6-.2 2.3-.3 6.2.5 12.5 2.5 18.4 4.4 13.3 14.6 24.1 27.5 29.4 5.4 2.2 11.1 3.4 17 3.6h.5c2.8.1 5.6-.1 8.3-.5 9.4-1.3 18.1-5.3 25.1-11.4 9.5-8.2 15.1-19.8 15.7-32.2.1-.7.1-1.5.1-2.3z" fill="#fff"/><path d="M86.7 58.7c-2.8 0-5-.9-5-5.3 0-4.4 2.2-8 5-8s5 3.6 5 8-2.2 5.3-5 5.3zM51.7 58.7c-2.8 0-5-.9-5-5.3 0-4.4 2.2-8 5-8s5 3.6 5 8-2.2 5.3-5 5.3z" fill="#534BB1"/></svg>`,
        type: 'solana'
    },
    metamask: {
        name: 'MetaMask',
        icon: 'https://metamask.io/favicon.ico',
        iconSvg: `<svg viewBox="0 0 24 24" width="24" height="24"><path fill="#E2761B" d="M21.8 2L13.4 8.2l1.6-3.7z"/><path fill="#E4761B" d="M2.2 2l8.3 6.3-1.5-3.8zm16.3 14.4l-2.2 3.4 4.8 1.3 1.4-4.6zm-17.2.1l1.4 4.6 4.8-1.3-2.2-3.4z"/><path fill="#E4761B" d="M7.3 10.5l-1.4 2 4.8.2-.2-5.1zm9.4 0l-3.3-3-.1 5.2 4.8-.2zm-9.2 8.3l2.9-1.4-2.5-1.9zm5.2-1.4l2.9 1.4-.4-3.3z"/><path fill="#D7C1B3" d="M15.5 18.8l-2.9-1.4.2 1.8v.8zm-7.9 0l2.7 1.2v-.8l.2-1.8z"/><path fill="#233447" d="M10.2 14.5l-2.4-.7 1.7-.8zm3.6 0l.7-1.5 1.7.8z"/><path fill="#CD6116" d="M7.6 18.8l.4-3.4-2.6.1zm8.4-3.4l.4 3.4 2.2-3.3zm2-5.4l-4.8.2.4 2.3.7-1.5 1.7.8zm-10.2 1.8l1.7-.8.7 1.5.4-2.3-4.8-.2z"/><path fill="#E4751F" d="M5.9 12l2 3.9-.1-1.9zm10.2 2l-.1 1.9 2-3.9zm-6.3-1.8l-.4 2.3.5 2.7.1-3.6zm4.4 0l-.2 1.4.1 3.6.5-2.7z"/><path fill="#F6851B" d="M14.2 14.5l-.5 2.7.4.2 2.4-1.9.1-1.9zm-6.4-.7l.1 1.9 2.4 1.9.4-.2-.5-2.7z"/><path fill="#C0AD9E" d="M14.3 20l-.1-.8-.2-.2h-4l-.2.2-.1.8-2.7-1.2 1 .8 1.9 1.3h4.2l1.9-1.3 1-.8z"/><path fill="#161616" d="M12.6 17.4l-.4-.2h-2.4l-.4.2-.2 1.8.2-.2h4l.2.2z"/><path fill="#763D16" d="M22 8.5l.7-3.5L21.8 2l-9.2 6.8 3.5 3 5 1.4 1.1-1.3-.5-.3.8-.7-.6-.5.8-.6zm-20.7-3.5l.7 3.5-.5.3.8.6-.6.5.8.7-.5.4 1.1 1.3 5-1.5 3.5-3L2.2 2z"/><path fill="#F6851B" d="M21.1 13.2l-5-1.5 1.5 2.3-2.2 4.3 2.9-.1h4.4zm-14.2-1.5l-5 1.5-1.7 5h4.4l2.9.1-2.2-4.3zm6.3 1.8l.3-5.5 1.5-4H9l1.5 4 .3 5.5.1 1.5v3.5h2.4V15z"/></svg>`,
        type: 'evm'
    },
    xverse: {
        name: 'Xverse',
        icon: 'https://www.xverse.app/favicon.ico',
        iconSvg: `<svg viewBox="0 0 24 24" fill="#EE7A30" width="24" height="24"><rect width="24" height="24" rx="6" fill="#12141E"/><path d="M6 8l6 8 6-8" stroke="#EE7A30" stroke-width="2" fill="none"/></svg>`,
        type: 'stacks'
    },
    leather: {
        name: 'Leather',
        icon: 'https://leather.io/favicon.ico',
        iconSvg: `<svg viewBox="0 0 24 24" width="24" height="24"><rect width="24" height="24" rx="6" fill="#121212"/><path d="M7 7h10v10H7z" fill="#F5F5F5"/></svg>`,
        type: 'stacks'
    }
};

// Wallet Providers with detect, connect, and getAddress methods
const WALLET_PROVIDERS = {
    metamask: {
        name: 'MetaMask',
        icon: '🦊',
        type: 'evm',
        detect: function() {
            return typeof window.ethereum !== 'undefined' && window.ethereum.isMetaMask;
        },
        connect: async function() {
            if (!window.ethereum) {
                throw new Error('MetaMask not installed');
            }
            const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
            return accounts[0];
        },
        getAddress: async function() {
            if (!window.ethereum) return null;
            const accounts = await window.ethereum.request({ method: 'eth_accounts' });
            return accounts[0] || null;
        }
    },
    phantom: {
        name: 'Phantom',
        icon: '👻',
        type: 'solana',
        detect: function() {
            return window.phantom && window.phantom.solana;
        },
        connect: async function() {
            if (!window.phantom || !window.phantom.solana) {
                throw new Error('Phantom not installed');
            }
            const response = await window.phantom.solana.connect();
            return response.publicKey.toString();
        },
        getAddress: async function() {
            if (!window.phantom || !window.phantom.solana) return null;
            if (window.phantom.solana.isConnected) {
                return window.phantom.solana.publicKey.toString();
            }
            return null;
        }
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
    walletType: null, // 'hiro', 'phantom', 'metamask', etc.
    walletName: null,
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
    updateWalletUI();
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

// Wallet Connection - Show wallet selection modal
async function connectWallet() {
    if (state.walletConnected) {
        handleSwap();
        return;
    }
    
    // Show wallet selection modal
    showWalletSelectionModal();
}

// Show wallet selection modal with all supported wallets
function showWalletSelectionModal() {
    // Remove existing modal if any
    const existingModal = document.querySelector('.wallet-selection-modal');
    if (existingModal) existingModal.remove();
    
    const modal = document.createElement('div');
    modal.className = 'wallet-selection-modal';
    
    // Build wallet options HTML
    let walletsHTML = '';
    Object.entries(WALLET_PROVIDERS).forEach(([key, wallet]) => {
        const isDetected = wallet.detect();
        walletsHTML += `
            <button class="wallet-select-btn ${isDetected ? 'detected' : ''}" data-wallet="${key}">
                <span class="wallet-icon">${wallet.icon}</span>
                <span class="wallet-name">${wallet.name}</span>
                ${isDetected ? '<span class="wallet-status">Detected</span>' : '<span class="wallet-status install">Install</span>'}
            </button>
        `;
    });
    
    modal.innerHTML = `
        <div class="wallet-selection-content">
            <div class="wallet-modal-header">
                <h3>Connect Wallet</h3>
                <button class="wallet-modal-close-btn" aria-label="Close">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20">
                        <line x1="18" y1="6" x2="6" y2="18"/>
                        <line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                </button>
            </div>
            <p class="wallet-modal-subtitle">Choose your preferred wallet to connect</p>
            <div class="wallet-options-grid">
                ${walletsHTML}
            </div>
            <p class="wallet-modal-note">By connecting, you agree to the Terms of Service</p>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Add event listeners
    modal.querySelector('.wallet-modal-close-btn').addEventListener('click', () => modal.remove());
    modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.remove();
    });
    
    // Add click handlers for wallet buttons
    modal.querySelectorAll('.wallet-select-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
            const walletKey = btn.dataset.wallet;
            const wallet = WALLET_PROVIDERS[walletKey];
            
            if (!wallet.detect()) {
                // Redirect to install page
                const installUrls = {
                    hiro: 'https://wallet.hiro.so/',
                    xverse: 'https://www.xverse.app/',
                    leather: 'https://leather.io/',
                    phantom: 'https://phantom.app/',
                    metamask: 'https://metamask.io/'
                };
                window.open(installUrls[walletKey], '_blank');
                return;
            }
            
            // Show connecting state
            btn.classList.add('connecting');
            btn.innerHTML = `
                <span class="wallet-icon">${wallet.icon}</span>
                <span class="wallet-name">Connecting...</span>
                <span class="wallet-spinner"></span>
            `;
            
            try {
                await connectToWallet(walletKey);
                modal.remove();
            } catch (error) {
                console.error('Connection error:', error);
                btn.classList.remove('connecting');
                btn.innerHTML = `
                    <span class="wallet-icon">${wallet.icon}</span>
                    <span class="wallet-name">${wallet.name}</span>
                    <span class="wallet-status error">Failed</span>
                `;
                showNotification('Failed to connect. Please try again.', 'error');
            }
        });
    });
}

// Connect to specific wallet
async function connectToWallet(walletKey) {
    const wallet = WALLET_PROVIDERS[walletKey];
    
    if (!wallet) {
        throw new Error('Unknown wallet provider');
    }
    
    try {
        await wallet.connect();
        const address = await wallet.getAddress();
        
        if (address) {
            state.walletConnected = true;
            state.walletAddress = address;
            state.walletProvider = walletKey;
            
            // Update UI
            updateWalletUI();
            await fetchBalances();
            updateSwapButton();
            showNotification(`${wallet.name} connected successfully!`, 'success');
        }
    } catch (error) {
        throw error;
    }
}

// Update wallet UI to show connected state
function updateWalletUI() {
    // Remove existing wallet indicator
    const existingIndicator = document.querySelector('.swap-wallet-indicator');
    if (existingIndicator) existingIndicator.remove();
    
    if (state.walletConnected && state.walletAddress) {
        // Create wallet indicator with logout button
        const provider = WALLET_PROVIDERS[state.walletProvider];
        const shortAddr = state.walletAddress.slice(0, 6) + '...' + state.walletAddress.slice(-4);
        
        const indicator = document.createElement('div');
        indicator.className = 'swap-wallet-indicator';
        indicator.innerHTML = `
            <div class="wallet-indicator-info">
                <span class="wallet-indicator-icon">${provider ? provider.icon : '💰'}</span>
                <span class="wallet-indicator-address">${shortAddr}</span>
            </div>
            <button class="wallet-indicator-logout" id="swapLogoutBtn" title="Disconnect wallet">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
                    <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/>
                </svg>
            </button>
        `;
        
        // Insert after swap card header
        const swapCardHeader = document.querySelector('.swap-card-header');
        if (swapCardHeader) {
            swapCardHeader.appendChild(indicator);
        }
        
        // Add logout handler
        const logoutBtn = document.getElementById('swapLogoutBtn');
        if (logoutBtn) {
            logoutBtn.onclick = disconnectWallet;
        }
    }
}

// Disconnect wallet
function disconnectWallet() {
    state.walletConnected = false;
    state.walletAddress = null;
    state.walletProvider = null;
    state.balances = {};
    
    // Update UI
    updateWalletUI();
    updateSwapButton();
    updateBalanceDisplay('from');
    updateBalanceDisplay('to');
    
    showNotification('Wallet disconnected', 'info');
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
