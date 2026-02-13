;; SNOZ Rewards Engine Contract
;; title: snoz-rewards-engine
;; version: 1.0.0
;; summary: Integrates SNOZ utility token with STX activities on SNOZCOIN platform
;; description: Automatically mints SNOZ rewards for tipping, content purchases, milestones, and engagement.
;;              STX remains the ONLY monetary currency. SNOZ is purely for utility.

;; ============================================
;; CONSTANTS
;; ============================================

;; Contract deployer (admin)
(define-constant CONTRACT_OWNER tx-sender)

;; Error codes
(define-constant ERR_NOT_AUTHORIZED (err u500))
(define-constant ERR_PAUSED (err u501))
(define-constant ERR_INVALID_AMOUNT (err u502))
(define-constant ERR_USER_NOT_FOUND (err u503))
(define-constant ERR_MILESTONE_NOT_FOUND (err u504))
(define-constant ERR_MILESTONE_ALREADY_CLAIMED (err u505))
(define-constant ERR_MILESTONE_NOT_REACHED (err u506))
(define-constant ERR_INVALID_RATE (err u507))
(define-constant ERR_COOLDOWN_ACTIVE (err u508))

;; ============================================
;; REWARD RATES (Configurable)
;; All amounts in microSNOZ (6 decimals)
;; ============================================

;; Base rate: 1 STX tipped = 2 SNOZ (2,000,000 microSNOZ)
(define-constant DEFAULT_TIP_REWARD_RATE u2000000)

;; Content purchase reward: 1 STX = 1.5 SNOZ
(define-constant DEFAULT_CONTENT_REWARD_RATE u1500000)

;; First-time supporter bonus: 10 SNOZ
(define-constant DEFAULT_FIRST_TIP_BONUS u10000000)

;; Monthly supporter bonus: 50 SNOZ
(define-constant DEFAULT_MONTHLY_BONUS u50000000)

;; Creator registration bonus: 100 SNOZ
(define-constant DEFAULT_CREATOR_BONUS u100000000)

;; Creator milestone rewards (in SNOZ)
(define-constant MILESTONE_10_SUPPORTERS u200000000)    ;; 200 SNOZ
(define-constant MILESTONE_50_SUPPORTERS u500000000)    ;; 500 SNOZ
(define-constant MILESTONE_100_SUPPORTERS u1000000000)  ;; 1000 SNOZ
(define-constant MILESTONE_500_SUPPORTERS u5000000000)  ;; 5000 SNOZ
(define-constant MILESTONE_1000_SUPPORTERS u10000000000) ;; 10000 SNOZ

;; Supporter tier thresholds (in microSNOZ)
(define-constant TIER_BRONZE u0)
(define-constant TIER_SILVER u100000000)      ;; 100 SNOZ
(define-constant TIER_GOLD u500000000)        ;; 500 SNOZ
(define-constant TIER_PLATINUM u2000000000)   ;; 2000 SNOZ
(define-constant TIER_DIAMOND u10000000000)   ;; 10000 SNOZ

;; Cooldown for bonus claims (blocks, ~24 hours)
(define-constant BONUS_COOLDOWN u144)

;; Monthly blocks (~30 days)
(define-constant MONTHLY_BLOCKS u4320)

;; ============================================
;; DATA VARIABLES
;; ============================================

;; Contract pause state
(define-data-var contract-paused bool false)

;; Configurable rates
(define-data-var tip-reward-rate uint DEFAULT_TIP_REWARD_RATE)
(define-data-var content-reward-rate uint DEFAULT_CONTENT_REWARD_RATE)
(define-data-var first-tip-bonus uint DEFAULT_FIRST_TIP_BONUS)
(define-data-var monthly-bonus uint DEFAULT_MONTHLY_BONUS)
(define-data-var creator-bonus uint DEFAULT_CREATOR_BONUS)

;; Stats
(define-data-var total-snoz-distributed uint u0)
(define-data-var total-rewards-claimed uint u0)
(define-data-var total-milestones-achieved uint u0)

;; ============================================
;; DATA MAPS
;; ============================================

;; User reward profiles
(define-map user-reward-profiles
  { user: principal }
  {
    total-snoz-earned: uint,
    tips-rewarded: uint,
    content-purchases-rewarded: uint,
    bonuses-claimed: uint,
    current-tier: uint,
    first-activity-at: uint,
    last-activity-at: uint,
    monthly-tip-count: uint,
    monthly-start-block: uint,
    is-creator: bool
  }
)

;; Creator profiles for milestone tracking
(define-map creator-reward-profiles
  { creator: principal }
  {
    total-snoz-earned: uint,
    unique-supporters: uint,
    milestone-10-claimed: bool,
    milestone-50-claimed: bool,
    milestone-100-claimed: bool,
    milestone-500-claimed: bool,
    milestone-1000-claimed: bool,
    registered-at: uint
  }
)

;; Supporter tracking per creator (for milestone calculation)
(define-map creator-supporters
  { creator: principal, supporter: principal }
  { first-support-at: uint, total-support-count: uint }
)

;; User bonus claims tracking
(define-map user-bonus-claims
  { user: principal }
  {
    last-monthly-claim: uint,
    monthly-claims-count: uint,
    last-bonus-claim: uint
  }
)

;; Reward history
(define-map reward-history
  { reward-id: uint }
  {
    user: principal,
    reward-type: (string-ascii 32),
    amount: uint,
    timestamp: uint,
    related-tx: (optional uint)
  }
)

;; Reward ID counter
(define-data-var reward-id-counter uint u0)

;; Authorized contracts that can trigger rewards
(define-map authorized-contracts
  { contract: principal }
  { is-authorized: bool, added-at: uint }
)

;; ============================================
;; AUTHORIZATION
;; ============================================

;; Check if caller is admin
(define-read-only (is-admin (account principal))
  (is-eq account CONTRACT_OWNER)
)

;; Check if contract is authorized
(define-read-only (is-authorized-contract (contract principal))
  (default-to false (get is-authorized (map-get? authorized-contracts { contract: contract })))
)

;; Check if caller can trigger rewards
(define-read-only (can-trigger-rewards (caller principal))
  (or (is-admin caller) (is-authorized-contract caller))
)

;; Authorize contract (admin only)
(define-public (authorize-contract (contract principal))
  (begin
    (asserts! (is-admin tx-sender) ERR_NOT_AUTHORIZED)
    (map-set authorized-contracts
      { contract: contract }
      { is-authorized: true, added-at: stacks-block-height }
    )
    (print { event: "contract-authorized", contract: contract })
    (ok true)
  )
)

;; Revoke contract authorization (admin only)
(define-public (revoke-contract-authorization (contract principal))
  (begin
    (asserts! (is-admin tx-sender) ERR_NOT_AUTHORIZED)
    (map-set authorized-contracts
      { contract: contract }
      { is-authorized: false, added-at: u0 }
    )
    (print { event: "contract-revoked", contract: contract })
    (ok true)
  )
)

;; ============================================
;; REWARD FUNCTIONS
;; ============================================

;; Reward for tipping a creator (called by tipping contract or admin)
(define-public (reward-for-tip (supporter principal) (creator principal) (stx-amount uint))
  (let (
    (snoz-reward (calculate-tip-reward stx-amount))
    (supporter-profile (get-or-create-profile supporter))
    (creator-profile (get-or-create-creator-profile creator))
    (is-first-support (is-none (map-get? creator-supporters { creator: creator, supporter: supporter })))
  )
    ;; Authorization check
    (asserts! (not (var-get contract-paused)) ERR_PAUSED)
    (asserts! (can-trigger-rewards tx-sender) ERR_NOT_AUTHORIZED)
    (asserts! (> stx-amount u0) ERR_INVALID_AMOUNT)
    
    ;; Record supporter relationship
    (if is-first-support
      (begin
        ;; New unique supporter - update creator profile
        (map-set creator-supporters
          { creator: creator, supporter: supporter }
          { first-support-at: stacks-block-height, total-support-count: u1 }
        )
        (map-set creator-reward-profiles
          { creator: creator }
          (merge creator-profile { unique-supporters: (+ (get unique-supporters creator-profile) u1) })
        )
        true
      )
      (let (
        (existing-support (unwrap-panic (map-get? creator-supporters { creator: creator, supporter: supporter })))
      )
        (map-set creator-supporters
          { creator: creator, supporter: supporter }
          (merge existing-support { total-support-count: (+ (get total-support-count existing-support) u1) })
        )
        true
      )
    )
    
    ;; Give first-time supporter bonus if applicable
    (if is-first-support
      (begin (mint-snoz-reward supporter (var-get first-tip-bonus) "first-tip-bonus") true)
      true
    )
    
    ;; Mint SNOZ reward
    (mint-snoz-reward supporter snoz-reward "tip-reward")
    
    ;; Update supporter profile
    (update-user-profile supporter snoz-reward u1 u0)
    
    ;; Log event
    (print {
      event: "tip-reward-issued",
      supporter: supporter,
      creator: creator,
      stx-amount: stx-amount,
      snoz-reward: snoz-reward
    })
    
    (ok snoz-reward)
  )
)

;; Reward for content purchase
(define-public (reward-for-content-purchase (buyer principal) (creator principal) (stx-amount uint))
  (let (
    (snoz-reward (calculate-content-reward stx-amount))
  )
    ;; Authorization check
    (asserts! (not (var-get contract-paused)) ERR_PAUSED)
    (asserts! (can-trigger-rewards tx-sender) ERR_NOT_AUTHORIZED)
    (asserts! (> stx-amount u0) ERR_INVALID_AMOUNT)
    
    ;; Initialize profile if needed
    (get-or-create-profile buyer)
    
    ;; Mint SNOZ reward
    (mint-snoz-reward buyer snoz-reward "content-purchase-reward")
    
    ;; Update buyer profile
    (update-user-profile buyer snoz-reward u0 u1)
    
    ;; Log event
    (print {
      event: "content-reward-issued",
      buyer: buyer,
      creator: creator,
      stx-amount: stx-amount,
      snoz-reward: snoz-reward
    })
    
    (ok snoz-reward)
  )
)

;; Reward creator for registration
(define-public (reward-creator-registration (creator principal))
  (let (
    (snoz-reward (var-get creator-bonus))
  )
    ;; Authorization check
    (asserts! (not (var-get contract-paused)) ERR_PAUSED)
    (asserts! (can-trigger-rewards tx-sender) ERR_NOT_AUTHORIZED)
    
    ;; Initialize creator profile
    (map-set creator-reward-profiles
      { creator: creator }
      {
        total-snoz-earned: snoz-reward,
        unique-supporters: u0,
        milestone-10-claimed: false,
        milestone-50-claimed: false,
        milestone-100-claimed: false,
        milestone-500-claimed: false,
        milestone-1000-claimed: false,
        registered-at: stacks-block-height
      }
    )
    
    ;; Mark as creator in user profile
    (let ((profile (get-or-create-profile creator)))
      (map-set user-reward-profiles
        { user: creator }
        (merge profile { is-creator: true })
      )
    )
    
    ;; Mint SNOZ reward
    (mint-snoz-reward creator snoz-reward "creator-registration-bonus")
    
    ;; Log event
    (print {
      event: "creator-registration-reward",
      creator: creator,
      snoz-reward: snoz-reward
    })
    
    (ok snoz-reward)
  )
)

;; Claim monthly supporter bonus
(define-public (claim-monthly-bonus)
  (let (
    (profile (get-or-create-profile tx-sender))
    (bonus-claims (default-to 
      { last-monthly-claim: u0, monthly-claims-count: u0, last-bonus-claim: u0 }
      (map-get? user-bonus-claims { user: tx-sender })
    ))
    (monthly-tips (get monthly-tip-count profile))
    (snoz-reward (var-get monthly-bonus))
  )
    ;; Authorization check
    (asserts! (not (var-get contract-paused)) ERR_PAUSED)
    
    ;; Check eligibility: must have tipped at least 5 times this month
    (asserts! (>= monthly-tips u5) ERR_MILESTONE_NOT_REACHED)
    
    ;; Check cooldown (one claim per month)
    (asserts! 
      (>= stacks-block-height (+ (get last-monthly-claim bonus-claims) MONTHLY_BLOCKS))
      ERR_COOLDOWN_ACTIVE
    )
    
    ;; Update bonus claims
    (map-set user-bonus-claims
      { user: tx-sender }
      {
        last-monthly-claim: stacks-block-height,
        monthly-claims-count: (+ (get monthly-claims-count bonus-claims) u1),
        last-bonus-claim: stacks-block-height
      }
    )
    
    ;; Reset monthly tip count
    (map-set user-reward-profiles
      { user: tx-sender }
      (merge profile { monthly-tip-count: u0, monthly-start-block: stacks-block-height })
    )
    
    ;; Mint bonus
    (mint-snoz-reward tx-sender snoz-reward "monthly-bonus")
    
    ;; Log event
    (print {
      event: "monthly-bonus-claimed",
      user: tx-sender,
      snoz-reward: snoz-reward,
      tips-this-month: monthly-tips
    })
    
    (ok snoz-reward)
  )
)

;; Claim creator milestone reward
(define-public (claim-creator-milestone (milestone uint))
  (let (
    (creator-profile (unwrap! (map-get? creator-reward-profiles { creator: tx-sender }) ERR_USER_NOT_FOUND))
    (supporters (get unique-supporters creator-profile))
  )
    ;; Authorization check
    (asserts! (not (var-get contract-paused)) ERR_PAUSED)
    
    ;; Process milestone claim
    (if (is-eq milestone u10)
      (begin
        (asserts! (>= supporters u10) ERR_MILESTONE_NOT_REACHED)
        (asserts! (not (get milestone-10-claimed creator-profile)) ERR_MILESTONE_ALREADY_CLAIMED)
        (map-set creator-reward-profiles
          { creator: tx-sender }
          (merge creator-profile { 
            milestone-10-claimed: true,
            total-snoz-earned: (+ (get total-snoz-earned creator-profile) MILESTONE_10_SUPPORTERS)
          })
        )
        (mint-snoz-reward tx-sender MILESTONE_10_SUPPORTERS "milestone-10-supporters")
        (var-set total-milestones-achieved (+ (var-get total-milestones-achieved) u1))
        (ok MILESTONE_10_SUPPORTERS)
      )
      (if (is-eq milestone u50)
        (begin
          (asserts! (>= supporters u50) ERR_MILESTONE_NOT_REACHED)
          (asserts! (not (get milestone-50-claimed creator-profile)) ERR_MILESTONE_ALREADY_CLAIMED)
          (map-set creator-reward-profiles
            { creator: tx-sender }
            (merge creator-profile { 
              milestone-50-claimed: true,
              total-snoz-earned: (+ (get total-snoz-earned creator-profile) MILESTONE_50_SUPPORTERS)
            })
          )
          (mint-snoz-reward tx-sender MILESTONE_50_SUPPORTERS "milestone-50-supporters")
          (var-set total-milestones-achieved (+ (var-get total-milestones-achieved) u1))
          (ok MILESTONE_50_SUPPORTERS)
        )
        (if (is-eq milestone u100)
          (begin
            (asserts! (>= supporters u100) ERR_MILESTONE_NOT_REACHED)
            (asserts! (not (get milestone-100-claimed creator-profile)) ERR_MILESTONE_ALREADY_CLAIMED)
            (map-set creator-reward-profiles
              { creator: tx-sender }
              (merge creator-profile { 
                milestone-100-claimed: true,
                total-snoz-earned: (+ (get total-snoz-earned creator-profile) MILESTONE_100_SUPPORTERS)
              })
            )
            (mint-snoz-reward tx-sender MILESTONE_100_SUPPORTERS "milestone-100-supporters")
            (var-set total-milestones-achieved (+ (var-get total-milestones-achieved) u1))
            (ok MILESTONE_100_SUPPORTERS)
          )
          (if (is-eq milestone u500)
            (begin
              (asserts! (>= supporters u500) ERR_MILESTONE_NOT_REACHED)
              (asserts! (not (get milestone-500-claimed creator-profile)) ERR_MILESTONE_ALREADY_CLAIMED)
              (map-set creator-reward-profiles
                { creator: tx-sender }
                (merge creator-profile { 
                  milestone-500-claimed: true,
                  total-snoz-earned: (+ (get total-snoz-earned creator-profile) MILESTONE_500_SUPPORTERS)
                })
              )
              (mint-snoz-reward tx-sender MILESTONE_500_SUPPORTERS "milestone-500-supporters")
              (var-set total-milestones-achieved (+ (var-get total-milestones-achieved) u1))
              (ok MILESTONE_500_SUPPORTERS)
            )
            (if (is-eq milestone u1000)
              (begin
                (asserts! (>= supporters u1000) ERR_MILESTONE_NOT_REACHED)
                (asserts! (not (get milestone-1000-claimed creator-profile)) ERR_MILESTONE_ALREADY_CLAIMED)
                (map-set creator-reward-profiles
                  { creator: tx-sender }
                  (merge creator-profile { 
                    milestone-1000-claimed: true,
                    total-snoz-earned: (+ (get total-snoz-earned creator-profile) MILESTONE_1000_SUPPORTERS)
                  })
                )
                (mint-snoz-reward tx-sender MILESTONE_1000_SUPPORTERS "milestone-1000-supporters")
                (var-set total-milestones-achieved (+ (var-get total-milestones-achieved) u1))
                (ok MILESTONE_1000_SUPPORTERS)
              )
              ERR_MILESTONE_NOT_FOUND
            )
          )
        )
      )
    )
  )
)

;; ============================================
;; INTERNAL FUNCTIONS
;; ============================================

;; Mint SNOZ reward (records reward and emits event)
(define-private (mint-snoz-reward (recipient principal) (amount uint) (reward-type (string-ascii 32)))
  (let (
    (reward-id (var-get reward-id-counter))
  )
    ;; Record reward history
    (map-set reward-history
      { reward-id: reward-id }
      {
        user: recipient,
        reward-type: reward-type,
        amount: amount,
        timestamp: stacks-block-height,
        related-tx: none
      }
    )
    (var-set reward-id-counter (+ reward-id u1))
    
    ;; Update stats
    (var-set total-snoz-distributed (+ (var-get total-snoz-distributed) amount))
    (var-set total-rewards-claimed (+ (var-get total-rewards-claimed) u1))
    
    ;; Note: In production, this would call the snoz-token contract:
    ;; (contract-call? .snoz-token mint amount recipient)
    ;; For now, we emit an event that can be processed
    (print {
      event: "snoz-mint-request",
      recipient: recipient,
      amount: amount,
      reward-type: reward-type,
      reward-id: reward-id
    })
    
    ;; Return amount minted
    amount
  )
)

;; Calculate tip reward
(define-private (calculate-tip-reward (stx-amount uint))
  ;; stx-amount is in microSTX, rate is SNOZ per STX
  ;; (stx-amount / 1,000,000) * tip-reward-rate
  (/ (* stx-amount (var-get tip-reward-rate)) u1000000)
)

;; Calculate content purchase reward
(define-private (calculate-content-reward (stx-amount uint))
  (/ (* stx-amount (var-get content-reward-rate)) u1000000)
)

;; Get or create user profile
(define-private (get-or-create-profile (user principal))
  (match (map-get? user-reward-profiles { user: user })
    existing existing
    (let (
      (new-profile {
        total-snoz-earned: u0,
        tips-rewarded: u0,
        content-purchases-rewarded: u0,
        bonuses-claimed: u0,
        current-tier: u0,
        first-activity-at: stacks-block-height,
        last-activity-at: stacks-block-height,
        monthly-tip-count: u0,
        monthly-start-block: stacks-block-height,
        is-creator: false
      })
    )
      (map-set user-reward-profiles { user: user } new-profile)
      new-profile
    )
  )
)

;; Get or create creator profile
(define-private (get-or-create-creator-profile (creator principal))
  (match (map-get? creator-reward-profiles { creator: creator })
    existing existing
    (let (
      (new-profile {
        total-snoz-earned: u0,
        unique-supporters: u0,
        milestone-10-claimed: false,
        milestone-50-claimed: false,
        milestone-100-claimed: false,
        milestone-500-claimed: false,
        milestone-1000-claimed: false,
        registered-at: stacks-block-height
      })
    )
      (map-set creator-reward-profiles { creator: creator } new-profile)
      new-profile
    )
  )
)

;; Update user profile after reward
(define-private (update-user-profile (user principal) (snoz-earned uint) (tips-count uint) (purchases-count uint))
  (let (
    (profile (get-or-create-profile user))
    (new-total (+ (get total-snoz-earned profile) snoz-earned))
    (new-tier (calculate-tier new-total))
  )
    (map-set user-reward-profiles
      { user: user }
      (merge profile {
        total-snoz-earned: new-total,
        tips-rewarded: (+ (get tips-rewarded profile) tips-count),
        content-purchases-rewarded: (+ (get content-purchases-rewarded profile) purchases-count),
        current-tier: new-tier,
        last-activity-at: stacks-block-height,
        monthly-tip-count: (+ (get monthly-tip-count profile) tips-count)
      })
    )
    true
  )
)

;; Calculate tier based on total SNOZ earned
(define-private (calculate-tier (total-snoz uint))
  (if (>= total-snoz TIER_DIAMOND)
    u4
    (if (>= total-snoz TIER_PLATINUM)
      u3
      (if (>= total-snoz TIER_GOLD)
        u2
        (if (>= total-snoz TIER_SILVER)
          u1
          u0
        )
      )
    )
  )
)

;; ============================================
;; ADMIN FUNCTIONS
;; ============================================

;; Update reward rates
(define-public (set-tip-reward-rate (new-rate uint))
  (begin
    (asserts! (is-admin tx-sender) ERR_NOT_AUTHORIZED)
    (asserts! (> new-rate u0) ERR_INVALID_RATE)
    (var-set tip-reward-rate new-rate)
    (print { event: "tip-reward-rate-updated", new-rate: new-rate })
    (ok true)
  )
)

(define-public (set-content-reward-rate (new-rate uint))
  (begin
    (asserts! (is-admin tx-sender) ERR_NOT_AUTHORIZED)
    (asserts! (> new-rate u0) ERR_INVALID_RATE)
    (var-set content-reward-rate new-rate)
    (print { event: "content-reward-rate-updated", new-rate: new-rate })
    (ok true)
  )
)

(define-public (set-first-tip-bonus (new-bonus uint))
  (begin
    (asserts! (is-admin tx-sender) ERR_NOT_AUTHORIZED)
    (var-set first-tip-bonus new-bonus)
    (print { event: "first-tip-bonus-updated", new-bonus: new-bonus })
    (ok true)
  )
)

(define-public (set-monthly-bonus (new-bonus uint))
  (begin
    (asserts! (is-admin tx-sender) ERR_NOT_AUTHORIZED)
    (var-set monthly-bonus new-bonus)
    (print { event: "monthly-bonus-updated", new-bonus: new-bonus })
    (ok true)
  )
)

(define-public (set-creator-bonus (new-bonus uint))
  (begin
    (asserts! (is-admin tx-sender) ERR_NOT_AUTHORIZED)
    (var-set creator-bonus new-bonus)
    (print { event: "creator-bonus-updated", new-bonus: new-bonus })
    (ok true)
  )
)

;; Pause/unpause
(define-public (pause)
  (begin
    (asserts! (is-admin tx-sender) ERR_NOT_AUTHORIZED)
    (var-set contract-paused true)
    (print { event: "contract-paused" })
    (ok true)
  )
)

(define-public (unpause)
  (begin
    (asserts! (is-admin tx-sender) ERR_NOT_AUTHORIZED)
    (var-set contract-paused false)
    (print { event: "contract-unpaused" })
    (ok true)
  )
)

;; ============================================
;; READ-ONLY FUNCTIONS
;; ============================================

;; Get user profile
(define-read-only (get-user-profile (user principal))
  (map-get? user-reward-profiles { user: user })
)

;; Get creator profile
(define-read-only (get-creator-profile (creator principal))
  (map-get? creator-reward-profiles { creator: creator })
)

;; Get supporter relationship
(define-read-only (get-supporter-info (creator principal) (supporter principal))
  (map-get? creator-supporters { creator: creator, supporter: supporter })
)

;; Get user tier name
(define-read-only (get-tier-name (tier uint))
  (if (is-eq tier u4)
    "Diamond"
    (if (is-eq tier u3)
      "Platinum"
      (if (is-eq tier u2)
        "Gold"
        (if (is-eq tier u1)
          "Silver"
          "Bronze"
        )
      )
    )
  )
)

;; Get reward rates
(define-read-only (get-reward-rates)
  {
    tip-reward-rate: (var-get tip-reward-rate),
    content-reward-rate: (var-get content-reward-rate),
    first-tip-bonus: (var-get first-tip-bonus),
    monthly-bonus: (var-get monthly-bonus),
    creator-bonus: (var-get creator-bonus)
  }
)

;; Get contract stats
(define-read-only (get-stats)
  {
    total-snoz-distributed: (var-get total-snoz-distributed),
    total-rewards-claimed: (var-get total-rewards-claimed),
    total-milestones-achieved: (var-get total-milestones-achieved),
    is-paused: (var-get contract-paused)
  }
)

;; Get reward history entry
(define-read-only (get-reward-entry (reward-id uint))
  (map-get? reward-history { reward-id: reward-id })
)

;; Calculate potential tip reward
(define-read-only (preview-tip-reward (stx-amount uint))
  (calculate-tip-reward stx-amount)
)

;; Calculate potential content reward
(define-read-only (preview-content-reward (stx-amount uint))
  (calculate-content-reward stx-amount)
)

;; Check monthly bonus eligibility
(define-read-only (check-monthly-bonus-eligibility (user principal))
  (let (
    (profile (map-get? user-reward-profiles { user: user }))
    (bonus-claims (map-get? user-bonus-claims { user: user }))
  )
    (match profile
      p (match bonus-claims
          b {
            eligible: (and 
              (>= (get monthly-tip-count p) u5)
              (>= stacks-block-height (+ (get last-monthly-claim b) MONTHLY_BLOCKS))
            ),
            tips-this-month: (get monthly-tip-count p),
            tips-required: u5,
            blocks-until-eligible: (if (>= stacks-block-height (+ (get last-monthly-claim b) MONTHLY_BLOCKS))
              u0
              (- (+ (get last-monthly-claim b) MONTHLY_BLOCKS) stacks-block-height)
            )
          }
          {
            eligible: (>= (get monthly-tip-count p) u5),
            tips-this-month: (get monthly-tip-count p),
            tips-required: u5,
            blocks-until-eligible: u0
          }
        )
      {
        eligible: false,
        tips-this-month: u0,
        tips-required: u5,
        blocks-until-eligible: u0
      }
    )
  )
)

;; Check creator milestone eligibility
(define-read-only (check-milestone-eligibility (creator principal))
  (match (map-get? creator-reward-profiles { creator: creator })
    profile {
      supporters: (get unique-supporters profile),
      milestone-10: {
        reached: (>= (get unique-supporters profile) u10),
        claimed: (get milestone-10-claimed profile),
        reward: MILESTONE_10_SUPPORTERS
      },
      milestone-50: {
        reached: (>= (get unique-supporters profile) u50),
        claimed: (get milestone-50-claimed profile),
        reward: MILESTONE_50_SUPPORTERS
      },
      milestone-100: {
        reached: (>= (get unique-supporters profile) u100),
        claimed: (get milestone-100-claimed profile),
        reward: MILESTONE_100_SUPPORTERS
      },
      milestone-500: {
        reached: (>= (get unique-supporters profile) u500),
        claimed: (get milestone-500-claimed profile),
        reward: MILESTONE_500_SUPPORTERS
      },
      milestone-1000: {
        reached: (>= (get unique-supporters profile) u1000),
        claimed: (get milestone-1000-claimed profile),
        reward: MILESTONE_1000_SUPPORTERS
      }
    }
    {
      supporters: u0,
      milestone-10: { reached: false, claimed: false, reward: MILESTONE_10_SUPPORTERS },
      milestone-50: { reached: false, claimed: false, reward: MILESTONE_50_SUPPORTERS },
      milestone-100: { reached: false, claimed: false, reward: MILESTONE_100_SUPPORTERS },
      milestone-500: { reached: false, claimed: false, reward: MILESTONE_500_SUPPORTERS },
      milestone-1000: { reached: false, claimed: false, reward: MILESTONE_1000_SUPPORTERS }
    }
  )
)
