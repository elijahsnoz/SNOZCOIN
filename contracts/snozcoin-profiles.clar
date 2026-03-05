;; SNOZCOIN User Profiles Contract
;; Stores user profile data on the Stacks blockchain with Bitcoin security
;; Version: 1.0.0

;; ============================================
;; CONSTANTS
;; ============================================

;; Error codes
(define-constant ERR-NOT-AUTHORIZED (err u100))
(define-constant ERR-PROFILE-EXISTS (err u101))
(define-constant ERR-PROFILE-NOT-FOUND (err u102))
(define-constant ERR-INVALID-USERNAME (err u103))
(define-constant ERR-USERNAME-TAKEN (err u104))
(define-constant ERR-INVALID-USER-TYPE (err u105))

;; Valid user types
(define-constant USER-TYPE-CREATOR u1)
(define-constant USER-TYPE-SUPPORTER u2)
(define-constant USER-TYPE-CORPORATE u3)
(define-constant USER-TYPE-INVESTOR u4)

;; Contract owner (deployer)
(define-constant CONTRACT-OWNER tx-sender)

;; ============================================
;; DATA STORAGE
;; ============================================

;; Main profile storage - maps wallet address to profile data
(define-map profiles
    principal
    {
        username: (string-ascii 20),
        country: (string-ascii 3),
        user-type: uint,
        avatar-seed: (string-ascii 50),
        ipfs-hash: (optional (string-ascii 64)),
        created-at: uint,
        updated-at: uint,
        is-verified: bool
    }
)

;; Username to address mapping (for username uniqueness)
(define-map username-to-address
    (string-ascii 20)
    principal
)

;; Track total registered users
(define-data-var total-users uint u0)

;; Contract pause state
(define-data-var is-paused bool false)

;; ============================================
;; READ-ONLY FUNCTIONS
;; ============================================

;; Get profile by wallet address
(define-read-only (get-profile (wallet principal))
    (map-get? profiles wallet)
)

;; Get address by username
(define-read-only (get-address-by-username (username (string-ascii 20)))
    (map-get? username-to-address username)
)

;; Check if username is available
(define-read-only (is-username-available (username (string-ascii 20)))
    (is-none (map-get? username-to-address username))
)

;; Check if wallet has a profile
(define-read-only (has-profile (wallet principal))
    (is-some (map-get? profiles wallet))
)

;; Get total registered users
(define-read-only (get-total-users)
    (var-get total-users)
)

;; Check if contract is paused
(define-read-only (get-is-paused)
    (var-get is-paused)
)

;; Validate user type
(define-read-only (is-valid-user-type (user-type uint))
    (or 
        (is-eq user-type USER-TYPE-CREATOR)
        (or 
            (is-eq user-type USER-TYPE-SUPPORTER)
            (or 
                (is-eq user-type USER-TYPE-CORPORATE)
                (is-eq user-type USER-TYPE-INVESTOR)
            )
        )
    )
)

;; Get user type name
(define-read-only (get-user-type-name (user-type uint))
    (if (is-eq user-type USER-TYPE-CREATOR)
        "creator"
        (if (is-eq user-type USER-TYPE-SUPPORTER)
            "supporter"
            (if (is-eq user-type USER-TYPE-CORPORATE)
                "corporate"
                (if (is-eq user-type USER-TYPE-INVESTOR)
                    "investor"
                    "unknown"
                )
            )
        )
    )
)

;; ============================================
;; PUBLIC FUNCTIONS
;; ============================================

;; Register a new profile
(define-public (register-profile 
    (username (string-ascii 20))
    (country (string-ascii 3))
    (user-type uint)
    (avatar-seed (string-ascii 50))
)
    (let
        (
            (caller tx-sender)
            (current-block block-height)
        )
        ;; Check contract not paused
        (asserts! (not (var-get is-paused)) ERR-NOT-AUTHORIZED)
        
        ;; Check profile doesn't already exist
        (asserts! (not (has-profile caller)) ERR-PROFILE-EXISTS)
        
        ;; Check username length (min 3 chars)
        (asserts! (>= (len username) u3) ERR-INVALID-USERNAME)
        
        ;; Check username is available
        (asserts! (is-username-available username) ERR-USERNAME-TAKEN)
        
        ;; Check valid user type
        (asserts! (is-valid-user-type user-type) ERR-INVALID-USER-TYPE)
        
        ;; Store the profile
        (map-set profiles caller {
            username: username,
            country: country,
            user-type: user-type,
            avatar-seed: avatar-seed,
            ipfs-hash: none,
            created-at: current-block,
            updated-at: current-block,
            is-verified: false
        })
        
        ;; Store username mapping
        (map-set username-to-address username caller)
        
        ;; Increment user count
        (var-set total-users (+ (var-get total-users) u1))
        
        ;; Return success with profile data
        (ok {
            wallet: caller,
            username: username,
            user-type: user-type,
            block: current-block
        })
    )
)

;; Update profile (only owner can update their own)
(define-public (update-profile
    (country (string-ascii 3))
    (user-type uint)
    (avatar-seed (string-ascii 50))
)
    (let
        (
            (caller tx-sender)
            (existing-profile (unwrap! (get-profile caller) ERR-PROFILE-NOT-FOUND))
        )
        ;; Check contract not paused
        (asserts! (not (var-get is-paused)) ERR-NOT-AUTHORIZED)
        
        ;; Check valid user type
        (asserts! (is-valid-user-type user-type) ERR-INVALID-USER-TYPE)
        
        ;; Update profile (keep username, created-at, is-verified)
        (map-set profiles caller (merge existing-profile {
            country: country,
            user-type: user-type,
            avatar-seed: avatar-seed,
            updated-at: block-height
        }))
        
        (ok true)
    )
)

;; Update IPFS hash (for extended profile data)
(define-public (update-ipfs-hash (ipfs-hash (string-ascii 64)))
    (let
        (
            (caller tx-sender)
            (existing-profile (unwrap! (get-profile caller) ERR-PROFILE-NOT-FOUND))
        )
        ;; Check contract not paused
        (asserts! (not (var-get is-paused)) ERR-NOT-AUTHORIZED)
        
        ;; Update IPFS hash
        (map-set profiles caller (merge existing-profile {
            ipfs-hash: (some ipfs-hash),
            updated-at: block-height
        }))
        
        (ok true)
    )
)

;; ============================================
;; ADMIN FUNCTIONS (Owner only)
;; ============================================

;; Verify a user (admin only)
(define-public (verify-user (wallet principal))
    (let
        (
            (existing-profile (unwrap! (get-profile wallet) ERR-PROFILE-NOT-FOUND))
        )
        ;; Check caller is contract owner
        (asserts! (is-eq tx-sender CONTRACT-OWNER) ERR-NOT-AUTHORIZED)
        
        ;; Update verification status
        (map-set profiles wallet (merge existing-profile {
            is-verified: true,
            updated-at: block-height
        }))
        
        (ok true)
    )
)

;; Unverify a user (admin only)
(define-public (unverify-user (wallet principal))
    (let
        (
            (existing-profile (unwrap! (get-profile wallet) ERR-PROFILE-NOT-FOUND))
        )
        ;; Check caller is contract owner
        (asserts! (is-eq tx-sender CONTRACT-OWNER) ERR-NOT-AUTHORIZED)
        
        ;; Update verification status
        (map-set profiles wallet (merge existing-profile {
            is-verified: false,
            updated-at: block-height
        }))
        
        (ok true)
    )
)

;; Pause contract (admin only)
(define-public (pause-contract)
    (begin
        (asserts! (is-eq tx-sender CONTRACT-OWNER) ERR-NOT-AUTHORIZED)
        (var-set is-paused true)
        (ok true)
    )
)

;; Unpause contract (admin only)
(define-public (unpause-contract)
    (begin
        (asserts! (is-eq tx-sender CONTRACT-OWNER) ERR-NOT-AUTHORIZED)
        (var-set is-paused false)
        (ok true)
    )
)
