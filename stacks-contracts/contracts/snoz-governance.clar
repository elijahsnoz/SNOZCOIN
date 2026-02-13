;; SNOZ Governance Contract (Preparation Phase)
;; title: snoz-governance
;; version: 1.0.0
;; summary: Governance infrastructure for future DAO functionality
;; description: Prepares voting weight system, proposal placeholders, and snapshot mechanism.
;;              Full DAO not enabled yet - only infrastructure preparation.

;; ============================================
;; CONSTANTS
;; ============================================

;; Contract deployer (admin)
(define-constant CONTRACT_OWNER tx-sender)

;; Error codes
(define-constant ERR_NOT_AUTHORIZED (err u600))
(define-constant ERR_PAUSED (err u601))
(define-constant ERR_GOVERNANCE_NOT_ACTIVE (err u602))
(define-constant ERR_PROPOSAL_NOT_FOUND (err u603))
(define-constant ERR_ALREADY_VOTED (err u604))
(define-constant ERR_VOTING_CLOSED (err u605))
(define-constant ERR_INSUFFICIENT_VOTING_POWER (err u606))
(define-constant ERR_INVALID_PROPOSAL (err u607))
(define-constant ERR_SNAPSHOT_NOT_FOUND (err u608))
(define-constant ERR_PROPOSAL_EXISTS (err u609))
(define-constant ERR_INVALID_VOTE (err u610))
(define-constant ERR_QUORUM_NOT_MET (err u611))

;; Proposal states
(define-constant PROPOSAL_STATE_DRAFT u0)
(define-constant PROPOSAL_STATE_ACTIVE u1)
(define-constant PROPOSAL_STATE_PASSED u2)
(define-constant PROPOSAL_STATE_REJECTED u3)
(define-constant PROPOSAL_STATE_EXECUTED u4)
(define-constant PROPOSAL_STATE_CANCELLED u5)

;; Vote types
(define-constant VOTE_FOR u1)
(define-constant VOTE_AGAINST u2)
(define-constant VOTE_ABSTAIN u3)

;; Governance thresholds (can be updated later)
(define-constant DEFAULT_QUORUM_PERCENT u10)        ;; 10% of total voting power
(define-constant DEFAULT_PASS_THRESHOLD u51)        ;; 51% to pass
(define-constant DEFAULT_VOTING_PERIOD u1008)       ;; ~7 days in blocks
(define-constant DEFAULT_MIN_PROPOSAL_POWER u1000000000) ;; 1000 SNOZ to create proposal

;; ============================================
;; DATA VARIABLES
;; ============================================

;; Contract pause state
(define-data-var contract-paused bool false)

;; Governance active flag (disabled by default)
(define-data-var governance-active bool false)

;; Proposal counter
(define-data-var proposal-counter uint u0)

;; Snapshot counter
(define-data-var snapshot-counter uint u0)

;; Governance parameters
(define-data-var quorum-percent uint DEFAULT_QUORUM_PERCENT)
(define-data-var pass-threshold uint DEFAULT_PASS_THRESHOLD)
(define-data-var voting-period uint DEFAULT_VOTING_PERIOD)
(define-data-var min-proposal-power uint DEFAULT_MIN_PROPOSAL_POWER)

;; Total voting power snapshot
(define-data-var total-voting-power uint u0)

;; ============================================
;; DATA MAPS
;; ============================================

;; User voting power (derived from SNOZ balance)
(define-map voting-power
  { user: principal }
  {
    current-power: uint,
    delegated-to: (optional principal),
    delegated-from-total: uint,
    last-updated: uint
  }
)

;; Power delegation
(define-map delegations
  { delegator: principal, delegate: principal }
  { amount: uint, delegated-at: uint }
)

;; Proposals
(define-map proposals
  { proposal-id: uint }
  {
    title: (string-utf8 200),
    description: (string-utf8 2000),
    proposer: principal,
    created-at: uint,
    voting-starts: uint,
    voting-ends: uint,
    state: uint,
    votes-for: uint,
    votes-against: uint,
    votes-abstain: uint,
    total-votes: uint,
    snapshot-id: uint,
    executed-at: (optional uint)
  }
)

;; User votes
(define-map user-votes
  { proposal-id: uint, voter: principal }
  {
    vote-type: uint,
    voting-power: uint,
    voted-at: uint
  }
)

;; Snapshots (for voting power at specific blocks)
(define-map snapshots
  { snapshot-id: uint }
  {
    block-height: uint,
    total-voting-power: uint,
    created-at: uint,
    proposal-id: (optional uint)
  }
)

;; User snapshot balances
(define-map user-snapshot-balances
  { snapshot-id: uint, user: principal }
  { balance: uint }
)

;; Governance council (multi-sig preparation)
(define-map council-members
  { member: principal }
  { is-active: bool, added-at: uint, role: (string-ascii 32) }
)

;; ============================================
;; AUTHORIZATION
;; ============================================

;; Check if caller is admin
(define-read-only (is-admin (account principal))
  (is-eq account CONTRACT_OWNER)
)

;; Check if caller is council member
(define-read-only (is-council-member (account principal))
  (or
    (is-admin account)
    (default-to false (get is-active (map-get? council-members { member: account })))
  )
)

;; ============================================
;; VOTING POWER FUNCTIONS
;; ============================================

;; Update voting power for user (called when SNOZ balance changes)
(define-public (update-voting-power (user principal) (snoz-balance uint))
  (let (
    (current-data (default-to 
      { current-power: u0, delegated-to: none, delegated-from-total: u0, last-updated: u0 }
      (map-get? voting-power { user: user })
    ))
  )
    ;; Only admin or authorized contracts can update
    (asserts! (or (is-admin tx-sender) (is-admin contract-caller)) ERR_NOT_AUTHORIZED)
    
    (map-set voting-power
      { user: user }
      (merge current-data {
        current-power: snoz-balance,
        last-updated: stacks-block-height
      })
    )
    
    (print { event: "voting-power-updated", user: user, power: snoz-balance })
    (ok true)
  )
)

;; Delegate voting power
(define-public (delegate-voting-power (delegate principal))
  (let (
    (delegator-data (default-to 
      { current-power: u0, delegated-to: none, delegated-from-total: u0, last-updated: u0 }
      (map-get? voting-power { user: tx-sender })
    ))
    (delegate-data (default-to 
      { current-power: u0, delegated-to: none, delegated-from-total: u0, last-updated: u0 }
      (map-get? voting-power { user: delegate })
    ))
    (power-to-delegate (get current-power delegator-data))
  )
    (asserts! (not (var-get contract-paused)) ERR_PAUSED)
    (asserts! (> power-to-delegate u0) ERR_INSUFFICIENT_VOTING_POWER)
    
    ;; Update delegator
    (map-set voting-power
      { user: tx-sender }
      (merge delegator-data {
        delegated-to: (some delegate),
        last-updated: stacks-block-height
      })
    )
    
    ;; Update delegate
    (map-set voting-power
      { user: delegate }
      (merge delegate-data {
        delegated-from-total: (+ (get delegated-from-total delegate-data) power-to-delegate),
        last-updated: stacks-block-height
      })
    )
    
    ;; Record delegation
    (map-set delegations
      { delegator: tx-sender, delegate: delegate }
      { amount: power-to-delegate, delegated-at: stacks-block-height }
    )
    
    (print { event: "voting-power-delegated", delegator: tx-sender, delegate: delegate, amount: power-to-delegate })
    (ok true)
  )
)

;; Revoke delegation
(define-public (revoke-delegation)
  (let (
    (delegator-data (unwrap! (map-get? voting-power { user: tx-sender }) ERR_NOT_AUTHORIZED))
    (delegate (unwrap! (get delegated-to delegator-data) ERR_NOT_AUTHORIZED))
    (delegation-info (unwrap! (map-get? delegations { delegator: tx-sender, delegate: delegate }) ERR_NOT_AUTHORIZED))
    (delegate-data (unwrap! (map-get? voting-power { user: delegate }) ERR_NOT_AUTHORIZED))
  )
    (asserts! (not (var-get contract-paused)) ERR_PAUSED)
    
    ;; Update delegator
    (map-set voting-power
      { user: tx-sender }
      (merge delegator-data {
        delegated-to: none,
        last-updated: stacks-block-height
      })
    )
    
    ;; Update delegate
    (map-set voting-power
      { user: delegate }
      (merge delegate-data {
        delegated-from-total: (- (get delegated-from-total delegate-data) (get amount delegation-info)),
        last-updated: stacks-block-height
      })
    )
    
    ;; Remove delegation record
    (map-delete delegations { delegator: tx-sender, delegate: delegate })
    
    (print { event: "delegation-revoked", delegator: tx-sender, delegate: delegate })
    (ok true)
  )
)

;; Get effective voting power (own + delegated)
(define-read-only (get-effective-voting-power (user principal))
  (let (
    (user-data (default-to 
      { current-power: u0, delegated-to: none, delegated-from-total: u0, last-updated: u0 }
      (map-get? voting-power { user: user })
    ))
  )
    ;; If user has delegated, their power is 0
    ;; Otherwise, it's their power + delegated from others
    (if (is-some (get delegated-to user-data))
      u0
      (+ (get current-power user-data) (get delegated-from-total user-data))
    )
  )
)

;; ============================================
;; SNAPSHOT FUNCTIONS
;; ============================================

;; Create voting power snapshot (admin/council only)
(define-public (create-snapshot)
  (let (
    (snapshot-id (var-get snapshot-counter))
  )
    (asserts! (not (var-get contract-paused)) ERR_PAUSED)
    (asserts! (is-council-member tx-sender) ERR_NOT_AUTHORIZED)
    
    (map-set snapshots
      { snapshot-id: snapshot-id }
      {
        block-height: stacks-block-height,
        total-voting-power: (var-get total-voting-power),
        created-at: stacks-block-height,
        proposal-id: none
      }
    )
    
    (var-set snapshot-counter (+ snapshot-id u1))
    
    (print { event: "snapshot-created", snapshot-id: snapshot-id, block-height: stacks-block-height })
    (ok snapshot-id)
  )
)

;; Record user balance in snapshot
(define-public (record-snapshot-balance (snapshot-id uint) (user principal) (balance uint))
  (begin
    (asserts! (not (var-get contract-paused)) ERR_PAUSED)
    (asserts! (is-council-member tx-sender) ERR_NOT_AUTHORIZED)
    (asserts! (is-some (map-get? snapshots { snapshot-id: snapshot-id })) ERR_SNAPSHOT_NOT_FOUND)
    
    (map-set user-snapshot-balances
      { snapshot-id: snapshot-id, user: user }
      { balance: balance }
    )
    
    (ok true)
  )
)

;; Get snapshot balance
(define-read-only (get-snapshot-balance (snapshot-id uint) (user principal))
  (default-to u0 (get balance (map-get? user-snapshot-balances { snapshot-id: snapshot-id, user: user })))
)

;; ============================================
;; PROPOSAL FUNCTIONS (PLACEHOLDERS)
;; ============================================

;; Create proposal (governance must be active)
(define-public (create-proposal (title (string-utf8 200)) (description (string-utf8 2000)))
  (let (
    (proposal-id (var-get proposal-counter))
    (proposer-power (get-effective-voting-power tx-sender))
    (snapshot-id (var-get snapshot-counter))
  )
    (asserts! (not (var-get contract-paused)) ERR_PAUSED)
    (asserts! (var-get governance-active) ERR_GOVERNANCE_NOT_ACTIVE)
    (asserts! (>= proposer-power (var-get min-proposal-power)) ERR_INSUFFICIENT_VOTING_POWER)
    
    ;; Create snapshot for this proposal
    (map-set snapshots
      { snapshot-id: snapshot-id }
      {
        block-height: stacks-block-height,
        total-voting-power: (var-get total-voting-power),
        created-at: stacks-block-height,
        proposal-id: (some proposal-id)
      }
    )
    
    ;; Create proposal
    (map-set proposals
      { proposal-id: proposal-id }
      {
        title: title,
        description: description,
        proposer: tx-sender,
        created-at: stacks-block-height,
        voting-starts: stacks-block-height,
        voting-ends: (+ stacks-block-height (var-get voting-period)),
        state: PROPOSAL_STATE_ACTIVE,
        votes-for: u0,
        votes-against: u0,
        votes-abstain: u0,
        total-votes: u0,
        snapshot-id: snapshot-id,
        executed-at: none
      }
    )
    
    (var-set proposal-counter (+ proposal-id u1))
    (var-set snapshot-counter (+ snapshot-id u1))
    
    (print { event: "proposal-created", proposal-id: proposal-id, proposer: tx-sender, title: title })
    (ok proposal-id)
  )
)

;; Vote on proposal
(define-public (vote (proposal-id uint) (vote-type uint))
  (let (
    (proposal (unwrap! (map-get? proposals { proposal-id: proposal-id }) ERR_PROPOSAL_NOT_FOUND))
    (voter-power (get-effective-voting-power tx-sender))
  )
    (asserts! (not (var-get contract-paused)) ERR_PAUSED)
    (asserts! (var-get governance-active) ERR_GOVERNANCE_NOT_ACTIVE)
    (asserts! (is-eq (get state proposal) PROPOSAL_STATE_ACTIVE) ERR_VOTING_CLOSED)
    (asserts! (<= stacks-block-height (get voting-ends proposal)) ERR_VOTING_CLOSED)
    (asserts! (> voter-power u0) ERR_INSUFFICIENT_VOTING_POWER)
    (asserts! (is-none (map-get? user-votes { proposal-id: proposal-id, voter: tx-sender })) ERR_ALREADY_VOTED)
    (asserts! (or (is-eq vote-type VOTE_FOR) (is-eq vote-type VOTE_AGAINST) (is-eq vote-type VOTE_ABSTAIN)) ERR_INVALID_VOTE)
    
    ;; Record vote
    (map-set user-votes
      { proposal-id: proposal-id, voter: tx-sender }
      { vote-type: vote-type, voting-power: voter-power, voted-at: stacks-block-height }
    )
    
    ;; Update proposal votes
    (map-set proposals
      { proposal-id: proposal-id }
      (merge proposal {
        votes-for: (if (is-eq vote-type VOTE_FOR) (+ (get votes-for proposal) voter-power) (get votes-for proposal)),
        votes-against: (if (is-eq vote-type VOTE_AGAINST) (+ (get votes-against proposal) voter-power) (get votes-against proposal)),
        votes-abstain: (if (is-eq vote-type VOTE_ABSTAIN) (+ (get votes-abstain proposal) voter-power) (get votes-abstain proposal)),
        total-votes: (+ (get total-votes proposal) voter-power)
      })
    )
    
    (print { event: "vote-cast", proposal-id: proposal-id, voter: tx-sender, vote-type: vote-type, power: voter-power })
    (ok true)
  )
)

;; Finalize proposal (can be called after voting ends)
(define-public (finalize-proposal (proposal-id uint))
  (let (
    (proposal (unwrap! (map-get? proposals { proposal-id: proposal-id }) ERR_PROPOSAL_NOT_FOUND))
    (quorum-required (/ (* (var-get total-voting-power) (var-get quorum-percent)) u100))
    (pass-required (/ (* (get total-votes proposal) (var-get pass-threshold)) u100))
    (quorum-met (>= (get total-votes proposal) quorum-required))
    (passed (and quorum-met (>= (get votes-for proposal) pass-required)))
  )
    (asserts! (not (var-get contract-paused)) ERR_PAUSED)
    (asserts! (is-eq (get state proposal) PROPOSAL_STATE_ACTIVE) ERR_VOTING_CLOSED)
    (asserts! (> stacks-block-height (get voting-ends proposal)) ERR_VOTING_CLOSED)
    
    ;; Update proposal state
    (map-set proposals
      { proposal-id: proposal-id }
      (merge proposal {
        state: (if passed PROPOSAL_STATE_PASSED PROPOSAL_STATE_REJECTED)
      })
    )
    
    (print { 
      event: "proposal-finalized", 
      proposal-id: proposal-id, 
      passed: passed, 
      quorum-met: quorum-met,
      votes-for: (get votes-for proposal),
      votes-against: (get votes-against proposal)
    })
    (ok passed)
  )
)

;; Cancel proposal (proposer or admin only)
(define-public (cancel-proposal (proposal-id uint))
  (let (
    (proposal (unwrap! (map-get? proposals { proposal-id: proposal-id }) ERR_PROPOSAL_NOT_FOUND))
  )
    (asserts! (not (var-get contract-paused)) ERR_PAUSED)
    (asserts! (or (is-eq tx-sender (get proposer proposal)) (is-admin tx-sender)) ERR_NOT_AUTHORIZED)
    (asserts! (is-eq (get state proposal) PROPOSAL_STATE_ACTIVE) ERR_VOTING_CLOSED)
    
    (map-set proposals
      { proposal-id: proposal-id }
      (merge proposal { state: PROPOSAL_STATE_CANCELLED })
    )
    
    (print { event: "proposal-cancelled", proposal-id: proposal-id })
    (ok true)
  )
)

;; ============================================
;; COUNCIL MANAGEMENT (PREPARATION)
;; ============================================

;; Add council member (admin only)
(define-public (add-council-member (member principal) (role (string-ascii 32)))
  (begin
    (asserts! (is-admin tx-sender) ERR_NOT_AUTHORIZED)
    
    (map-set council-members
      { member: member }
      { is-active: true, added-at: stacks-block-height, role: role }
    )
    
    (print { event: "council-member-added", member: member, role: role })
    (ok true)
  )
)

;; Remove council member (admin only)
(define-public (remove-council-member (member principal))
  (begin
    (asserts! (is-admin tx-sender) ERR_NOT_AUTHORIZED)
    
    (map-delete council-members { member: member })
    
    (print { event: "council-member-removed", member: member })
    (ok true)
  )
)

;; ============================================
;; ADMIN FUNCTIONS
;; ============================================

;; Enable governance (admin only - major action)
(define-public (enable-governance)
  (begin
    (asserts! (is-admin tx-sender) ERR_NOT_AUTHORIZED)
    (var-set governance-active true)
    (print { event: "governance-enabled" })
    (ok true)
  )
)

;; Disable governance (admin only - emergency)
(define-public (disable-governance)
  (begin
    (asserts! (is-admin tx-sender) ERR_NOT_AUTHORIZED)
    (var-set governance-active false)
    (print { event: "governance-disabled" })
    (ok true)
  )
)

;; Update governance parameters
(define-public (set-quorum-percent (new-quorum uint))
  (begin
    (asserts! (is-admin tx-sender) ERR_NOT_AUTHORIZED)
    (asserts! (and (> new-quorum u0) (<= new-quorum u100)) ERR_INVALID_PROPOSAL)
    (var-set quorum-percent new-quorum)
    (print { event: "quorum-updated", new-quorum: new-quorum })
    (ok true)
  )
)

(define-public (set-pass-threshold (new-threshold uint))
  (begin
    (asserts! (is-admin tx-sender) ERR_NOT_AUTHORIZED)
    (asserts! (and (> new-threshold u0) (<= new-threshold u100)) ERR_INVALID_PROPOSAL)
    (var-set pass-threshold new-threshold)
    (print { event: "pass-threshold-updated", new-threshold: new-threshold })
    (ok true)
  )
)

(define-public (set-voting-period (new-period uint))
  (begin
    (asserts! (is-admin tx-sender) ERR_NOT_AUTHORIZED)
    (asserts! (> new-period u0) ERR_INVALID_PROPOSAL)
    (var-set voting-period new-period)
    (print { event: "voting-period-updated", new-period: new-period })
    (ok true)
  )
)

(define-public (set-min-proposal-power (new-min uint))
  (begin
    (asserts! (is-admin tx-sender) ERR_NOT_AUTHORIZED)
    (var-set min-proposal-power new-min)
    (print { event: "min-proposal-power-updated", new-min: new-min })
    (ok true)
  )
)

(define-public (set-total-voting-power (new-total uint))
  (begin
    (asserts! (is-admin tx-sender) ERR_NOT_AUTHORIZED)
    (var-set total-voting-power new-total)
    (print { event: "total-voting-power-updated", new-total: new-total })
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

;; Get proposal
(define-read-only (get-proposal (proposal-id uint))
  (map-get? proposals { proposal-id: proposal-id })
)

;; Get user vote
(define-read-only (get-user-vote (proposal-id uint) (voter principal))
  (map-get? user-votes { proposal-id: proposal-id, voter: voter })
)

;; Get voting power info
(define-read-only (get-voting-power-info (user principal))
  (map-get? voting-power { user: user })
)

;; Get delegation info
(define-read-only (get-delegation (delegator principal) (delegate principal))
  (map-get? delegations { delegator: delegator, delegate: delegate })
)

;; Get snapshot
(define-read-only (get-snapshot (snapshot-id uint))
  (map-get? snapshots { snapshot-id: snapshot-id })
)

;; Get council member info
(define-read-only (get-council-member (member principal))
  (map-get? council-members { member: member })
)

;; Get governance parameters
(define-read-only (get-governance-params)
  {
    governance-active: (var-get governance-active),
    quorum-percent: (var-get quorum-percent),
    pass-threshold: (var-get pass-threshold),
    voting-period: (var-get voting-period),
    min-proposal-power: (var-get min-proposal-power),
    total-voting-power: (var-get total-voting-power),
    proposal-count: (var-get proposal-counter),
    snapshot-count: (var-get snapshot-counter),
    is-paused: (var-get contract-paused)
  }
)

;; Check if proposal is active
(define-read-only (is-proposal-active (proposal-id uint))
  (match (map-get? proposals { proposal-id: proposal-id })
    proposal (and 
      (is-eq (get state proposal) PROPOSAL_STATE_ACTIVE)
      (<= stacks-block-height (get voting-ends proposal))
    )
    false
  )
)

;; Get proposal state name
(define-read-only (get-proposal-state-name (state uint))
  (if (is-eq state PROPOSAL_STATE_DRAFT)
    "draft"
    (if (is-eq state PROPOSAL_STATE_ACTIVE)
      "active"
      (if (is-eq state PROPOSAL_STATE_PASSED)
        "passed"
        (if (is-eq state PROPOSAL_STATE_REJECTED)
          "rejected"
          (if (is-eq state PROPOSAL_STATE_EXECUTED)
            "executed"
            (if (is-eq state PROPOSAL_STATE_CANCELLED)
              "cancelled"
              "unknown"
            )
          )
        )
      )
    )
  )
)

;; Get vote type name
(define-read-only (get-vote-type-name (vote-type uint))
  (if (is-eq vote-type VOTE_FOR)
    "for"
    (if (is-eq vote-type VOTE_AGAINST)
      "against"
      (if (is-eq vote-type VOTE_ABSTAIN)
        "abstain"
        "unknown"
      )
    )
  )
)
