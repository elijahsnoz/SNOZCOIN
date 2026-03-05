use anchor_lang::prelude::*;

declare_id!("6yaFWYmbsPnFQVXBP555fQ1khFrHnvZAnrKQNBLuwFzF");

#[program]
pub mod snozcoin_profiles {
    use super::*;

    /// Register a new user profile
    pub fn register_profile(
        ctx: Context<RegisterProfile>,
        username: String,
        country: String,
        user_type: u8,
        avatar_seed: String,
    ) -> Result<()> {
        // Validate inputs
        require!(username.len() >= 3 && username.len() <= 20, ProfileError::InvalidUsername);
        require!(country.len() == 3, ProfileError::InvalidCountry);
        require!(user_type >= 1 && user_type <= 4, ProfileError::InvalidUserType);
        require!(avatar_seed.len() <= 50, ProfileError::InvalidAvatarSeed);

        let profile = &mut ctx.accounts.profile;
        let clock = Clock::get()?;

        profile.owner = ctx.accounts.user.key();
        profile.username = username;
        profile.country = country;
        profile.user_type = user_type;
        profile.avatar_seed = avatar_seed;
        profile.ipfs_hash = String::new();
        profile.created_at = clock.unix_timestamp;
        profile.updated_at = clock.unix_timestamp;
        profile.is_verified = false;
        profile.bump = ctx.bumps.profile;

        emit!(ProfileCreated {
            owner: profile.owner,
            username: profile.username.clone(),
            user_type: profile.user_type,
            timestamp: clock.unix_timestamp,
        });

        Ok(())
    }

    /// Update an existing profile
    pub fn update_profile(
        ctx: Context<UpdateProfile>,
        country: String,
        user_type: u8,
        avatar_seed: String,
    ) -> Result<()> {
        require!(country.len() == 3, ProfileError::InvalidCountry);
        require!(user_type >= 1 && user_type <= 4, ProfileError::InvalidUserType);
        require!(avatar_seed.len() <= 50, ProfileError::InvalidAvatarSeed);

        let profile = &mut ctx.accounts.profile;
        let clock = Clock::get()?;

        profile.country = country;
        profile.user_type = user_type;
        profile.avatar_seed = avatar_seed;
        profile.updated_at = clock.unix_timestamp;

        emit!(ProfileUpdated {
            owner: profile.owner,
            timestamp: clock.unix_timestamp,
        });

        Ok(())
    }

    /// Update IPFS hash for extended profile data
    pub fn update_ipfs_hash(
        ctx: Context<UpdateProfile>,
        ipfs_hash: String,
    ) -> Result<()> {
        require!(ipfs_hash.len() <= 64, ProfileError::InvalidIpfsHash);

        let profile = &mut ctx.accounts.profile;
        let clock = Clock::get()?;

        profile.ipfs_hash = ipfs_hash;
        profile.updated_at = clock.unix_timestamp;

        Ok(())
    }

    /// Verify a user (admin only)
    pub fn verify_user(ctx: Context<AdminAction>) -> Result<()> {
        let profile = &mut ctx.accounts.profile;
        let clock = Clock::get()?;

        profile.is_verified = true;
        profile.updated_at = clock.unix_timestamp;

        emit!(UserVerified {
            owner: profile.owner,
            timestamp: clock.unix_timestamp,
        });

        Ok(())
    }

    /// Unverify a user (admin only)
    pub fn unverify_user(ctx: Context<AdminAction>) -> Result<()> {
        let profile = &mut ctx.accounts.profile;
        let clock = Clock::get()?;

        profile.is_verified = false;
        profile.updated_at = clock.unix_timestamp;

        Ok(())
    }
}

// ============================================
// ACCOUNTS
// ============================================

#[derive(Accounts)]
#[instruction(username: String)]
pub struct RegisterProfile<'info> {
    #[account(
        init,
        payer = user,
        space = 8 + Profile::INIT_SPACE,
        seeds = [b"profile", user.key().as_ref()],
        bump
    )]
    pub profile: Account<'info, Profile>,
    
    #[account(mut)]
    pub user: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct UpdateProfile<'info> {
    #[account(
        mut,
        seeds = [b"profile", user.key().as_ref()],
        bump = profile.bump,
        constraint = profile.owner == user.key() @ ProfileError::Unauthorized
    )]
    pub profile: Account<'info, Profile>,
    
    #[account(mut)]
    pub user: Signer<'info>,
}

#[derive(Accounts)]
pub struct AdminAction<'info> {
    #[account(
        mut,
        seeds = [b"profile", profile.owner.as_ref()],
        bump = profile.bump
    )]
    pub profile: Account<'info, Profile>,
    
    #[account(
        constraint = admin.key().to_string() == "D4xVCAdzQ614QKerboeUAtBYFwa3xXX97wgoUiQqExRb" @ ProfileError::Unauthorized
    )]
    pub admin: Signer<'info>,
}

// ============================================
// STATE
// ============================================

#[account]
#[derive(InitSpace)]
pub struct Profile {
    pub owner: Pubkey,                    // 32 bytes
    #[max_len(20)]
    pub username: String,                 // 4 + 20 = 24 bytes
    #[max_len(3)]
    pub country: String,                  // 4 + 3 = 7 bytes
    pub user_type: u8,                    // 1 byte (1=creator, 2=supporter, 3=corporate, 4=investor)
    #[max_len(50)]
    pub avatar_seed: String,              // 4 + 50 = 54 bytes
    #[max_len(64)]
    pub ipfs_hash: String,                // 4 + 64 = 68 bytes
    pub created_at: i64,                  // 8 bytes
    pub updated_at: i64,                  // 8 bytes
    pub is_verified: bool,                // 1 byte
    pub bump: u8,                         // 1 byte
}

// ============================================
// EVENTS
// ============================================

#[event]
pub struct ProfileCreated {
    pub owner: Pubkey,
    pub username: String,
    pub user_type: u8,
    pub timestamp: i64,
}

#[event]
pub struct ProfileUpdated {
    pub owner: Pubkey,
    pub timestamp: i64,
}

#[event]
pub struct UserVerified {
    pub owner: Pubkey,
    pub timestamp: i64,
}

// ============================================
// ERRORS
// ============================================

#[error_code]
pub enum ProfileError {
    #[msg("Username must be between 3 and 20 characters")]
    InvalidUsername,
    #[msg("Country code must be exactly 3 characters")]
    InvalidCountry,
    #[msg("User type must be between 1 and 4")]
    InvalidUserType,
    #[msg("Avatar seed must be 50 characters or less")]
    InvalidAvatarSeed,
    #[msg("IPFS hash must be 64 characters or less")]
    InvalidIpfsHash,
    #[msg("You are not authorized to perform this action")]
    Unauthorized,
}

