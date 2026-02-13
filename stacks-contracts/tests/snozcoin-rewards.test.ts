/**
 * SNOZCOIN Community Rewards Contract Tests
 * Comprehensive test coverage for points, badges, and rewards system
 */

import { describe, expect, it, beforeEach } from "vitest";
import { Cl } from "@stacks/transactions";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;
const user1 = accounts.get("wallet_1")!;
const user2 = accounts.get("wallet_2")!;
const user3 = accounts.get("wallet_3")!;
const user4 = accounts.get("wallet_4")!;

const contractName = "snozcoin-rewards";

describe("SNOZCOIN Rewards Contract", () => {
  
  describe("Contract Initialization", () => {
    it("ensures simnet is well initialized", () => {
      expect(simnet.blockHeight).toBeDefined();
    });

    it("should have correct initial platform stats", () => {
      const { result } = simnet.callReadOnlyFn(
        contractName,
        "get-platform-stats",
        [],
        deployer
      );
      
      expect(result).toBeTuple({
        "total-badges-types": Cl.uint(0),
        "total-badges-awarded": Cl.uint(0),
        "total-rewards-types": Cl.uint(0),
        "total-rewards-claimed": Cl.uint(0),
        "total-points-distributed": Cl.uint(0),
        "is-paused": Cl.bool(false),
      });
    });
  });

  describe("User Registration", () => {
    it("should allow user to register for rewards", () => {
      const { result } = simnet.callPublicFn(
        contractName,
        "register-user",
        [],
        user1
      );
      expect(result).toBeOk(Cl.bool(true));
    });

    it("should store user profile correctly", () => {
      simnet.callPublicFn(
        contractName,
        "register-user",
        [],
        user1
      );

      const { result } = simnet.callReadOnlyFn(
        contractName,
        "get-user-profile",
        [Cl.principal(user1)],
        deployer
      );
      
      const profile = result as any;
      expect(profile.type).toBe(10); // Some
    });

    it("should reject duplicate registration", () => {
      simnet.callPublicFn(
        contractName,
        "register-user",
        [],
        user1
      );

      const { result } = simnet.callPublicFn(
        contractName,
        "register-user",
        [],
        user1
      );
      expect(result).toBeErr(Cl.uint(300)); // ERR_NOT_AUTHORIZED
    });
  });

  describe("Point Management", () => {
    it("should allow admin to award points", () => {
      const { result } = simnet.callPublicFn(
        contractName,
        "award-points",
        [Cl.principal(user1), Cl.uint(100), Cl.stringUtf8("Bonus points")],
        deployer
      );
      expect(result).toBeOk(Cl.uint(100));
    });

    it("should reject point award from non-admin", () => {
      const { result } = simnet.callPublicFn(
        contractName,
        "award-points",
        [Cl.principal(user2), Cl.uint(100), Cl.stringUtf8("Trying to cheat")],
        user1
      );
      expect(result).toBeErr(Cl.uint(300)); // ERR_NOT_AUTHORIZED
    });

    it("should reject zero points award", () => {
      const { result } = simnet.callPublicFn(
        contractName,
        "award-points",
        [Cl.principal(user1), Cl.uint(0), Cl.stringUtf8("Zero points")],
        deployer
      );
      expect(result).toBeErr(Cl.uint(301)); // ERR_INVALID_POINTS
    });

    it("should accumulate points correctly", () => {
      simnet.callPublicFn(
        contractName,
        "award-points",
        [Cl.principal(user1), Cl.uint(100), Cl.stringUtf8("First award")],
        deployer
      );

      simnet.callPublicFn(
        contractName,
        "award-points",
        [Cl.principal(user1), Cl.uint(50), Cl.stringUtf8("Second award")],
        deployer
      );

      const { result } = simnet.callReadOnlyFn(
        contractName,
        "get-user-points",
        [Cl.principal(user1)],
        deployer
      );
      expect(result).toBeUint(150);
    });

    it("should record tip activity with correct points", () => {
      simnet.callPublicFn(
        contractName,
        "register-user",
        [],
        user1
      );

      const { result } = simnet.callPublicFn(
        contractName,
        "record-tip-activity",
        [Cl.principal(user1), Cl.bool(true)], // First tip
        deployer
      );
      // First tip = 10 + 50 bonus = 60 points
      expect(result).toBeOk(Cl.uint(60));
    });

    it("should record purchase activity", () => {
      simnet.callPublicFn(
        contractName,
        "register-user",
        [],
        user1
      );

      const { result } = simnet.callPublicFn(
        contractName,
        "record-purchase-activity",
        [Cl.principal(user1)],
        deployer
      );
      expect(result).toBeOk(Cl.uint(25)); // POINTS_CONTENT_PURCHASED
    });
  });

  describe("Tier System", () => {
    it("should start at bronze tier", () => {
      simnet.callPublicFn(
        contractName,
        "register-user",
        [],
        user1
      );

      const { result } = simnet.callReadOnlyFn(
        contractName,
        "get-user-tier",
        [Cl.principal(user1)],
        deployer
      );
      expect(result).toBeUint(1); // BADGE_TIER_BRONZE
    });

    it("should upgrade to silver tier at 500 points", () => {
      simnet.callPublicFn(
        contractName,
        "award-points",
        [Cl.principal(user1), Cl.uint(500), Cl.stringUtf8("Big award")],
        deployer
      );

      const { result } = simnet.callReadOnlyFn(
        contractName,
        "get-user-tier",
        [Cl.principal(user1)],
        deployer
      );
      expect(result).toBeUint(2); // BADGE_TIER_SILVER
    });

    it("should upgrade to gold tier at 2000 points", () => {
      simnet.callPublicFn(
        contractName,
        "award-points",
        [Cl.principal(user1), Cl.uint(2000), Cl.stringUtf8("Gold award")],
        deployer
      );

      const { result } = simnet.callReadOnlyFn(
        contractName,
        "get-user-tier",
        [Cl.principal(user1)],
        deployer
      );
      expect(result).toBeUint(3); // BADGE_TIER_GOLD
    });
  });

  describe("Badge Management", () => {
    it("should allow admin to create badge", () => {
      const { result } = simnet.callPublicFn(
        contractName,
        "create-badge",
        [
          Cl.stringUtf8("Early Adopter"),
          Cl.stringUtf8("Awarded to early community members"),
          Cl.uint(1), // Bronze tier
          Cl.uint(100), // 100 points required
          Cl.stringUtf8("ipfs://badge-image-hash"),
        ],
        deployer
      );
      expect(result).toBeOk(Cl.uint(1)); // First badge ID
    });

    it("should reject badge creation from non-admin", () => {
      const { result } = simnet.callPublicFn(
        contractName,
        "create-badge",
        [
          Cl.stringUtf8("Fake Badge"),
          Cl.stringUtf8("Description"),
          Cl.uint(1),
          Cl.uint(100),
          Cl.stringUtf8("ipfs://fake"),
        ],
        user1
      );
      expect(result).toBeErr(Cl.uint(300)); // ERR_NOT_AUTHORIZED
    });

    it("should store badge metadata correctly", () => {
      simnet.callPublicFn(
        contractName,
        "create-badge",
        [
          Cl.stringUtf8("Test Badge"),
          Cl.stringUtf8("Test Description"),
          Cl.uint(2),
          Cl.uint(200),
          Cl.stringUtf8("ipfs://test"),
        ],
        deployer
      );

      const { result } = simnet.callReadOnlyFn(
        contractName,
        "get-badge",
        [Cl.uint(1)],
        deployer
      );
      
      const badge = result as any;
      expect(badge.type).toBe(10); // Some
    });

    it("should allow admin to award badge to user", () => {
      // Create badge
      simnet.callPublicFn(
        contractName,
        "create-badge",
        [
          Cl.stringUtf8("Contributor"),
          Cl.stringUtf8("For contributors"),
          Cl.uint(1),
          Cl.uint(50),
          Cl.stringUtf8("ipfs://contrib"),
        ],
        deployer
      );

      // Give user enough points
      simnet.callPublicFn(
        contractName,
        "award-points",
        [Cl.principal(user1), Cl.uint(100), Cl.stringUtf8("Points")],
        deployer
      );

      // Award badge
      const { result } = simnet.callPublicFn(
        contractName,
        "award-badge",
        [Cl.principal(user1), Cl.uint(1)],
        deployer
      );
      expect(result).toBeOk(Cl.bool(true));
    });

    it("should reject badge award if user has insufficient points", () => {
      simnet.callPublicFn(
        contractName,
        "create-badge",
        [
          Cl.stringUtf8("High Level"),
          Cl.stringUtf8("Requires many points"),
          Cl.uint(3),
          Cl.uint(1000),
          Cl.stringUtf8("ipfs://high"),
        ],
        deployer
      );

      simnet.callPublicFn(
        contractName,
        "register-user",
        [],
        user1
      );

      const { result } = simnet.callPublicFn(
        contractName,
        "award-badge",
        [Cl.principal(user1), Cl.uint(1)],
        deployer
      );
      expect(result).toBeErr(Cl.uint(308)); // ERR_INSUFFICIENT_POINTS
    });

    it("should reject duplicate badge award", () => {
      simnet.callPublicFn(
        contractName,
        "create-badge",
        [
          Cl.stringUtf8("Badge"),
          Cl.stringUtf8("Desc"),
          Cl.uint(1),
          Cl.uint(50),
          Cl.stringUtf8("ipfs://badge"),
        ],
        deployer
      );

      simnet.callPublicFn(
        contractName,
        "award-points",
        [Cl.principal(user1), Cl.uint(100), Cl.stringUtf8("Points")],
        deployer
      );

      simnet.callPublicFn(
        contractName,
        "award-badge",
        [Cl.principal(user1), Cl.uint(1)],
        deployer
      );

      const { result } = simnet.callPublicFn(
        contractName,
        "award-badge",
        [Cl.principal(user1), Cl.uint(1)],
        deployer
      );
      expect(result).toBeErr(Cl.uint(304)); // ERR_BADGE_ALREADY_AWARDED
    });

    it("should check if user has badge", () => {
      simnet.callPublicFn(
        contractName,
        "create-badge",
        [
          Cl.stringUtf8("Badge"),
          Cl.stringUtf8("Desc"),
          Cl.uint(1),
          Cl.uint(50),
          Cl.stringUtf8("ipfs://badge"),
        ],
        deployer
      );

      simnet.callPublicFn(
        contractName,
        "award-points",
        [Cl.principal(user1), Cl.uint(100), Cl.stringUtf8("Points")],
        deployer
      );

      simnet.callPublicFn(
        contractName,
        "award-badge",
        [Cl.principal(user1), Cl.uint(1)],
        deployer
      );

      const { result } = simnet.callReadOnlyFn(
        contractName,
        "has-badge",
        [Cl.principal(user1), Cl.uint(1)],
        deployer
      );
      expect(result).toBeBool(true);
    });
  });

  describe("Reward System", () => {
    it("should allow admin to create reward", () => {
      const { result } = simnet.callPublicFn(
        contractName,
        "create-reward",
        [
          Cl.stringUtf8("STX Reward"),
          Cl.stringUtf8("Redeem points for STX"),
          Cl.uint(500), // 500 points
          Cl.uint(10000), // 0.01 STX value
          Cl.uint(100), // 100 available
        ],
        deployer
      );
      expect(result).toBeOk(Cl.uint(1)); // First reward ID
    });

    it("should allow user to claim reward", () => {
      // Create reward
      simnet.callPublicFn(
        contractName,
        "create-reward",
        [
          Cl.stringUtf8("Small Reward"),
          Cl.stringUtf8("Easy to claim"),
          Cl.uint(100),
          Cl.uint(0), // No STX value
          Cl.uint(50),
        ],
        deployer
      );

      // Register user and give points
      simnet.callPublicFn(
        contractName,
        "register-user",
        [],
        user1
      );

      simnet.callPublicFn(
        contractName,
        "award-points",
        [Cl.principal(user1), Cl.uint(200), Cl.stringUtf8("Points")],
        deployer
      );

      // Claim reward
      const { result } = simnet.callPublicFn(
        contractName,
        "claim-reward",
        [Cl.uint(1)],
        user1
      );
      expect(result).toBeOk(Cl.bool(true));
    });

    it("should reject claim with insufficient points", () => {
      simnet.callPublicFn(
        contractName,
        "create-reward",
        [
          Cl.stringUtf8("Expensive Reward"),
          Cl.stringUtf8("Requires many points"),
          Cl.uint(1000),
          Cl.uint(0),
          Cl.uint(10),
        ],
        deployer
      );

      simnet.callPublicFn(
        contractName,
        "register-user",
        [],
        user1
      );

      simnet.callPublicFn(
        contractName,
        "award-points",
        [Cl.principal(user1), Cl.uint(100), Cl.stringUtf8("Not enough")],
        deployer
      );

      const { result } = simnet.callPublicFn(
        contractName,
        "claim-reward",
        [Cl.uint(1)],
        user1
      );
      expect(result).toBeErr(Cl.uint(308)); // ERR_INSUFFICIENT_POINTS
    });

    it("should reject duplicate claim", () => {
      simnet.callPublicFn(
        contractName,
        "create-reward",
        [
          Cl.stringUtf8("One-time Reward"),
          Cl.stringUtf8("Can only claim once"),
          Cl.uint(50),
          Cl.uint(0),
          Cl.uint(100),
        ],
        deployer
      );

      simnet.callPublicFn(
        contractName,
        "register-user",
        [],
        user1
      );

      simnet.callPublicFn(
        contractName,
        "award-points",
        [Cl.principal(user1), Cl.uint(200), Cl.stringUtf8("Points")],
        deployer
      );

      simnet.callPublicFn(
        contractName,
        "claim-reward",
        [Cl.uint(1)],
        user1
      );

      const { result } = simnet.callPublicFn(
        contractName,
        "claim-reward",
        [Cl.uint(1)],
        user1
      );
      expect(result).toBeErr(Cl.uint(311)); // ERR_ALREADY_CLAIMED
    });

    it("should deduct points after claiming", () => {
      simnet.callPublicFn(
        contractName,
        "create-reward",
        [
          Cl.stringUtf8("Reward"),
          Cl.stringUtf8("Desc"),
          Cl.uint(50),
          Cl.uint(0),
          Cl.uint(100),
        ],
        deployer
      );

      simnet.callPublicFn(
        contractName,
        "register-user",
        [],
        user1
      );

      simnet.callPublicFn(
        contractName,
        "award-points",
        [Cl.principal(user1), Cl.uint(100), Cl.stringUtf8("Points")],
        deployer
      );

      simnet.callPublicFn(
        contractName,
        "claim-reward",
        [Cl.uint(1)],
        user1
      );

      const { result } = simnet.callReadOnlyFn(
        contractName,
        "get-user-points",
        [Cl.principal(user1)],
        deployer
      );
      expect(result).toBeUint(50); // 100 - 50 = 50
    });
  });

  describe("Contract Authorization", () => {
    it("should allow admin to authorize contract", () => {
      const { result } = simnet.callPublicFn(
        contractName,
        "authorize-contract",
        [Cl.principal(user1)],
        deployer
      );
      expect(result).toBeOk(Cl.bool(true));
    });

    it("should allow admin to revoke contract", () => {
      simnet.callPublicFn(
        contractName,
        "authorize-contract",
        [Cl.principal(user1)],
        deployer
      );

      const { result } = simnet.callPublicFn(
        contractName,
        "revoke-contract",
        [Cl.principal(user1)],
        deployer
      );
      expect(result).toBeOk(Cl.bool(true));
    });

    it("should check contract authorization status", () => {
      simnet.callPublicFn(
        contractName,
        "authorize-contract",
        [Cl.principal(user1)],
        deployer
      );

      const { result } = simnet.callReadOnlyFn(
        contractName,
        "is-contract-authorized",
        [Cl.principal(user1)],
        deployer
      );
      expect(result).toBeBool(true);
    });
  });

  describe("Admin Functions", () => {
    it("should allow admin to fund rewards pool", () => {
      const { result } = simnet.callPublicFn(
        contractName,
        "fund-rewards-pool",
        [Cl.uint(1000000)], // 1 STX
        deployer
      );
      expect(result).toBeOk(Cl.uint(1000000));
    });

    it("should allow admin to pause contract", () => {
      const { result } = simnet.callPublicFn(
        contractName,
        "pause-contract",
        [],
        deployer
      );
      expect(result).toBeOk(Cl.bool(true));
    });

    it("should reject pause from non-admin", () => {
      const { result } = simnet.callPublicFn(
        contractName,
        "pause-contract",
        [],
        user1
      );
      expect(result).toBeErr(Cl.uint(300)); // ERR_NOT_AUTHORIZED
    });

    it("should block operations when paused", () => {
      simnet.callPublicFn(
        contractName,
        "pause-contract",
        [],
        deployer
      );

      const { result } = simnet.callPublicFn(
        contractName,
        "register-user",
        [],
        user1
      );
      expect(result).toBeErr(Cl.uint(305)); // ERR_CONTRACT_PAUSED
    });
  });

  describe("Read-Only Functions", () => {
    it("should check paused status", () => {
      const { result } = simnet.callReadOnlyFn(
        contractName,
        "is-paused",
        [],
        deployer
      );
      expect(result).toBeBool(false);
    });

    it("should return zero points for unregistered user", () => {
      const { result } = simnet.callReadOnlyFn(
        contractName,
        "get-user-points",
        [Cl.principal(user1)],
        deployer
      );
      expect(result).toBeUint(0);
    });

    it("should return bronze tier for unregistered user", () => {
      const { result } = simnet.callReadOnlyFn(
        contractName,
        "get-user-tier",
        [Cl.principal(user1)],
        deployer
      );
      expect(result).toBeUint(1); // BADGE_TIER_BRONZE
    });

    it("should return none for non-existent badge", () => {
      const { result } = simnet.callReadOnlyFn(
        contractName,
        "get-badge",
        [Cl.uint(999)],
        deployer
      );
      expect(result).toBeNone();
    });

    it("should return false for checking non-existent badge", () => {
      const { result } = simnet.callReadOnlyFn(
        contractName,
        "has-badge",
        [Cl.principal(user1), Cl.uint(999)],
        deployer
      );
      expect(result).toBeBool(false);
    });
  });
});
