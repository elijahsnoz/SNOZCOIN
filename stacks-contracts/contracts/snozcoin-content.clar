;; SNOZCOIN Unlockable Content Contract
;; title: snozcoin-content
;; version: 1.0.0
;; summary: Lock content behind STX payments and verify access on-chain
;; description: Creators can publish locked content, users pay to unlock, access is verified on-chain

;; ============================================
;; CONSTANTS
;; ============================================

;; Contract deployer (admin)
(define-constant CONTRACT_OWNER tx-sender)

;; Error codes
(define-constant ERR_NOT_AUTHORIZED (err u200))
(define-constant ERR_INVALID_PRICE (err u201))
(define-constant ERR_CONTENT_NOT_FOUND (err u202))
(define-constant ERR_ALREADY_PURCHASED (err u203))
(define-constant ERR_CONTENT_INACTIVE (err u204))
(define-constant ERR_INVALID_CONTENT (err u205))
(define-constant ERR_NOT_CREATOR (err u206))
(define-constant ERR_CONTRACT_PAUSED (err u207))
(define-constant ERR_INSUFFICIENT_FUNDS (err u208))
(define-constant ERR_ZERO_BALANCE (err u209))
(define-constant ERR_INVALID_TITLE (err u210))

;; Minimum content price (10000 microSTX = 0.01 STX)
(define-constant MIN_CONTENT_PRICE u10000)

;; Platform fee (5% = 500 basis points)
(define-constant PLATFORM_FEE_BPS u500)
(define-constant BPS_DENOMINATOR u10000)

;; ============================================
;; DATA VARIABLES
;; ============================================

;; Contract pause state
(define-data-var contract-paused bool false)

;; Content ID counter
(define-data-var content-id-counter uint u0)

;; Total platform fees collected
(define-data-var total-platform-fees uint u0)

;; Total content purchases
(define-data-var total-purchases uint u0)

;; Total revenue processed
(define-data-var total-revenue uint u0)

;; ============================================
;; DATA MAPS
;; ============================================

;; Content metadata
(define-map content
  { content-id: uint }
  {
    creator: principal,
    title: (string-utf8 200),
    description: (string-utf8 1000),
    content-hash: (buff 32),
    price: uint,
    created-at: uint,
    purchase-count: uint,
    total-earned: uint,
    is-active: bool,
    content-type: (string-ascii 50)
  }
)

;; Content access permissions
(define-map content-access
  { content-id: uint, user: principal }
  {
    purchased-at: uint,
    price-paid: uint
  }
)

;; Creator content list (tracks content IDs per creator)
(define-map creator-content-count
  { creator: principal }
  { count: uint }
)

;; Creator earnings (pending withdrawal)
(define-map creator-earnings
  { creator: principal }
  { balance: uint }
)

;; Content by creator index
(define-map creator-content-index
  { creator: principal, index: uint }
  { content-id: uint }
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

;; ============================================
;; PUBLIC FUNCTIONS - CONTENT MANAGEMENT
;; ============================================

;; Publish new content
(define-public (publish-content 
  (title (string-utf8 200)) 
  (description (string-utf8 1000)) 
  (content-hash (buff 32))
  (price uint)
  (content-type (string-ascii 50)))
  (let (
    (caller tx-sender)
    (new-content-id (+ (var-get content-id-counter) u1))
    (current-count (default-to { count: u0 } (map-get? creator-content-count { creator: caller })))
  )
    ;; Check contract is active
    (asserts! (is-contract-active) ERR_CONTRACT_PAUSED)
    ;; Check valid title
    (asserts! (> (len title) u0) ERR_INVALID_TITLE)
    ;; Check valid price
    (asserts! (>= price MIN_CONTENT_PRICE) ERR_INVALID_PRICE)
    ;; Check valid hash
    (asserts! (> (len content-hash) u0) ERR_INVALID_CONTENT)
    
    ;; Store content
    (map-set content
      { content-id: new-content-id }
      {
        creator: caller,
        title: title,
        description: description,
        content-hash: content-hash,
        price: price,
        created-at: stacks-block-height,
        purchase-count: u0,
        total-earned: u0,
        is-active: true,
        content-type: content-type
      }
    )
    
    ;; Update creator content index
    (map-set creator-content-index
      { creator: caller, index: (get count current-count) }
      { content-id: new-content-id }
    )
    
    ;; Update creator content count
    (map-set creator-content-count
      { creator: caller }
      { count: (+ (get count current-count) u1) }
    )
    
    ;; Initialize creator earnings if needed
    (if (is-none (map-get? creator-earnings { creator: caller }))
      (map-set creator-earnings { creator: caller } { balance: u0 })
      true
    )
    
    ;; Increment counter
    (var-set content-id-counter new-content-id)
    
    ;; Emit event
    (print {
      event: "content-published",
      content-id: new-content-id,
      creator: caller,
      title: title,
      price: price,
      content-type: content-type,
      block: stacks-block-height
    })
    
    (ok new-content-id)
  )
)

;; Update content metadata
(define-public (update-content 
  (content-id uint)
  (title (string-utf8 200))
  (description (string-utf8 1000))
  (price uint))
  (let (
    (caller tx-sender)
    (content-data (unwrap! (map-get? content { content-id: content-id }) ERR_CONTENT_NOT_FOUND))
  )
    ;; Check contract is active
    (asserts! (is-contract-active) ERR_CONTRACT_PAUSED)
    ;; Check caller is creator
    (asserts! (is-eq caller (get creator content-data)) ERR_NOT_CREATOR)
    ;; Check valid title
    (asserts! (> (len title) u0) ERR_INVALID_TITLE)
    ;; Check valid price
    (asserts! (>= price MIN_CONTENT_PRICE) ERR_INVALID_PRICE)
    
    ;; Update content
    (map-set content
      { content-id: content-id }
      (merge content-data {
        title: title,
        description: description,
        price: price
      })
    )
    
    (print {
      event: "content-updated",
      content-id: content-id,
      creator: caller,
      title: title,
      price: price,
      block: stacks-block-height
    })
    
    (ok true)
  )
)

;; Deactivate content
(define-public (deactivate-content (content-id uint))
  (let (
    (caller tx-sender)
    (content-data (unwrap! (map-get? content { content-id: content-id }) ERR_CONTENT_NOT_FOUND))
  )
    ;; Check caller is creator
    (asserts! (is-eq caller (get creator content-data)) ERR_NOT_CREATOR)
    
    ;; Update status
    (map-set content
      { content-id: content-id }
      (merge content-data {
        is-active: false
      })
    )
    
    (print {
      event: "content-deactivated",
      content-id: content-id,
      creator: caller,
      block: stacks-block-height
    })
    
    (ok true)
  )
)

;; Reactivate content
(define-public (reactivate-content (content-id uint))
  (let (
    (caller tx-sender)
    (content-data (unwrap! (map-get? content { content-id: content-id }) ERR_CONTENT_NOT_FOUND))
  )
    ;; Check caller is creator
    (asserts! (is-eq caller (get creator content-data)) ERR_NOT_CREATOR)
    
    ;; Update status
    (map-set content
      { content-id: content-id }
      (merge content-data {
        is-active: true
      })
    )
    
    (print {
      event: "content-reactivated",
      content-id: content-id,
      creator: caller,
      block: stacks-block-height
    })
    
    (ok true)
  )
)

;; ============================================
;; PUBLIC FUNCTIONS - PURCHASING
;; ============================================

;; Purchase content access
(define-public (purchase-content (content-id uint))
  (let (
    (buyer tx-sender)
    (content-data (unwrap! (map-get? content { content-id: content-id }) ERR_CONTENT_NOT_FOUND))
    (creator (get creator content-data))
    (price (get price content-data))
    (fee (calculate-fee price))
    (creator-amount (- price fee))
    (current-earnings (default-to { balance: u0 } (map-get? creator-earnings { creator: creator })))
  )
    ;; Check contract is active
    (asserts! (is-contract-active) ERR_CONTRACT_PAUSED)
    ;; Check content is active
    (asserts! (get is-active content-data) ERR_CONTENT_INACTIVE)
    ;; Check not already purchased
    (asserts! (is-none (map-get? content-access { content-id: content-id, user: buyer })) ERR_ALREADY_PURCHASED)
    ;; Prevent creator from buying own content
    (asserts! (not (is-eq buyer creator)) ERR_NOT_AUTHORIZED)
    
    ;; Transfer STX to contract
    (try! (stx-transfer? price buyer (as-contract tx-sender)))
    
    ;; Grant access
    (map-set content-access
      { content-id: content-id, user: buyer }
      {
        purchased-at: stacks-block-height,
        price-paid: price
      }
    )
    
    ;; Update content stats
    (map-set content
      { content-id: content-id }
      (merge content-data {
        purchase-count: (+ (get purchase-count content-data) u1),
        total-earned: (+ (get total-earned content-data) creator-amount)
      })
    )
    
    ;; Update creator earnings
    (map-set creator-earnings
      { creator: creator }
      { balance: (+ (get balance current-earnings) creator-amount) }
    )
    
    ;; Update platform stats
    (var-set total-platform-fees (+ (var-get total-platform-fees) fee))
    (var-set total-purchases (+ (var-get total-purchases) u1))
    (var-set total-revenue (+ (var-get total-revenue) price))
    
    ;; Emit event
    (print {
      event: "content-purchased",
      content-id: content-id,
      buyer: buyer,
      creator: creator,
      price: price,
      creator-amount: creator-amount,
      fee: fee,
      block: stacks-block-height
    })
    
    (ok true)
  )
)

;; ============================================
;; PUBLIC FUNCTIONS - WITHDRAWALS
;; ============================================

;; Creator withdraws earnings
(define-public (withdraw-earnings)
  (let (
    (caller tx-sender)
    (earnings-data (unwrap! (map-get? creator-earnings { creator: caller }) ERR_NOT_AUTHORIZED))
    (balance (get balance earnings-data))
  )
    ;; Check contract is active
    (asserts! (is-contract-active) ERR_CONTRACT_PAUSED)
    ;; Check balance > 0
    (asserts! (> balance u0) ERR_ZERO_BALANCE)
    
    ;; Reset balance
    (map-set creator-earnings
      { creator: caller }
      { balance: u0 }
    )
    
    ;; Transfer STX to creator
    (try! (as-contract (stx-transfer? balance tx-sender caller)))
    
    ;; Emit event
    (print {
      event: "earnings-withdrawn",
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

;; Get content metadata
(define-read-only (get-content (content-id uint))
  (map-get? content { content-id: content-id })
)

;; Check if user has access to content
(define-read-only (has-access (content-id uint) (user principal))
  (let (
    (content-data (map-get? content { content-id: content-id }))
  )
    (if (is-some content-data)
      (let ((creator (get creator (unwrap-panic content-data))))
        ;; Creator always has access, or check if purchased
        (or 
          (is-eq user creator)
          (is-some (map-get? content-access { content-id: content-id, user: user }))
        )
      )
      false
    )
  )
)

;; Get access info for user
(define-read-only (get-access-info (content-id uint) (user principal))
  (map-get? content-access { content-id: content-id, user: user })
)

;; Get creator earnings balance
(define-read-only (get-creator-earnings (creator principal))
  (default-to { balance: u0 } (map-get? creator-earnings { creator: creator }))
)

;; Get creator content count
(define-read-only (get-creator-content-count (creator principal))
  (default-to { count: u0 } (map-get? creator-content-count { creator: creator }))
)

;; Get content ID by creator index
(define-read-only (get-content-by-creator-index (creator principal) (index uint))
  (map-get? creator-content-index { creator: creator, index: index })
)

;; Get platform stats
(define-read-only (get-platform-stats)
  {
    total-content: (var-get content-id-counter),
    total-purchases: (var-get total-purchases),
    total-revenue: (var-get total-revenue),
    total-platform-fees: (var-get total-platform-fees),
    is-paused: (var-get contract-paused)
  }
)

;; Get minimum content price
(define-read-only (get-min-content-price)
  MIN_CONTENT_PRICE
)

;; Get platform fee percentage
(define-read-only (get-platform-fee-bps)
  PLATFORM_FEE_BPS
)

;; Check if contract is paused
(define-read-only (is-paused)
  (var-get contract-paused)
)