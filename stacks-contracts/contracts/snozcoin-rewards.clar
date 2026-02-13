;; SNOZCOIN Community Rewards Contract
;; title: snozcoin-rewards
;; version: 1.0.0
;; summary: Reward active supporters with points, badges, and community recognition
;; description: Track engagement, award points, enable leaderboards, and prepare for DAO governance

;; ============================================
;; CONSTANTS
;; ============================================

;; Contract deployer (admin)
(define-constant CONTRACT_OWNER tx-sender)

;; Error codes
(define-constant ERR_NOT_AUTHORIZED (err u300))
(define-constant ERR_INVALID_POINTS (err u301))
(define-constant ERR_USER_NOT_FOUND (err u302))
(define-constant ERR_BADGE_NOT_FOUND (err u303))
(define-constant ERR_BADGE_ALREADY_AWARDED (err u304))
(define-constant ERR_CONTRACT_PAUSED (err u305))
(define-constant ERR_INVALID_NAME (err u306))
(define-constant ERR_BADGE_EXISTS (err u307))
(define-constant ERR_INSUFFICIENT_POINTS (err u308))
(define-constant ERR_REWARD_NOT_FOUND (err u309))
(define-constant ERR_REWARD_INACTIVE (err u310))
(define-constant ERR_ALREADY_CLAIMED (err u311))

;; Point values for different actions
(define-constant POINTS_TIP_SENT u10)
(define-constant POINTS_CONTENT_PURCHASED u25)
(define-constant POINTS_FIRST_TIP u50)
(define-constant POINTS_CREATOR_REGISTERED u100)

;; Badge tiers
(define-constant BADGE_TIER_BRONZE u1)
(define-constant BADGE_TIER_SILVER u2)
(define-constant BADGE_TIER_GOLD u3)
(define-constant BADGE_TIER_PLATINUM u4)
(define-constant BADGE_TIER_DIAMOND u5)

;; ============================================
;; DATA VARIABLES
;; ============================================

;; Contract pause state
(define-data-var contract-paused bool false)

;; Badge ID counter
(define-data-var badge-id-counter uint u0)

;; Reward ID counter
(define-data-var reward-id-counter uint u0)

;; Total points distributed
(define-data-var total-points-distributed uint u0)

;; Total badges awarded
(define-data-var total-badges-awarded uint u0)

;; Total rewards claimed
(define-data-var total-rewards-claimed uint u0)

;; ============================================
;; DATA MAPS
;; ============================================

;; User profiles for rewards
(define-map user-profiles
  { user: principal }
  {
    total-points: uint,
    tips-sent: uint,
    content-purchased: uint,
    joined-at: uint,
    last-active: uint,
    badge-count: uint,
    tier: uint
  }
)

;; Badge definitions
(define-map badges
  { badge-id: uint }
  {
    name: (string-utf8 100),
    description: (string-utf8 500),
    tier: uint,
    points-required: uint,
    image-uri: (string-utf8 256),
    is-active: bool,
    total-awarded: uint,
    created-at: uint
  }
)

;; User badges
(define-map user-badges
  { user: principal, badge-id: uint }
  {
    awarded-at: uint,
    awarded-by: principal
  }
)

;; User badge count by ID for enumeration
(define-map user-badge-index
  { user: principal, index: uint }
  { badge-id: uint }
)

;; Claimable rewards
(define-map rewards
  { reward-id: uint }
  {
    name: (string-utf8 100),
    description: (string-utf8 500),
    points-cost: uint,
    stx-value: uint,
    total-supply: uint,
    claimed-count: uint,
    is-active: bool,
    created-at: uint
  }
)

;; User reward claims
(define-map user-reward-claims
  { user: principal, reward-id: uint }
  {
    claimed-at: uint
  }
)

;; Leaderboard tracking (simplified - top position tracking)
(define-map leaderboard-position
  { rank: uint }
  { user: principal, points: uint }
)

;; Authorized contracts that can award points
(define-map authorized-contracts
  { contract: principal }
  { is-authorized: bool }
)

;; ============================================
;; PRIVATE FUNCTIONS
;; ============================================

;; Check if caller is admin
(define-private (is-admin)
  (is-eq tx-sender CONTRACT_OWNER)
)

;; Check if contract is active
(define-private (is-contract-active)
  (not (var-get contract-paused))
)

;; Check if caller is authorized contract
(define-private (is-authorized-contract (caller principal))
  (let (
    (auth-data (map-get? authorized-contracts { contract: caller }))
  )
    (if (is-some auth-data)
      (get is-authorized (unwrap-panic auth-data))
      false
    )
  )
)

;; Calculate user tier based on points
(define-private (calculate-tier (points uint))
  (if (>= points u10000)
    BADGE_TIER_DIAMOND
    (if (>= points u5000)
      BADGE_TIER_PLATINUM
      (if (>= points u2000)
        BADGE_TIER_GOLD
        (if (>= points u500)
          BADGE_TIER_SILVER
          BADGE_TIER_BRONZE
        )
      )
    )
  )
)

;; ============================================
;; PUBLIC FUNCTIONS - USER REGISTRATION
;; ============================================

;; Register user for rewards
(define-public (register-user)
  (let (
    (caller tx-sender)
  )
    ;; Check contract is active
    (asserts! (is-contract-active) ERR_CONTRACT_PAUSED)
    ;; Check not already registered
    (asserts! (is-none (map-get? user-profiles { user: caller })) ERR_NOT_AUTHORIZED)
    
    ;; Create user profile
    (map-set user-profiles
      { user: caller }
      {
        total-points: u0,
        tips-sent: u0,
        content-purchased: u0,
        joined-at: stacks-block-height,
        last-active: stacks-block-height,
        badge-count: u0,
        tier: BADGE_TIER_BRONZE
      }
    )
    
    (print {
      event: "user-registered",
      user: caller,
      block: stacks-block-height
    })
    
    (ok true)
  )
)

;; ============================================
;; PUBLIC FUNCTIONS - POINT MANAGEMENT
;; ============================================

;; Award points to user (internal use or authorized contracts)
(define-public (award-points (user principal) (points uint) (reason (string-utf8 100)))
  (let (
    (caller tx-sender)
    (user-data (default-to 
      {
        total-points: u0,
        tips-sent: u0,
        content-purchased: u0,
        joined-at: stacks-block-height,
        last-active: stacks-block-height,
        badge-count: u0,
        tier: BADGE_TIER_BRONZE
      }
      (map-get? user-profiles { user: user })
    ))
    (new-points (+ (get total-points user-data) points))
    (new-tier (calculate-tier new-points))
  )
    ;; Check contract is active
    (asserts! (is-contract-active) ERR_CONTRACT_PAUSED)
    ;; Check caller is admin or authorized contract
    (asserts! (or (is-admin) (is-authorized-contract caller)) ERR_NOT_AUTHORIZED)
    ;; Check valid points
    (asserts! (> points u0) ERR_INVALID_POINTS)
    
    ;; Create/update user profile if needed
    (map-set user-profiles
      { user: user }
      (merge user-data {
        total-points: new-points,
        last-active: stacks-block-height,
        tier: new-tier
      })
    )
    
    ;; Update global stats
    (var-set total-points-distributed (+ (var-get total-points-distributed) points))
    
    (print {
      event: "points-awarded",
      user: user,
      points: points,
      new-total: new-points,
      reason: reason,
      tier: new-tier,
      block: stacks-block-height
    })
    
    (ok new-points)
  )
)

;; Record tip activity (awards points)
(define-public (record-tip-activity (user principal) (is-first-tip bool))
  (let (
    (caller tx-sender)
    (points-to-award (if is-first-tip (+ POINTS_TIP_SENT POINTS_FIRST_TIP) POINTS_TIP_SENT))
    (user-data (default-to 
      {
        total-points: u0,
        tips-sent: u0,
        content-purchased: u0,
        joined-at: stacks-block-height,
        last-active: stacks-block-height,
        badge-count: u0,
        tier: BADGE_TIER_BRONZE
      }
      (map-get? user-profiles { user: user })
    ))
    (new-points (+ (get total-points user-data) points-to-award))
    (new-tier (calculate-tier new-points))
  )
    ;; Check contract is active
    (asserts! (is-contract-active) ERR_CONTRACT_PAUSED)
    ;; Check caller is authorized
    (asserts! (or (is-admin) (is-authorized-contract caller)) ERR_NOT_AUTHORIZED)
    
    ;; Update user profile
    (map-set user-profiles
      { user: user }
      (merge user-data {
        total-points: new-points,
        tips-sent: (+ (get tips-sent user-data) u1),
        last-active: stacks-block-height,
        tier: new-tier
      })
    )
    
    ;; Update global stats
    (var-set total-points-distributed (+ (var-get total-points-distributed) points-to-award))
    
    (print {
      event: "tip-activity-recorded",
      user: user,
      points: points-to-award,
      is-first-tip: is-first-tip,
      block: stacks-block-height
    })
    
    (ok points-to-award)
  )
)

;; Record content purchase activity
(define-public (record-purchase-activity (user principal))
  (let (
    (caller tx-sender)
    (user-data (default-to 
      {
        total-points: u0,
        tips-sent: u0,
        content-purchased: u0,
        joined-at: stacks-block-height,
        last-active: stacks-block-height,
        badge-count: u0,
        tier: BADGE_TIER_BRONZE
      }
      (map-get? user-profiles { user: user })
    ))
    (new-points (+ (get total-points user-data) POINTS_CONTENT_PURCHASED))
    (new-tier (calculate-tier new-points))
  )
    ;; Check contract is active
    (asserts! (is-contract-active) ERR_CONTRACT_PAUSED)
    ;; Check caller is authorized
    (asserts! (or (is-admin) (is-authorized-contract caller)) ERR_NOT_AUTHORIZED)
    
    ;; Update user profile
    (map-set user-profiles
      { user: user }
      (merge user-data {
        total-points: new-points,
        content-purchased: (+ (get content-purchased user-data) u1),
        last-active: stacks-block-height,
        tier: new-tier
      })
    )
    
    ;; Update global stats
    (var-set total-points-distributed (+ (var-get total-points-distributed) POINTS_CONTENT_PURCHASED))
    
    (print {
      event: "purchase-activity-recorded",
      user: user,
      points: POINTS_CONTENT_PURCHASED,
      block: stacks-block-height
    })
    
    (ok POINTS_CONTENT_PURCHASED)
  )
)

;; ============================================
;; PUBLIC FUNCTIONS - BADGE MANAGEMENT
;; ============================================

;; Create new badge type (admin only)
(define-public (create-badge 
  (name (string-utf8 100))
  (description (string-utf8 500))
  (tier uint)
  (points-required uint)
  (image-uri (string-utf8 256)))
  (let (
    (new-badge-id (+ (var-get badge-id-counter) u1))
  )
    ;; Check admin
    (asserts! (is-admin) ERR_NOT_AUTHORIZED)
    ;; Check valid name
    (asserts! (> (len name) u0) ERR_INVALID_NAME)
    ;; Check valid tier
    (asserts! (and (>= tier BADGE_TIER_BRONZE) (<= tier BADGE_TIER_DIAMOND)) ERR_INVALID_POINTS)
    
    ;; Create badge
    (map-set badges
      { badge-id: new-badge-id }
      {
        name: name,
        description: description,
        tier: tier,
        points-required: points-required,
        image-uri: image-uri,
        is-active: true,
        total-awarded: u0,
        created-at: stacks-block-height
      }
    )
    
    ;; Increment counter
    (var-set badge-id-counter new-badge-id)
    
    (print {
      event: "badge-created",
      badge-id: new-badge-id,
      name: name,
      tier: tier,
      points-required: points-required,
      block: stacks-block-height
    })
    
    (ok new-badge-id)
  )
)

;; Award badge to user (admin only)
(define-public (award-badge (user principal) (badge-id uint))
  (let (
    (badge-data (unwrap! (map-get? badges { badge-id: badge-id }) ERR_BADGE_NOT_FOUND))
    (user-data (unwrap! (map-get? user-profiles { user: user }) ERR_USER_NOT_FOUND))
  )
    ;; Check admin
    (asserts! (is-admin) ERR_NOT_AUTHORIZED)
    ;; Check badge is active
    (asserts! (get is-active badge-data) ERR_BADGE_NOT_FOUND)
    ;; Check not already awarded
    (asserts! (is-none (map-get? user-badges { user: user, badge-id: badge-id })) ERR_BADGE_ALREADY_AWARDED)
    ;; Check user has enough points
    (asserts! (>= (get total-points user-data) (get points-required badge-data)) ERR_INSUFFICIENT_POINTS)
    
    ;; Award badge
    (map-set user-badges
      { user: user, badge-id: badge-id }
      {
        awarded-at: stacks-block-height,
        awarded-by: tx-sender
      }
    )
    
    ;; Update badge index for user
    (map-set user-badge-index
      { user: user, index: (get badge-count user-data) }
      { badge-id: badge-id }
    )
    
    ;; Update user badge count
    (map-set user-profiles
      { user: user }
      (merge user-data {
        badge-count: (+ (get badge-count user-data) u1)
      })
    )
    
    ;; Update badge stats
    (map-set badges
      { badge-id: badge-id }
      (merge badge-data {
        total-awarded: (+ (get total-awarded badge-data) u1)
      })
    )
    
    ;; Update global stats
    (var-set total-badges-awarded (+ (var-get total-badges-awarded) u1))
    
    (print {
      event: "badge-awarded",
      user: user,
      badge-id: badge-id,
      badge-name: (get name badge-data),
      tier: (get tier badge-data),
      block: stacks-block-height
    })
    
    (ok true)
  )
)

;; ============================================
;; PUBLIC FUNCTIONS - REWARD MANAGEMENT
;; ============================================

;; Create claimable reward (admin only)
(define-public (create-reward
  (name (string-utf8 100))
  (description (string-utf8 500))
  (points-cost uint)
  (stx-value uint)
  (total-supply uint))
  (let (
    (new-reward-id (+ (var-get reward-id-counter) u1))
  )
    ;; Check admin
    (asserts! (is-admin) ERR_NOT_AUTHORIZED)
    ;; Check valid name
    (asserts! (> (len name) u0) ERR_INVALID_NAME)
    ;; Check valid points cost
    (asserts! (> points-cost u0) ERR_INVALID_POINTS)
    
    ;; Create reward
    (map-set rewards
      { reward-id: new-reward-id }
      {
        name: name,
        description: description,
        points-cost: points-cost,
        stx-value: stx-value,
        total-supply: total-supply,
        claimed-count: u0,
        is-active: true,
        created-at: stacks-block-height
      }
    )
    
    ;; Increment counter
    (var-set reward-id-counter new-reward-id)
    
    (print {
      event: "reward-created",
      reward-id: new-reward-id,
      name: name,
      points-cost: points-cost,
      stx-value: stx-value,
      total-supply: total-supply,
      block: stacks-block-height
    })
    
    (ok new-reward-id)
  )
)

;; Claim reward (spend points for reward)
(define-public (claim-reward (reward-id uint))
  (let (
    (caller tx-sender)
    (reward-data (unwrap! (map-get? rewards { reward-id: reward-id }) ERR_REWARD_NOT_FOUND))
    (user-data (unwrap! (map-get? user-profiles { user: caller }) ERR_USER_NOT_FOUND))
    (points-cost (get points-cost reward-data))
  )
    ;; Check contract is active
    (asserts! (is-contract-active) ERR_CONTRACT_PAUSED)
    ;; Check reward is active
    (asserts! (get is-active reward-data) ERR_REWARD_INACTIVE)
    ;; Check supply remaining
    (asserts! (< (get claimed-count reward-data) (get total-supply reward-data)) ERR_REWARD_INACTIVE)
    ;; Check not already claimed
    (asserts! (is-none (map-get? user-reward-claims { user: caller, reward-id: reward-id })) ERR_ALREADY_CLAIMED)
    ;; Check sufficient points
    (asserts! (>= (get total-points user-data) points-cost) ERR_INSUFFICIENT_POINTS)
    
    ;; Deduct points
    (map-set user-profiles
      { user: caller }
      (merge user-data {
        total-points: (- (get total-points user-data) points-cost)
      })
    )
    
    ;; Record claim
    (map-set user-reward-claims
      { user: caller, reward-id: reward-id }
      { claimed-at: stacks-block-height }
    )
    
    ;; Update reward stats
    (map-set rewards
      { reward-id: reward-id }
      (merge reward-data {
        claimed-count: (+ (get claimed-count reward-data) u1)
      })
    )
    
    ;; Update global stats
    (var-set total-rewards-claimed (+ (var-get total-rewards-claimed) u1))
    
    ;; Transfer STX if applicable
    (if (> (get stx-value reward-data) u0)
      (try! (as-contract (stx-transfer? (get stx-value reward-data) tx-sender caller)))
      true
    )
    
    (print {
      event: "reward-claimed",
      user: caller,
      reward-id: reward-id,
      reward-name: (get name reward-data),
      points-spent: points-cost,
      stx-value: (get stx-value reward-data),
      block: stacks-block-height
    })
    
    (ok true)
  )
)

;; ============================================
;; PUBLIC FUNCTIONS - ADMIN
;; ============================================

;; Authorize contract to award points
(define-public (authorize-contract (contract principal))
  (begin
    (asserts! (is-admin) ERR_NOT_AUTHORIZED)
    (map-set authorized-contracts
      { contract: contract }
      { is-authorized: true }
    )
    (print {
      event: "contract-authorized",
      contract: contract,
      block: stacks-block-height
    })
    (ok true)
  )
)

;; Revoke contract authorization
(define-public (revoke-contract (contract principal))
  (begin
    (asserts! (is-admin) ERR_NOT_AUTHORIZED)
    (map-set authorized-contracts
      { contract: contract }
      { is-authorized: false }
    )
    (print {
      event: "contract-revoked",
      contract: contract,
      block: stacks-block-height
    })
    (ok true)
  )
)

;; Fund rewards pool (admin deposits STX for rewards)
(define-public (fund-rewards-pool (amount uint))
  (begin
    (asserts! (is-admin) ERR_NOT_AUTHORIZED)
    (try! (stx-transfer? amount tx-sender (as-contract tx-sender)))
    (print {
      event: "rewards-pool-funded",
      amount: amount,
      block: stacks-block-height
    })
    (ok amount)
  )
)

;; Pause contract (admin only)
(define-public (pause-contract)
  (begin
    (asserts! (is-admin) ERR_NOT_AUTHORIZED)
    (var-set contract-paused true)
    (print {
      event: "contract-paused",
      admin: tx-sender,
      block: stacks-block-height
    })
    (ok true)
  )
)

;; Unpause contract (admin only)
(define-public (unpause-contract)
  (begin
    (asserts! (is-admin) ERR_NOT_AUTHORIZED)
    (var-set contract-paused false)
    (print {
      event: "contract-unpaused",
      admin: tx-sender,
      block: stacks-block-height
    })
    (ok true)
  )
)

;; ============================================
;; READ-ONLY FUNCTIONS
;; ============================================

;; Get user profile
(define-read-only (get-user-profile (user principal))
  (map-get? user-profiles { user: user })
)

;; Get user points
(define-read-only (get-user-points (user principal))
  (let (
    (user-data (map-get? user-profiles { user: user }))
  )
    (if (is-some user-data)
      (get total-points (unwrap-panic user-data))
      u0
    )
  )
)

;; Get user tier
(define-read-only (get-user-tier (user principal))
  (let (
    (user-data (map-get? user-profiles { user: user }))
  )
    (if (is-some user-data)
      (get tier (unwrap-panic user-data))
      BADGE_TIER_BRONZE
    )
  )
)

;; Get badge info
(define-read-only (get-badge (badge-id uint))
  (map-get? badges { badge-id: badge-id })
)

;; Check if user has badge
(define-read-only (has-badge (user principal) (badge-id uint))
  (is-some (map-get? user-badges { user: user, badge-id: badge-id }))
)

;; Get user badge by index
(define-read-only (get-user-badge-at-index (user principal) (index uint))
  (map-get? user-badge-index { user: user, index: index })
)

;; Get reward info
(define-read-only (get-reward (reward-id uint))
  (map-get? rewards { reward-id: reward-id })
)

;; Check if user claimed reward
(define-read-only (has-claimed-reward (user principal) (reward-id uint))
  (is-some (map-get? user-reward-claims { user: user, reward-id: reward-id }))
)

;; Get leaderboard position
(define-read-only (get-leaderboard-position (rank uint))
  (map-get? leaderboard-position { rank: rank })
)

;; Get platform stats
(define-read-only (get-platform-stats)
  {
    total-badges-types: (var-get badge-id-counter),
    total-badges-awarded: (var-get total-badges-awarded),
    total-rewards-types: (var-get reward-id-counter),
    total-rewards-claimed: (var-get total-rewards-claimed),
    total-points-distributed: (var-get total-points-distributed),
    is-paused: (var-get contract-paused)
  }
)

;; Check if contract is paused
(define-read-only (is-paused)
  (var-get contract-paused)
)

;; Check if contract is authorized
(define-read-only (is-contract-authorized (contract principal))
  (is-authorized-contract contract)
)