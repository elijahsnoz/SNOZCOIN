/**
 * SNOZCOIN Profile Contract Deployment Script
 * Deploys the contract to Stacks Testnet
 */

const fs = require('fs');
const path = require('path');

// Configuration
const CONFIG = {
    network: 'testnet',
    apiUrl: 'https://api.testnet.hiro.so',
    contractName: 'snozcoin-profiles',
    deployerAddress: 'ST10N4Q241TTN6TYC5HNAX2YTGNMWB1K1AZ8YTS6A',
    hiroApiKey: '61e2c7df206c15942210770f88b2aa6c'
};

// Read contract source
const contractPath = path.join(__dirname, '..', 'snozcoin-profiles.clar');
const contractSource = fs.readFileSync(contractPath, 'utf8');

console.log('='.repeat(60));
console.log('SNOZCOIN Profile Contract Deployment');
console.log('='.repeat(60));
console.log('');
console.log('Network:', CONFIG.network);
console.log('Deployer:', CONFIG.deployerAddress);
console.log('Contract:', CONFIG.contractName);
console.log('');
console.log('Contract Source Length:', contractSource.length, 'bytes');
console.log('');
console.log('='.repeat(60));
console.log('');
console.log('⚠️  IMPORTANT: To deploy this contract, you need to:');
console.log('');
console.log('OPTION 1: Use Hiro Platform (Recommended)');
console.log('------------------------------------------');
console.log('1. Go to: https://platform.hiro.so/');
console.log('2. Create a new project');
console.log('3. Upload the contract file: contracts/snozcoin-profiles.clar');
console.log('4. Click "Deploy to Testnet"');
console.log('5. Connect your Hiro Wallet');
console.log('6. Approve the transaction');
console.log('');
console.log('OPTION 2: Use Clarinet Deployments');
console.log('-----------------------------------');
console.log('1. Run: clarinet deployments generate --testnet');
console.log('2. Edit the generated deployment plan');
console.log('3. Run: clarinet deployments apply -p deployments/default.testnet.yaml');
console.log('');
console.log('OPTION 3: Use Stacks.js (Advanced)');
console.log('----------------------------------');
console.log('See: https://docs.stacks.co/stacks-in-depth/transactions/smart-contracts');
console.log('');
console.log('='.repeat(60));
console.log('');
console.log('After deployment, your contract address will be:');
console.log(`${CONFIG.deployerAddress}.${CONFIG.contractName}`);
console.log('');
console.log('View it on explorer:');
console.log(`https://explorer.hiro.so/txid/[TX_ID]?chain=testnet`);
console.log('');
