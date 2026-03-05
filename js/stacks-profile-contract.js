/**
 * SNOZCOIN Profile Contract - JavaScript Integration
 * Use this to interact with the deployed smart contract
 */

// Contract constants
const CONTRACT_ADDRESS = 'ST_YOUR_ADDRESS_HERE'; // Replace after deployment
const CONTRACT_NAME = 'snozcoin-profiles';
const TESTNET_API = 'https://api.testnet.hiro.so';
const MAINNET_API = 'https://api.hiro.so';

// User type mappings
const USER_TYPES = {
    creator: 1,
    supporter: 2,
    corporate: 3,
    investor: 4
};

const USER_TYPE_NAMES = {
    1: 'creator',
    2: 'supporter',
    3: 'corporate',
    4: 'investor'
};

/**
 * SnozProfileContract - Interact with the Stacks smart contract
 */
class SnozProfileContract {
    constructor(network = 'testnet') {
        this.network = network;
        this.apiUrl = network === 'mainnet' ? MAINNET_API : TESTNET_API;
        this.contractAddress = CONTRACT_ADDRESS;
        this.contractName = CONTRACT_NAME;
    }

    /**
     * Get profile by wallet address
     */
    async getProfile(walletAddress) {
        try {
            const url = `${this.apiUrl}/v2/contracts/call-read/${this.contractAddress}/${this.contractName}/get-profile`;
            
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    sender: walletAddress,
                    arguments: [this._encodePrincipal(walletAddress)]
                })
            });

            const data = await response.json();
            
            if (data.okay && data.result !== '0x09') { // 0x09 = none
                return this._decodeProfile(data.result);
            }
            
            return null;
        } catch (error) {
            console.error('Error getting profile:', error);
            return null;
        }
    }

    /**
     * Check if username is available
     */
    async isUsernameAvailable(username) {
        try {
            const url = `${this.apiUrl}/v2/contracts/call-read/${this.contractAddress}/${this.contractName}/is-username-available`;
            
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    sender: this.contractAddress,
                    arguments: [this._encodeString(username)]
                })
            });

            const data = await response.json();
            return data.okay && data.result === '0x03'; // 0x03 = true
        } catch (error) {
            console.error('Error checking username:', error);
            return false;
        }
    }

    /**
     * Get total registered users
     */
    async getTotalUsers() {
        try {
            const url = `${this.apiUrl}/v2/contracts/call-read/${this.contractAddress}/${this.contractName}/get-total-users`;
            
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    sender: this.contractAddress,
                    arguments: []
                })
            });

            const data = await response.json();
            if (data.okay) {
                return this._decodeUint(data.result);
            }
            return 0;
        } catch (error) {
            console.error('Error getting total users:', error);
            return 0;
        }
    }

    /**
     * Register profile - requires Hiro Wallet connection
     * This returns the transaction options for @stacks/connect
     */
    getRegisterProfileTxOptions(username, country, userType, avatarSeed, onFinish, onCancel) {
        const userTypeNum = typeof userType === 'string' ? USER_TYPES[userType] : userType;
        
        return {
            contractAddress: this.contractAddress,
            contractName: this.contractName,
            functionName: 'register-profile',
            functionArgs: [
                this._cvString(username),
                this._cvString(country),
                this._cvUint(userTypeNum),
                this._cvString(avatarSeed)
            ],
            network: this.network === 'mainnet' ? 'mainnet' : 'testnet',
            postConditionMode: 1, // Allow
            onFinish: onFinish || ((data) => console.log('Transaction:', data)),
            onCancel: onCancel || (() => console.log('Transaction cancelled'))
        };
    }

    /**
     * Update profile - requires Hiro Wallet connection
     */
    getUpdateProfileTxOptions(country, userType, avatarSeed, onFinish, onCancel) {
        const userTypeNum = typeof userType === 'string' ? USER_TYPES[userType] : userType;
        
        return {
            contractAddress: this.contractAddress,
            contractName: this.contractName,
            functionName: 'update-profile',
            functionArgs: [
                this._cvString(country),
                this._cvUint(userTypeNum),
                this._cvString(avatarSeed)
            ],
            network: this.network === 'mainnet' ? 'mainnet' : 'testnet',
            postConditionMode: 1,
            onFinish: onFinish || ((data) => console.log('Transaction:', data)),
            onCancel: onCancel || (() => console.log('Transaction cancelled'))
        };
    }

    // ============================================
    // Helper methods for Clarity value encoding
    // ============================================

    _encodePrincipal(address) {
        // Simplified - in production use @stacks/transactions
        return `0x05${this._hexEncode(address)}`;
    }

    _encodeString(str) {
        const hex = this._hexEncode(str);
        const len = (str.length).toString(16).padStart(8, '0');
        return `0x0d${len}${hex}`;
    }

    _hexEncode(str) {
        return Array.from(str).map(c => c.charCodeAt(0).toString(16).padStart(2, '0')).join('');
    }

    _decodeUint(hex) {
        if (hex.startsWith('0x01')) {
            return parseInt(hex.slice(4), 16);
        }
        return 0;
    }

    _decodeProfile(hex) {
        // Simplified decoder - in production use @stacks/transactions cvToJSON
        // This is a placeholder that returns mock data structure
        return {
            username: 'decoded_username',
            country: 'US',
            userType: 1,
            avatarSeed: 'seed',
            ipfsHash: null,
            createdAt: 0,
            updatedAt: 0,
            isVerified: false
        };
    }

    // Clarity value constructors (for @stacks/connect)
    _cvString(str) {
        return { type: 'string-ascii', value: str };
    }

    _cvUint(num) {
        return { type: 'uint', value: num.toString() };
    }
}

// Export for use in browser and Node.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { SnozProfileContract, USER_TYPES, USER_TYPE_NAMES };
}

if (typeof window !== 'undefined') {
    window.SnozProfileContract = SnozProfileContract;
    window.SNOZ_USER_TYPES = USER_TYPES;
}
