;; SNOZCOIN Tipping Contract
;; title: snozcoin-tipping
;; version: 1.0.0
;; summary: A creator support system built on Stacks
;; description: Allows users to tip creators with STX, tracks tips, and emits events

;; ============================================
;; CONSTANTS
;; ============================================

;; Contract deployer (admin)
(define-constant CONTRACT_OWNER tx-sender)

;; Error codes
(define-constant ERR_NOT_AUTHORIZED (err u100))
(define-constant ERR_INVALID_AMOUNT (err u101))
(define-constant ERR_CREATOR_NOT_FOUND (err u102))
(define-constant ERR_SELF_TIP_NOT_ALLOWED (err u103))
(define-constant ERR_CREATOR_ALREADY_REGISTERED (err u104))
(define-constant ERR_CREATOR_NOT_REGISTERED (err u105))
(define-constant ERR_WITHDRAWAL_FAILED (err u106))
(define-constant ERR_ZERO_BALANCE (err u107))
(define-constant ERR_INVALID_NAME (err u108))
(define-constant ERR_CONTRACT_PAUSED (err u109))

;; Minimum tip amount (1000 microSTX = 0.001 STX)
(define-constant MIN_TIP_AMOUNT u1000)

;; Platform fee (2.5% = 250 basis points)
(define-constant PLATFORM_FEE_BPS u250)
(define-constant BPS_DENOMINATOR u10000)

;; ============================================
;; DATA VARIABLES
;; ============================================

;; Contract pause state
(define-data-var contract-paused bool false)

;; Total platform fees collected
(define-data-var total-platform-fees uint u0)

;; Total tips processed through platform
(define-data-var total-tips-processed uint u0)

;; Total number of registered creators
(define-data-var total-creators uint u0)

;; Total number of tips made
(define-data-var total-tip-count uint u0)

;; ============================================
;; DATA MAPS
;; ============================================

;; Creator profiles
(define-map creators
  { creator: principal }
  {
    name: (string-utf8 100),
    bio: (string-utf8 500),
    registered-at: uint,
    total-received: uint,
    tip-count: uint,
    tip-goal: uint,
    is-verified: bool,
    is-active: bool
  }
)

;; Creator pending balances (tips not yet withdrawn)
(define-map creator-balances
  { creator: principal }
  { balance: uint }
)

;; Supporter stats per creator
(define-map supporter-stats
  { creator: principal, supporter: principal }
  {
    total-tipped: uint,
    tip-count: uint,
    first-tip-at: uint,
    last-tip-at: uint
  }
)

;; Top supporter tracking per creator
(define-map top-supporters
  { creator: principal, rank: uint }
  { supporter: principal, total-tipped: uint }
)

;; Tip history (indexed by tip-id)
(define-map tip-history
  { tip-id: uint }
  {
    creator: principal,
    supporter: principal,
    amount: uint,
    net-amount: uint,
    fee: uint,
    message: (string-utf8 280),
    timestamp: uint
  }
)

;; ============================================
;; PRIVATE FUNCTIONS
;; ============================================

;; Calculate platform fee
(define-private (calculate-fee (amount uint))
  (/ (* amount PLATFORM_FEE_BPS) BPS_DENOMINATOR)
)

;; Check if caller is admin
(define-private (is-admin)
  (is-eq tx-sender CONTRACT_OWNER)
)

;; Check if contract is active
(define-private (is-contract-active)
  (not (var-get contract-paused))
)

;; Update supporter stats
(define-private (update-supporter-stats (creator principal) (supporter principal) (amount uint))
  (let (
    (current-stats (default-to 
      { total-tipped: u0, tip-count: u0, first-tip-at: u0, last-tip-at: u0 }
      (map-get? supporter-stats { creator: creator, supporter: supporter })
    ))
    (is-first-tip (is-eq (get tip-count current-stats) u0))
  )
    (map-set supporter-stats
      { creator: creator, supporter: supporter }
      {
        total-tipped: (+ (get total-tipped current-stats) amount),
        tip-count: (+ (get tip-count current-stats) u1),
        first-tip-at: (if is-first-tip stacks-block-height (get first-tip-at current-stats)),
        last-tip-at: stacks-block-height
      }
    )
  )
)

;; ============================================
;; PUBLIC FUNCTIONS - CREATOR MANAGEMENT
;; ============================================

;; Register as a creator
(define-public (register-creator (name (string-utf8 100)) (bio (string-utf8 500)))
  (let (
    (caller tx-sender)
  )
    ;; Check contract is active
    (asserts! (is-contract-active) ERR_CONTRACT_PAUSED)
    ;; Check name is not empty
    (asserts! (> (len name) u0) ERR_INVALID_NAME)
    ;; Check creator not already registered
    (asserts! (is-none (map-get? creators { creator: caller })) ERR_CREATOR_ALREADY_REGISTERED)
    
    ;; Register creator
    (map-set creators
      { creator: caller }
      {
        name: name,
        bio: bio,
        registered-at: stacks-block-height,
        total-received: u0,
        tip-count: u0,
        tip-goal: u0,
        is-verified: false,
        is-active: true
      }
    )
    
    ;; Initialize balance
    (map-set creator-balances
      { creator: caller }
      { balance: u0 }
    )
    
    ;; Increment creator count
    (var-set total-creators (+ (var-get total-creators) u1))
    
    ;; Emit event
    (print {
      event: "creator-registered",
      creator: caller,
      name: name,
      block: stacks-block-height
    })
    
    (ok true)
  )
)

;; Update creator profile
(define-public (update-creator-profile (name (string-utf8 100)) (bio (string-utf8 500)))
  (let (
    (caller tx-sender)
    (creator-data (unwrap! (map-get? creators { creator: caller }) ERR_CREATOR_NOT_REGISTERED))
  )
    ;; Check contract is active
    (asserts! (is-contract-active) ERR_CONTRACT_PAUSED)
    ;; Check name is not empty
    (asserts! (> (len name) u0) ERR_INVALID_NAME)
    
    ;; Update profile
    (map-set creators
      { creator: caller }
      (merge creator-data {
        name: name,
        bio: bio
      })
    )
    
    (print {
      event: "creator-profile-updated",
      creator: caller,
      name: name,
      block: stacks-block-height
    })
    
    (ok true)
  )
)

;; Set tip goal
(define-public (set-tip-goal (goal uint))
  (let (
    (caller tx-sender)
    (creator-data (unwrap! (map-get? creators { creator: caller }) ERR_CREATOR_NOT_REGISTERED))
  )
    ;; Check contract is active
    (asserts! (is-contract-active) ERR_CONTRACT_PAUSED)
    
    ;; Update goal
    (map-set creators
      { creator: caller }
      (merge creator-data {
        tip-goal: goal
      })
    )
    
    (print {
      event: "tip-goal-set",
      creator: caller,
      goal: goal,
      block: stacks-block-height
    })
    
    (ok true)
  )
)

;; Deactivate creator account
(define-public (deactivate-creator)
  (let (
    (caller tx-sender)
    (creator-data (unwrap! (map-get? creators { creator: caller }) ERR_CREATOR_NOT_REGISTERED))
  )
    ;; Update status
    (map-set creators
      { creator: caller }
      (merge creator-data {
        is-active: false
      })
    )
    
    (print {
      event: "creator-deactivated",
      creator: caller,
      block: stacks-block-height
    })
    
    (ok true)
  )
)

;; ============================================
;; PUBLIC FUNCTIONS - TIPPING
;; ============================================

;; Send tip to creator
(define-public (tip-creator (creator principal) (amount uint) (message (string-utf8 280)))
  (let (
    (supporter tx-sender)
    (creator-data (unwrap! (map-get? creators { creator: creator }) ERR_CREATOR_NOT_FOUND))
    (current-balance (default-to { balance: u0 } (map-get? creator-balances { creator: creator })))
    (fee (calculate-fee amount))
    (net-amount (- amount fee))
    (new-tip-id (+ (var-get total-tip-count) u1))
  )
    ;; Check contract is active
    (asserts! (is-contract-active) ERR_CONTRACT_PAUSED)
    ;; Check creator is active
    (asserts! (get is-active creator-data) ERR_CREATOR_NOT_FOUND)
    ;; Check valid amount
    (asserts! (>= amount MIN_TIP_AMOUNT) ERR_INVALID_AMOUNT)
    ;; Prevent self-tipping
    (asserts! (not (is-eq supporter creator)) ERR_SELF_TIP_NOT_ALLOWED)
    
    ;; Transfer STX from supporter to contract
    (try! (stx-transfer? amount supporter (as-contract tx-sender)))
    
    ;; Update creator balance
    (map-set creator-balances
      { creator: creator }
      { balance: (+ (get balance current-balance) net-amount) }
    )
    
    ;; Update creator stats
    (map-set creators
      { creator: creator }
      (merge creator-data {
        total-received: (+ (get total-received creator-data) net-amount),
        tip-count: (+ (get tip-count creator-data) u1)
      })
    )
    
    ;; Update supporter stats
    (update-supporter-stats creator supporter net-amount)
    
    ;; Record tip history
    (map-set tip-history
      { tip-id: new-tip-id }
      {
        creator: creator,
        supporter: supporter,
        amount: amount,
        net-amount: net-amount,
        fee: fee,
        message: message,
        timestamp: stacks-block-height
      }
    )
    
    ;; Update platform stats
    (var-set total-platform-fees (+ (var-get total-platform-fees) fee))
    (var-set total-tips-processed (+ (var-get total-tips-processed) amount))
    (var-set total-tip-count new-tip-id)
    
    ;; Emit tip event
    (print {
      event: "tip-received",
      tip-id: new-tip-id,
      creator: creator,
      supporter: supporter,
      amount: amount,
      net-amount: net-amount,
      fee: fee,
      message: message,
      block: stacks-block-height
    })
    
    (ok new-tip-id)
  )
)

;; ============================================
;; PUBLIC FUNCTIONS - WITHDRAWALS
;; ============================================

;; Creator withdraws their tips
(define-public (withdraw-tips)
  (let (
    (caller tx-sender)
    (creator-data (unwrap! (map-get? creators { creator: caller }) ERR_CREATOR_NOT_REGISTERED))
    (balance-data (unwrap! (map-get? creator-balances { creator: caller }) ERR_CREATOR_NOT_REGISTERED))
    (balance (get balance balance-data))
  )
    ;; Check contract is active
    (asserts! (is-contract-active) ERR_CONTRACT_PAUSED)
    ;; Check balance > 0
    (asserts! (> balance u0) ERR_ZERO_BALANCE)
    
    ;; Reset balance
    (map-set creator-balances
      { creator: caller }
      { balance: u0 }
    )
    
    ;; Transfer STX to creator
    (try! (as-contract (stx-transfer? balance tx-sender caller)))
    
    ;; Emit withdrawal event
    (print {
      event: "tips-withdrawn",
      creator: caller,
      amount: balance,
      block: stacks-block-height
    })
    
    (ok balance)
  )
)

;; ============================================
;; PUBLIC FUNCTIONS - ADMIN
;; ============================================

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

;; Verify creator (admin only)
(define-public (verify-creator (creator principal))
  (let (
    (creator-data (unwrap! (map-get? creators { creator: creator }) ERR_CREATOR_NOT_FOUND))
  )
    (asserts! (is-admin) ERR_NOT_AUTHORIZED)
    
    (map-set creators
      { creator: creator }
      (merge creator-data {
        is-verified: true
      })
    )
    
    (print {
      event: "creator-verified",
      creator: creator,
      admin: tx-sender,
      block: stacks-block-height
    })
    
    (ok true)
  )
)

;; Withdraw platform fees (admin only)
(define-public (withdraw-platform-fees)
  (let (
    (fees (var-get total-platform-fees))
  )
    (asserts! (is-admin) ERR_NOT_AUTHORIZED)
    (asserts! (> fees u0) ERR_ZERO_BALANCE)
    
    ;; Reset fees
    (var-set total-platform-fees u0)
    
    ;; Transfer to admin
    (try! (as-contract (stx-transfer? fees tx-sender CONTRACT_OWNER)))
    
    (print {
      event: "platform-fees-withdrawn",
      admin: tx-sender,
      amount: fees,
      block: stacks-block-height
    })
    
    (ok fees)
  )
)

;; ============================================
;; READ-ONLY FUNCTIONS
;; ============================================

;; Get creator profile
(define-read-only (get-creator (creator principal))
  (map-get? creators { creator: creator })
)

;; Get creator balance
(define-read-only (get-creator-balance (creator principal))
  (default-to { balance: u0 } (map-get? creator-balances { creator: creator }))
)

;; Get supporter stats for a creator
(define-read-only (get-supporter-stats (creator principal) (supporter principal))
  (map-get? supporter-stats { creator: creator, supporter: supporter })
)

;; Get tip by ID
(define-read-only (get-tip (tip-id uint))
  (map-get? tip-history { tip-id: tip-id })
)

;; Get platform stats
(define-read-only (get-platform-stats)
  {
    total-creators: (var-get total-creators),
    total-tips-processed: (var-get total-tips-processed),
    total-tip-count: (var-get total-tip-count),
    total-platform-fees: (var-get total-platform-fees),
    is-paused: (var-get contract-paused)
  }
)

;; Check if creator is registered
(define-read-only (is-creator-registered (creator principal))
  (is-some (map-get? creators { creator: creator }))
)

;; Get minimum tip amount
(define-read-only (get-min-tip-amount)
  MIN_TIP_AMOUNT
)

;; Get platform fee percentage
(define-read-only (get-platform-fee-bps)
  PLATFORM_FEE_BPS
)

;; Check if contract is paused
(define-read-only (is-paused)
  (var-get contract-paused)
)

;; public functions
;;

;; read only functions
;;

;; private functions
;;

