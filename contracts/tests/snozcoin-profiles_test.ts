import { Clarinet, Tx, Chain, Account, types } from 'https://deno.land/x/clarinet@v1.7.1/index.ts';
import { assertEquals, assertNotEquals } from 'https://deno.land/std@0.170.0/testing/asserts.ts';

// Test: Register a new profile
Clarinet.test({
    name: "Can register a new profile",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        const deployer = accounts.get('deployer')!;
        const wallet1 = accounts.get('wallet_1')!;
        
        let block = chain.mineBlock([
            Tx.contractCall(
                'snozcoin-profiles',
                'register-profile',
                [
                    types.ascii('testuser'),
                    types.ascii('US'),
                    types.uint(1), // creator
                    types.ascii('avatar-seed-123')
                ],
                wallet1.address
            )
        ]);
        
        // Should succeed
        block.receipts[0].result.expectOk();
        
        // Check profile exists
        let getProfile = chain.callReadOnlyFn(
            'snozcoin-profiles',
            'get-profile',
            [types.principal(wallet1.address)],
            wallet1.address
        );
        
        // Should return some value (not none)
        assertNotEquals(getProfile.result, '(none)');
    }
});

// Test: Cannot register duplicate profile
Clarinet.test({
    name: "Cannot register duplicate profile",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        const wallet1 = accounts.get('wallet_1')!;
        
        let block = chain.mineBlock([
            // First registration
            Tx.contractCall(
                'snozcoin-profiles',
                'register-profile',
                [
                    types.ascii('user1'),
                    types.ascii('US'),
                    types.uint(1),
                    types.ascii('seed1')
                ],
                wallet1.address
            ),
            // Second registration (should fail)
            Tx.contractCall(
                'snozcoin-profiles',
                'register-profile',
                [
                    types.ascii('user2'),
                    types.ascii('UK'),
                    types.uint(2),
                    types.ascii('seed2')
                ],
                wallet1.address
            )
        ]);
        
        // First should succeed
        block.receipts[0].result.expectOk();
        // Second should fail with ERR-PROFILE-EXISTS (u101)
        block.receipts[1].result.expectErr(types.uint(101));
    }
});

// Test: Username uniqueness
Clarinet.test({
    name: "Cannot use taken username",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        const wallet1 = accounts.get('wallet_1')!;
        const wallet2 = accounts.get('wallet_2')!;
        
        let block = chain.mineBlock([
            // First user registers
            Tx.contractCall(
                'snozcoin-profiles',
                'register-profile',
                [
                    types.ascii('uniquename'),
                    types.ascii('US'),
                    types.uint(1),
                    types.ascii('seed1')
                ],
                wallet1.address
            ),
            // Second user tries same username
            Tx.contractCall(
                'snozcoin-profiles',
                'register-profile',
                [
                    types.ascii('uniquename'),
                    types.ascii('UK'),
                    types.uint(2),
                    types.ascii('seed2')
                ],
                wallet2.address
            )
        ]);
        
        // First should succeed
        block.receipts[0].result.expectOk();
        // Second should fail with ERR-USERNAME-TAKEN (u104)
        block.receipts[1].result.expectErr(types.uint(104));
    }
});

// Test: Check username availability
Clarinet.test({
    name: "Can check username availability",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        const wallet1 = accounts.get('wallet_1')!;
        
        // Before registration
        let available1 = chain.callReadOnlyFn(
            'snozcoin-profiles',
            'is-username-available',
            [types.ascii('newuser')],
            wallet1.address
        );
        available1.result.expectBool(true);
        
        // Register the username
        chain.mineBlock([
            Tx.contractCall(
                'snozcoin-profiles',
                'register-profile',
                [
                    types.ascii('newuser'),
                    types.ascii('US'),
                    types.uint(1),
                    types.ascii('seed')
                ],
                wallet1.address
            )
        ]);
        
        // After registration
        let available2 = chain.callReadOnlyFn(
            'snozcoin-profiles',
            'is-username-available',
            [types.ascii('newuser')],
            wallet1.address
        );
        available2.result.expectBool(false);
    }
});

// Test: Update profile
Clarinet.test({
    name: "Can update own profile",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        const wallet1 = accounts.get('wallet_1')!;
        
        // Register first
        chain.mineBlock([
            Tx.contractCall(
                'snozcoin-profiles',
                'register-profile',
                [
                    types.ascii('updater'),
                    types.ascii('US'),
                    types.uint(1),
                    types.ascii('oldseed')
                ],
                wallet1.address
            )
        ]);
        
        // Update profile
        let block = chain.mineBlock([
            Tx.contractCall(
                'snozcoin-profiles',
                'update-profile',
                [
                    types.ascii('UK'),
                    types.uint(2),
                    types.ascii('newseed')
                ],
                wallet1.address
            )
        ]);
        
        block.receipts[0].result.expectOk();
    }
});

// Test: Total users count
Clarinet.test({
    name: "Total users increments correctly",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        const wallet1 = accounts.get('wallet_1')!;
        const wallet2 = accounts.get('wallet_2')!;
        
        // Initially 0
        let count0 = chain.callReadOnlyFn(
            'snozcoin-profiles',
            'get-total-users',
            [],
            wallet1.address
        );
        count0.result.expectUint(0);
        
        // Register 2 users
        chain.mineBlock([
            Tx.contractCall(
                'snozcoin-profiles',
                'register-profile',
                [types.ascii('user1'), types.ascii('US'), types.uint(1), types.ascii('s1')],
                wallet1.address
            ),
            Tx.contractCall(
                'snozcoin-profiles',
                'register-profile',
                [types.ascii('user2'), types.ascii('UK'), types.uint(2), types.ascii('s2')],
                wallet2.address
            )
        ]);
        
        // Should be 2
        let count2 = chain.callReadOnlyFn(
            'snozcoin-profiles',
            'get-total-users',
            [],
            wallet1.address
        );
        count2.result.expectUint(2);
    }
});

// Test: Invalid user type
Clarinet.test({
    name: "Rejects invalid user type",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        const wallet1 = accounts.get('wallet_1')!;
        
        let block = chain.mineBlock([
            Tx.contractCall(
                'snozcoin-profiles',
                'register-profile',
                [
                    types.ascii('badtype'),
                    types.ascii('US'),
                    types.uint(99), // Invalid type
                    types.ascii('seed')
                ],
                wallet1.address
            )
        ]);
        
        // Should fail with ERR-INVALID-USER-TYPE (u105)
        block.receipts[0].result.expectErr(types.uint(105));
    }
});

// Test: Admin verification
Clarinet.test({
    name: "Admin can verify users",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        const deployer = accounts.get('deployer')!;
        const wallet1 = accounts.get('wallet_1')!;
        
        // Register user
        chain.mineBlock([
            Tx.contractCall(
                'snozcoin-profiles',
                'register-profile',
                [types.ascii('toverify'), types.ascii('US'), types.uint(1), types.ascii('s')],
                wallet1.address
            )
        ]);
        
        // Admin verifies user
        let block = chain.mineBlock([
            Tx.contractCall(
                'snozcoin-profiles',
                'verify-user',
                [types.principal(wallet1.address)],
                deployer.address
            )
        ]);
        
        block.receipts[0].result.expectOk();
    }
});

// Test: Non-admin cannot verify
Clarinet.test({
    name: "Non-admin cannot verify users",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        const wallet1 = accounts.get('wallet_1')!;
        const wallet2 = accounts.get('wallet_2')!;
        
        // Register user
        chain.mineBlock([
            Tx.contractCall(
                'snozcoin-profiles',
                'register-profile',
                [types.ascii('user1'), types.ascii('US'), types.uint(1), types.ascii('s')],
                wallet1.address
            )
        ]);
        
        // Non-admin tries to verify
        let block = chain.mineBlock([
            Tx.contractCall(
                'snozcoin-profiles',
                'verify-user',
                [types.principal(wallet1.address)],
                wallet2.address
            )
        ]);
        
        // Should fail with ERR-NOT-AUTHORIZED (u100)
        block.receipts[0].result.expectErr(types.uint(100));
    }
});
