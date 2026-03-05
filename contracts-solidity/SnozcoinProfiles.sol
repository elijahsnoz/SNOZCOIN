// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title SNOZCOIN User Profiles
 * @notice Stores user profile data on-chain for the SNOZCOIN platform
 * @dev Deployed on Base Sepolia Testnet
 */
contract SnozcoinProfiles {
    
    // ============================================
    // STRUCTS
    // ============================================
    
    struct Profile {
        string username;
        string country;        // 3-letter country code
        uint8 userType;        // 1=creator, 2=supporter, 3=corporate, 4=investor
        string avatarSeed;     // DiceBear avatar seed
        string ipfsHash;       // Extended profile data
        uint256 createdAt;
        uint256 updatedAt;
        bool isVerified;
        bool exists;
    }
    
    // ============================================
    // STATE VARIABLES
    // ============================================
    
    address public owner;
    uint256 public totalProfiles;
    bool public paused;
    
    // Mappings
    mapping(address => Profile) public profiles;
    mapping(string => address) public usernameToAddress;
    mapping(address => bool) public admins;
    
    // ============================================
    // EVENTS
    // ============================================
    
    event ProfileCreated(
        address indexed wallet,
        string username,
        uint8 userType,
        uint256 timestamp
    );
    
    event ProfileUpdated(
        address indexed wallet,
        uint256 timestamp
    );
    
    event UserVerified(
        address indexed wallet,
        uint256 timestamp
    );
    
    event UserUnverified(
        address indexed wallet,
        uint256 timestamp
    );
    
    // ============================================
    // MODIFIERS
    // ============================================
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Not authorized: owner only");
        _;
    }
    
    modifier onlyAdmin() {
        require(msg.sender == owner || admins[msg.sender], "Not authorized: admin only");
        _;
    }
    
    modifier whenNotPaused() {
        require(!paused, "Contract is paused");
        _;
    }
    
    modifier profileExists(address wallet) {
        require(profiles[wallet].exists, "Profile does not exist");
        _;
    }
    
    modifier profileNotExists(address wallet) {
        require(!profiles[wallet].exists, "Profile already exists");
        _;
    }
    
    // ============================================
    // CONSTRUCTOR
    // ============================================
    
    constructor() {
        owner = msg.sender;
        admins[msg.sender] = true;
    }
    
    // ============================================
    // PUBLIC FUNCTIONS
    // ============================================
    
    /**
     * @notice Register a new user profile
     * @param username Unique username (3-20 characters)
     * @param country 3-letter country code
     * @param userType User type (1-4)
     * @param avatarSeed DiceBear avatar seed
     */
    function registerProfile(
        string calldata username,
        string calldata country,
        uint8 userType,
        string calldata avatarSeed
    ) external whenNotPaused profileNotExists(msg.sender) {
        // Validate username
        bytes memory usernameBytes = bytes(username);
        require(usernameBytes.length >= 3 && usernameBytes.length <= 20, "Username: 3-20 chars required");
        require(usernameToAddress[username] == address(0), "Username already taken");
        
        // Validate country code
        require(bytes(country).length == 3, "Country: must be 3 chars");
        
        // Validate user type
        require(userType >= 1 && userType <= 4, "UserType: must be 1-4");
        
        // Validate avatar seed
        require(bytes(avatarSeed).length <= 50, "AvatarSeed: max 50 chars");
        
        // Create profile
        profiles[msg.sender] = Profile({
            username: username,
            country: country,
            userType: userType,
            avatarSeed: avatarSeed,
            ipfsHash: "",
            createdAt: block.timestamp,
            updatedAt: block.timestamp,
            isVerified: false,
            exists: true
        });
        
        // Store username mapping
        usernameToAddress[username] = msg.sender;
        
        // Increment counter
        totalProfiles++;
        
        emit ProfileCreated(msg.sender, username, userType, block.timestamp);
    }
    
    /**
     * @notice Update profile (country, userType, avatarSeed)
     */
    function updateProfile(
        string calldata country,
        uint8 userType,
        string calldata avatarSeed
    ) external whenNotPaused profileExists(msg.sender) {
        require(bytes(country).length == 3, "Country: must be 3 chars");
        require(userType >= 1 && userType <= 4, "UserType: must be 1-4");
        require(bytes(avatarSeed).length <= 50, "AvatarSeed: max 50 chars");
        
        Profile storage profile = profiles[msg.sender];
        profile.country = country;
        profile.userType = userType;
        profile.avatarSeed = avatarSeed;
        profile.updatedAt = block.timestamp;
        
        emit ProfileUpdated(msg.sender, block.timestamp);
    }
    
    /**
     * @notice Update IPFS hash for extended profile data
     */
    function updateIpfsHash(string calldata ipfsHash) external whenNotPaused profileExists(msg.sender) {
        require(bytes(ipfsHash).length <= 64, "IPFS hash: max 64 chars");
        
        profiles[msg.sender].ipfsHash = ipfsHash;
        profiles[msg.sender].updatedAt = block.timestamp;
        
        emit ProfileUpdated(msg.sender, block.timestamp);
    }
    
    // ============================================
    // VIEW FUNCTIONS
    // ============================================
    
    /**
     * @notice Get profile by wallet address
     */
    function getProfile(address wallet) external view returns (
        string memory username,
        string memory country,
        uint8 userType,
        string memory avatarSeed,
        string memory ipfsHash,
        uint256 createdAt,
        uint256 updatedAt,
        bool isVerified
    ) {
        Profile storage profile = profiles[wallet];
        require(profile.exists, "Profile does not exist");
        
        return (
            profile.username,
            profile.country,
            profile.userType,
            profile.avatarSeed,
            profile.ipfsHash,
            profile.createdAt,
            profile.updatedAt,
            profile.isVerified
        );
    }
    
    /**
     * @notice Get address by username
     */
    function getAddressByUsername(string calldata username) external view returns (address) {
        return usernameToAddress[username];
    }
    
    /**
     * @notice Check if username is available
     */
    function isUsernameAvailable(string calldata username) external view returns (bool) {
        return usernameToAddress[username] == address(0);
    }
    
    /**
     * @notice Check if wallet has a profile
     */
    function hasProfile(address wallet) external view returns (bool) {
        return profiles[wallet].exists;
    }
    
    // ============================================
    // ADMIN FUNCTIONS
    // ============================================
    
    /**
     * @notice Verify a user (admin only)
     */
    function verifyUser(address wallet) external onlyAdmin profileExists(wallet) {
        profiles[wallet].isVerified = true;
        profiles[wallet].updatedAt = block.timestamp;
        emit UserVerified(wallet, block.timestamp);
    }
    
    /**
     * @notice Unverify a user (admin only)
     */
    function unverifyUser(address wallet) external onlyAdmin profileExists(wallet) {
        profiles[wallet].isVerified = false;
        profiles[wallet].updatedAt = block.timestamp;
        emit UserUnverified(wallet, block.timestamp);
    }
    
    /**
     * @notice Add an admin (owner only)
     */
    function addAdmin(address admin) external onlyOwner {
        admins[admin] = true;
    }
    
    /**
     * @notice Remove an admin (owner only)
     */
    function removeAdmin(address admin) external onlyOwner {
        admins[admin] = false;
    }
    
    /**
     * @notice Pause the contract (owner only)
     */
    function pause() external onlyOwner {
        paused = true;
    }
    
    /**
     * @notice Unpause the contract (owner only)
     */
    function unpause() external onlyOwner {
        paused = false;
    }
    
    /**
     * @notice Transfer ownership (owner only)
     */
    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "Invalid address");
        owner = newOwner;
        admins[newOwner] = true;
    }
}
