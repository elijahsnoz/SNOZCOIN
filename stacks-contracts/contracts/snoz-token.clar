;; SNOZ Utility Token Contract
;; title: snoz-token
;; version: 1.0.0
;; summary: Non-speculative utility token for the SNOZCOIN creator economy
;; description: SNOZ is a utility token for rewards, reputation, governance, and access tiers.
;;              STX remains the ONLY monetary currency for all payments.
;;              Implements SIP-010 fungible token standard interface.

;; ============================================
;; CONSTANTS
;; ============================================

;; Contract deployer (admin)
(define-constant CONTRACT_OWNER tx-sender)

;; Token metadata
(define-constant TOKEN_NAME "SNOZ")
(define-constant TOKEN_SYMBOL "SNOZ")
(define-constant TOKEN_DECIMALS u6)

;; Maximum supply: 1 billion SNOZ (with 6 decimals)
(define-constant MAX_SUPPLY u1000000000000000)

;; Error codes
(define-constant ERR_NOT_AUTHORIZED (err u400))
(define-constant ERR_PAUSED (err u401))
(define-constant ERR_INSUFFICIENT_BALANCE (err u402))
(define-constant ERR_INVALID_AMOUNT (err u403))
(define-constant ERR_MAX_SUPPLY_EXCEEDED (err u404))
(define-constant ERR_MINT_LIMIT_EXCEEDED (err u405))
(define-constant ERR_NOT_ADMIN (err u406))
(define-constant ERR_ALREADY_ADMIN (err u407))
(define-constant ERR_CANNOT_REMOVE_OWNER (err u408))
(define-constant ERR_TRANSFER_DISABLED (err u409))
(define-constant ERR_SELF_TRANSFER (err u410))
(define-constant ERR_ZERO_AMOUNT (err u411))

;; Daily mint limit per admin (100,000 SNOZ)
(define-constant DAILY_MINT_LIMIT u100000000000)

;; ============================================
;; DATA VARIABLES
;; ============================================

;; Contract pause state
(define-data-var contract-paused bool false)

;; Transfer enabled state
(define-data-var transfers-enabled bool true)

;; Total supply tracker
(define-data-var total-supply uint u0)

;; Total burned tracker
(define-data-var total-burned uint u0)

;; ============================================
;; DATA MAPS
;; ============================================

;; Token balances
(define-map balances
  { account: principal }
  { balance: uint }
)

;; Admin roles
(define-map admins
  { admin: principal }
  { is-active: bool, added-at: uint, added-by: principal }
)

;; Minter roles (contracts authorized to mint)
(define-map minters
  { minter: principal }
  { is-active: bool, added-at: uint }
)

;; Daily mint tracking
(define-map daily-mints
  { admin: principal, day: uint }
  { amount: uint }
)

;; Allowances for delegated transfers
(define-map allowances
  { owner: principal, spender: principal }
  { amount: uint }
)

;; ============================================
;; SIP-010 REQUIRED FUNCTIONS
;; ============================================

;; Get token name
(define-read-only (get-name)
  (ok TOKEN_NAME)
)

;; Get token symbol
(define-read-only (get-symbol)
  (ok TOKEN_SYMBOL)
)

;; Get token decimals
(define-read-only (get-decimals)
  (ok TOKEN_DECIMALS)
)

;; Get balance of an account
(define-read-only (get-balance (account principal))
  (ok (default-to u0 (get balance (map-get? balances { account: account }))))
)

;; Get total supply
(define-read-only (get-total-supply)
  (ok (var-get total-supply))
)

;; Get token URI
(define-read-only (get-token-uri)
  (ok (some u"https://snozcoin.com/token/snoz.json"))
)

;; Transfer tokens
(define-public (transfer (amount uint) (sender principal) (recipient principal) (memo (optional (buff 34))))
  (begin
    ;; Validations
    (asserts! (not (var-get contract-paused)) ERR_PAUSED)
    (asserts! (var-get transfers-enabled) ERR_TRANSFER_DISABLED)
    (asserts! (is-eq tx-sender sender) ERR_NOT_AUTHORIZED)
    (asserts! (not (is-eq sender recipient)) ERR_SELF_TRANSFER)
    (asserts! (> amount u0) ERR_ZERO_AMOUNT)
    
    ;; Execute transfer
    (try! (transfer-internal amount sender recipient))
    
    ;; Print memo if provided
    (match memo 
      m (begin (print m) true)
      true
    )
    
    ;; Log transfer event
    (print {
      event: "snoz-transfer",
      sender: sender,
      recipient: recipient,
      amount: amount
    })
    
    (ok true)
  )
)

;; ============================================
;; INTERNAL FUNCTIONS
;; ============================================

;; Internal transfer logic
(define-private (transfer-internal (amount uint) (sender principal) (recipient principal))
  (let (
    (sender-balance (default-to u0 (get balance (map-get? balances { account: sender }))))
    (recipient-balance (default-to u0 (get balance (map-get? balances { account: recipient }))))
  )
    ;; Check sufficient balance
    (asserts! (>= sender-balance amount) ERR_INSUFFICIENT_BALANCE)
    
    ;; Update balances
    (map-set balances { account: sender } { balance: (- sender-balance amount) })
    (map-set balances { account: recipient } { balance: (+ recipient-balance amount) })
    
    (ok true)
  )
)

;; Get current day (block height / blocks per day)
(define-private (get-current-day)
  ;; Approximately 144 blocks per day on Stacks
  (/ stacks-block-height u144)
)

;; ============================================
;; ADMIN FUNCTIONS
;; ============================================

;; Check if caller is contract owner
(define-read-only (is-owner (account principal))
  (is-eq account CONTRACT_OWNER)
)

;; Check if caller is admin
(define-read-only (is-admin (account principal))
  (or 
    (is-eq account CONTRACT_OWNER)
    (default-to false (get is-active (map-get? admins { admin: account })))
  )
)

;; Check if caller is minter
(define-read-only (is-minter (account principal))
  (or
    (is-admin account)
    (default-to false (get is-active (map-get? minters { minter: account })))
  )
)

;; Add admin (owner only)
(define-public (add-admin (new-admin principal))
  (begin
    (asserts! (is-owner tx-sender) ERR_NOT_AUTHORIZED)
    (asserts! (not (is-admin new-admin)) ERR_ALREADY_ADMIN)
    
    (map-set admins
      { admin: new-admin }
      { is-active: true, added-at: stacks-block-height, added-by: tx-sender }
    )
    
    (print { event: "admin-added", admin: new-admin })
    (ok true)
  )
)

;; Remove admin (owner only)
(define-public (remove-admin (admin principal))
  (begin
    (asserts! (is-owner tx-sender) ERR_NOT_AUTHORIZED)
    (asserts! (not (is-eq admin CONTRACT_OWNER)) ERR_CANNOT_REMOVE_OWNER)
    
    (map-set admins
      { admin: admin }
      { is-active: false, added-at: u0, added-by: tx-sender }
    )
    
    (print { event: "admin-removed", admin: admin })
    (ok true)
  )
)

;; Add minter contract (owner only)
(define-public (add-minter (minter-contract principal))
  (begin
    (asserts! (is-owner tx-sender) ERR_NOT_AUTHORIZED)
    
    (map-set minters
      { minter: minter-contract }
      { is-active: true, added-at: stacks-block-height }
    )
    
    (print { event: "minter-added", minter: minter-contract })
    (ok true)
  )
)

;; Remove minter (owner only)
(define-public (remove-minter (minter-contract principal))
  (begin
    (asserts! (is-owner tx-sender) ERR_NOT_AUTHORIZED)
    
    (map-set minters
      { minter: minter-contract }
      { is-active: false, added-at: u0 }
    )
    
    (print { event: "minter-removed", minter: minter-contract })
    (ok true)
  )
)

;; ============================================
;; MINTING FUNCTIONS
;; ============================================

;; Mint tokens (admin/minter only)
(define-public (mint (amount uint) (recipient principal))
  (let (
    (current-supply (var-get total-supply))
    (new-supply (+ current-supply amount))
    (recipient-balance (default-to u0 (get balance (map-get? balances { account: recipient }))))
  )
    ;; Validations
    (asserts! (not (var-get contract-paused)) ERR_PAUSED)
    (asserts! (is-minter tx-sender) ERR_NOT_AUTHORIZED)
    (asserts! (> amount u0) ERR_ZERO_AMOUNT)
    (asserts! (<= new-supply MAX_SUPPLY) ERR_MAX_SUPPLY_EXCEEDED)
    
    ;; Check daily limit for admins (not for minter contracts)
    (if (is-admin tx-sender)
      (let (
        (current-day (get-current-day))
        (daily-amount (default-to u0 (get amount (map-get? daily-mints { admin: tx-sender, day: current-day }))))
      )
        (asserts! (<= (+ daily-amount amount) DAILY_MINT_LIMIT) ERR_MINT_LIMIT_EXCEEDED)
        (map-set daily-mints
          { admin: tx-sender, day: current-day }
          { amount: (+ daily-amount amount) }
        )
        true
      )
      true
    )
    
    ;; Update total supply
    (var-set total-supply new-supply)
    
    ;; Update recipient balance
    (map-set balances
      { account: recipient }
      { balance: (+ recipient-balance amount) }
    )
    
    ;; Log mint event
    (print {
      event: "snoz-minted",
      amount: amount,
      recipient: recipient,
      minter: tx-sender,
      new-total-supply: new-supply
    })
    
    (ok true)
  )
)

;; ============================================
;; BURN FUNCTIONS
;; ============================================

;; Burn tokens (any holder can burn their own tokens)
(define-public (burn (amount uint))
  (let (
    (sender-balance (default-to u0 (get balance (map-get? balances { account: tx-sender }))))
    (current-supply (var-get total-supply))
  )
    ;; Validations
    (asserts! (not (var-get contract-paused)) ERR_PAUSED)
    (asserts! (> amount u0) ERR_ZERO_AMOUNT)
    (asserts! (>= sender-balance amount) ERR_INSUFFICIENT_BALANCE)
    
    ;; Update balance
    (map-set balances
      { account: tx-sender }
      { balance: (- sender-balance amount) }
    )
    
    ;; Update supplies
    (var-set total-supply (- current-supply amount))
    (var-set total-burned (+ (var-get total-burned) amount))
    
    ;; Log burn event
    (print {
      event: "snoz-burned",
      amount: amount,
      burner: tx-sender,
      new-total-supply: (var-get total-supply)
    })
    
    (ok true)
  )
)

;; ============================================
;; PAUSE FUNCTIONS
;; ============================================

;; Pause contract (admin only)
(define-public (pause)
  (begin
    (asserts! (is-admin tx-sender) ERR_NOT_AUTHORIZED)
    (var-set contract-paused true)
    (print { event: "contract-paused", by: tx-sender })
    (ok true)
  )
)

;; Unpause contract (admin only)
(define-public (unpause)
  (begin
    (asserts! (is-admin tx-sender) ERR_NOT_AUTHORIZED)
    (var-set contract-paused false)
    (print { event: "contract-unpaused", by: tx-sender })
    (ok true)
  )
)

;; Disable transfers (admin only - emergency)
(define-public (disable-transfers)
  (begin
    (asserts! (is-admin tx-sender) ERR_NOT_AUTHORIZED)
    (var-set transfers-enabled false)
    (print { event: "transfers-disabled", by: tx-sender })
    (ok true)
  )
)

;; Enable transfers (admin only)
(define-public (enable-transfers)
  (begin
    (asserts! (is-admin tx-sender) ERR_NOT_AUTHORIZED)
    (var-set transfers-enabled true)
    (print { event: "transfers-enabled", by: tx-sender })
    (ok true)
  )
)

;; ============================================
;; READ-ONLY FUNCTIONS
;; ============================================

;; Get contract status
(define-read-only (get-contract-status)
  {
    is-paused: (var-get contract-paused),
    transfers-enabled: (var-get transfers-enabled),
    total-supply: (var-get total-supply),
    total-burned: (var-get total-burned),
    max-supply: MAX_SUPPLY,
    remaining-mintable: (- MAX_SUPPLY (var-get total-supply))
  }
)

;; Get admin info
(define-read-only (get-admin-info (admin principal))
  (map-get? admins { admin: admin })
)

;; Get minter info
(define-read-only (get-minter-info (minter principal))
  (map-get? minters { minter: minter })
)

;; Get daily mint amount for admin
(define-read-only (get-daily-mint-amount (admin principal))
  (let (
    (current-day (get-current-day))
  )
    {
      day: current-day,
      amount: (default-to u0 (get amount (map-get? daily-mints { admin: admin, day: current-day }))),
      limit: DAILY_MINT_LIMIT,
      remaining: (- DAILY_MINT_LIMIT (default-to u0 (get amount (map-get? daily-mints { admin: admin, day: current-day }))))
    }
  )
)

;; Check allowance
(define-read-only (get-allowance (owner principal) (spender principal))
  (default-to u0 (get amount (map-get? allowances { owner: owner, spender: spender })))
)

;; ============================================
;; ALLOWANCE FUNCTIONS
;; ============================================

;; Approve spender
(define-public (approve (spender principal) (amount uint))
  (begin
    (asserts! (not (var-get contract-paused)) ERR_PAUSED)
    (asserts! (not (is-eq tx-sender spender)) ERR_SELF_TRANSFER)
    
    (map-set allowances
      { owner: tx-sender, spender: spender }
      { amount: amount }
    )
    
    (print { event: "approval", owner: tx-sender, spender: spender, amount: amount })
    (ok true)
  )
)

;; Transfer from (using allowance)
(define-public (transfer-from (amount uint) (sender principal) (recipient principal))
  (let (
    (current-allowance (get-allowance sender tx-sender))
  )
    ;; Validations
    (asserts! (not (var-get contract-paused)) ERR_PAUSED)
    (asserts! (var-get transfers-enabled) ERR_TRANSFER_DISABLED)
    (asserts! (not (is-eq sender recipient)) ERR_SELF_TRANSFER)
    (asserts! (> amount u0) ERR_ZERO_AMOUNT)
    (asserts! (>= current-allowance amount) ERR_INSUFFICIENT_BALANCE)
    
    ;; Execute transfer
    (try! (transfer-internal amount sender recipient))
    
    ;; Update allowance
    (map-set allowances
      { owner: sender, spender: tx-sender }
      { amount: (- current-allowance amount) }
    )
    
    ;; Log transfer event
    (print {
      event: "snoz-transfer-from",
      sender: sender,
      recipient: recipient,
      amount: amount,
      spender: tx-sender
    })
    
    (ok true)
  )
)
