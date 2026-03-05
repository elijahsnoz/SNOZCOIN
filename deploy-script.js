/**
 * Deploy SNOZCOIN Profiles Contract to Stacks Testnet
 * 
 * This script requires your private key to sign the transaction.
 * 
 * Usage:
 * 1. Export your private key from Xverse/Leather wallet
 * 2. Set it as PRIVATE_KEY environment variable
 * 3. Run: PRIVATE_KEY=your_key node deploy-script.js
 */

const { 
    makeContractDeploy, 
    broadcastTransaction,
    AnchorMode,
    PostConditionMode,
    ClarityVersion
} = require('@stacks/transactions');
const { StacksTestnet } = require('@stacks/network');
const fs = require('fs');
const path = require('path');

// Configuration
const CONTRACT_NAME = 'snozcoin-profiles';
const CLARITY_VERSION = ClarityVersion.Clarity2; // Force Clarity 2!
const NETWORK = new StacksTestnet();

async function deploy() {
    // Get private key from environment
    const privateKey = process.env.PRIVATE_KEY;
    
    if (!privateKey) {
        console.log('❌ Error: PRIVATE_KEY environment variable not set');
        console.log('');
        console.log('To deploy, you need your private key from Xverse:');
        console.log('1. Open Xverse wallet');
        console.log('2. Go to Settings > Security > Show Secret Key');
        console.log('3. Run: PRIVATE_KEY="your_key" node deploy-script.js');
        process.exit(1);
    }

    // Read contract source
    const contractPath = path.join(__dirname, 'contracts', 'snozcoin-profiles.clar');
    const codeBody = fs.readFileSync(contractPath, 'utf8');
    
    console.log('🚀 Deploying SNOZCOIN Profiles Contract');
    console.log(`   Contract Name: ${CONTRACT_NAME}`);
    console.log(`   Clarity Version: 2`);
    console.log(`   Network: Testnet`);
    console.log('');

    try {
        // Create deployment transaction
        const txOptions = {
            contractName: CONTRACT_NAME,
            codeBody: codeBody,
            senderKey: privateKey,
            network: NETWORK,
            anchorMode: AnchorMode.Any,
            postConditionMode: PostConditionMode.Allow,
            clarityVersion: CLARITY_VERSION,
            fee: 500000n, // 0.5 STX fee
        };

        console.log('📝 Creating transaction...');
        const transaction = await makeContractDeploy(txOptions);

        console.log('📡 Broadcasting transaction...');
        const result = await broadcastTransaction({ transaction, network: NETWORK });

        if (result.error) {
            console.log('❌ Deployment failed:', result.error);
            console.log('   Reason:', result.reason);
        } else {
            console.log('✅ Transaction broadcast successful!');
            console.log(`   TX ID: ${result.txid}`);
            console.log(`   Explorer: https://explorer.hiro.so/txid/${result.txid}?chain=testnet`);
        }
    } catch (error) {
        console.log('❌ Error:', error.message);
    }
}

deploy();
