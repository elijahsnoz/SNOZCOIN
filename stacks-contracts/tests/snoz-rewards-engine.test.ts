import { describe, expect, it, beforeEach } from "vitest";
import { Cl, ClarityType } from "@stacks/transactions";

// Test addresses
const deployer = "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM";
const wallet1 = "ST1SJ3DTE5DN7X54YDH5D64R3BCB6A2AG2ZQ8YPD5";
const wallet2 = "ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG";
const wallet3 = "ST2JHG361ZXG51QTKY2NQCVBPPRRE2KZB1HR05NNC";

const contractName = "snoz-rewards-engine";

describe("SNOZ Rewards Engine Contract", () => {
  describe("Initial State", () => {
    it("should return reward rates", () => {
      const response = simnet.callReadOnlyFn(
        contractName,
        "get-reward-rates",
        [],
        deployer
      );
      const rates = response.result as any;
      expect(rates.data).toHaveProperty("tip-reward-rate");
      expect(rates.data).toHaveProperty("content-reward-rate");
      expect(rates.data).toHaveProperty("first-tip-bonus");
      expect(rates.data).toHaveProperty("monthly-bonus");
      expect(rates.data).toHaveProperty("creator-bonus");
    });

    it("should return initial stats with zero values", () => {
      const response = simnet.callReadOnlyFn(
        contractName,
        "get-stats",
        [],
        deployer
      );
      const stats = response.result as any;
      expect(stats.data["total-snoz-distributed"].value).toBe(0n);
      expect(stats.data["total-rewards-claimed"].value).toBe(0n);
      expect(stats.data["is-paused"].type).toBe(ClarityType.BoolFalse);
    });
  });

  describe("Authorization", () => {
    it("should identify deployer as admin", () => {
      const response = simnet.callReadOnlyFn(
        contractName,
        "is-admin",
        [Cl.principal(deployer)],
        deployer
      );
      expect(response.result.type).toBe(ClarityType.BoolTrue);
    });

    it("should identify non-admin as not admin", () => {
      const response = simnet.callReadOnlyFn(
        contractName,
        "is-admin",
        [Cl.principal(wallet1)],
        deployer
      );
      expect(response.result.type).toBe(ClarityType.BoolFalse);
    });

    it("should allow admin to authorize contract", () => {
      const response = simnet.callPublicFn(
        contractName,
        "authorize-contract",
        [Cl.principal(wallet1)],
        deployer
      );
      expect(response.result).toBeOk(Cl.bool(true));

      // Verify authorization
      const isAuthorized = simnet.callReadOnlyFn(
        contractName,
        "is-authorized-contract",
        [Cl.principal(wallet1)],
        deployer
      );
      expect(isAuthorized.result.type).toBe(ClarityType.BoolTrue);
    });

    it("should reject non-admin authorizing contract", () => {
      const response = simnet.callPublicFn(
        contractName,
        "authorize-contract",
        [Cl.principal(wallet2)],
        wallet1
      );
      expect(response.result).toBeErr(Cl.uint(500)); // ERR_NOT_AUTHORIZED
    });

    it("should allow admin to revoke contract authorization", () => {
      // First authorize
      simnet.callPublicFn(
        contractName,
        "authorize-contract",
        [Cl.principal(wallet1)],
        deployer
      );

      // Then revoke
      const response = simnet.callPublicFn(
        contractName,
        "revoke-contract-authorization",
        [Cl.principal(wallet1)],
        deployer
      );
      expect(response.result).toBeOk(Cl.bool(true));

      // Verify revoked
      const isAuthorized = simnet.callReadOnlyFn(
        contractName,
        "is-authorized-contract",
        [Cl.principal(wallet1)],
        deployer
      );
      expect(isAuthorized.result.type).toBe(ClarityType.BoolFalse);
    });
  });

  describe("Tip Rewards", () => {
    it("should calculate tip reward correctly", () => {
      // Default rate: 2 SNOZ per 1 STX
      const stxAmount = 1000000n; // 1 STX in microSTX
      const response = simnet.callReadOnlyFn(
        contractName,
        "preview-tip-reward",
        [Cl.uint(stxAmount)],
        deployer
      );
      // Expected: 1 STX * 2 SNOZ = 2 SNOZ = 2000000 microSNOZ
      expect(response.result).toStrictEqual(Cl.uint(2000000n));
    });

    it("should reward supporter for tipping", () => {
      const stxAmount = 5000000n; // 5 STX
      const response = simnet.callPublicFn(
        contractName,
        "reward-for-tip",
        [Cl.principal(wallet1), Cl.principal(wallet2), Cl.uint(stxAmount)],
        deployer
      );
      expect(response.result.type).toBe(ClarityType.ResponseOk);

      // Check user profile was created
      const profile = simnet.callReadOnlyFn(
        contractName,
        "get-user-profile",
        [Cl.principal(wallet1)],
        deployer
      );
      expect(profile.result.type).not.toBe(ClarityType.OptionalNone);
    });

    it("should reject tip reward from unauthorized caller", () => {
      const response = simnet.callPublicFn(
        contractName,
        "reward-for-tip",
        [Cl.principal(wallet1), Cl.principal(wallet2), Cl.uint(1000000n)],
        wallet3 // Not authorized
      );
      expect(response.result).toBeErr(Cl.uint(500)); // ERR_NOT_AUTHORIZED
    });

    it("should reject tip reward with zero amount", () => {
      const response = simnet.callPublicFn(
        contractName,
        "reward-for-tip",
        [Cl.principal(wallet1), Cl.principal(wallet2), Cl.uint(0)],
        deployer
      );
      expect(response.result).toBeErr(Cl.uint(502)); // ERR_INVALID_AMOUNT
    });

    it("should track unique supporters for creator", () => {
      // First tip
      simnet.callPublicFn(
        contractName,
        "reward-for-tip",
        [Cl.principal(wallet1), Cl.principal(wallet3), Cl.uint(1000000n)],
        deployer
      );

      // Second tip from different supporter
      simnet.callPublicFn(
        contractName,
        "reward-for-tip",
        [Cl.principal(wallet2), Cl.principal(wallet3), Cl.uint(1000000n)],
        deployer
      );

      // Check creator profile
      const profile = simnet.callReadOnlyFn(
        contractName,
        "get-creator-profile",
        [Cl.principal(wallet3)],
        deployer
      );
      const profileData = profile.result as any;
      expect(profileData.value.data["unique-supporters"].value).toBe(2n);
    });
  });

  describe("Content Purchase Rewards", () => {
    it("should calculate content reward correctly", () => {
      // Default rate: 1.5 SNOZ per 1 STX
      const stxAmount = 1000000n; // 1 STX
      const response = simnet.callReadOnlyFn(
        contractName,
        "preview-content-reward",
        [Cl.uint(stxAmount)],
        deployer
      );
      // Expected: 1 STX * 1.5 SNOZ = 1.5 SNOZ = 1500000 microSNOZ
      expect(response.result).toStrictEqual(Cl.uint(1500000n));
    });

    it("should reward buyer for content purchase", () => {
      const stxAmount = 2000000n; // 2 STX
      const response = simnet.callPublicFn(
        contractName,
        "reward-for-content-purchase",
        [Cl.principal(wallet1), Cl.principal(wallet2), Cl.uint(stxAmount)],
        deployer
      );
      expect(response.result.type).toBe(ClarityType.ResponseOk);
    });

    it("should update user profile after content purchase", () => {
      simnet.callPublicFn(
        contractName,
        "reward-for-content-purchase",
        [Cl.principal(wallet1), Cl.principal(wallet2), Cl.uint(1000000n)],
        deployer
      );

      const profile = simnet.callReadOnlyFn(
        contractName,
        "get-user-profile",
        [Cl.principal(wallet1)],
        deployer
      );
      const profileData = profile.result as any;
      expect(profileData.value.data["content-purchases-rewarded"].value).toBe(1n);
    });
  });

  describe("Creator Registration Rewards", () => {
    it("should reward creator for registration", () => {
      const response = simnet.callPublicFn(
        contractName,
        "reward-creator-registration",
        [Cl.principal(wallet1)],
        deployer
      );
      expect(response.result.type).toBe(ClarityType.ResponseOk);
    });

    it("should mark user as creator after registration", () => {
      simnet.callPublicFn(
        contractName,
        "reward-creator-registration",
        [Cl.principal(wallet1)],
        deployer
      );

      const profile = simnet.callReadOnlyFn(
        contractName,
        "get-user-profile",
        [Cl.principal(wallet1)],
        deployer
      );
      const profileData = profile.result as any;
      expect(profileData.value.data["is-creator"].type).toBe(ClarityType.BoolTrue);
    });

    it("should create creator profile on registration", () => {
      simnet.callPublicFn(
        contractName,
        "reward-creator-registration",
        [Cl.principal(wallet1)],
        deployer
      );

      const profile = simnet.callReadOnlyFn(
        contractName,
        "get-creator-profile",
        [Cl.principal(wallet1)],
        deployer
      );
      expect(profile.result.type).not.toBe(ClarityType.OptionalNone);
    });
  });

  describe("Tier System", () => {
    it("should return correct tier name for Bronze", () => {
      const response = simnet.callReadOnlyFn(
        contractName,
        "get-tier-name",
        [Cl.uint(0)],
        deployer
      );
      expect(response.result).toStrictEqual(Cl.stringAscii("Bronze"));
    });

    it("should return correct tier name for Silver", () => {
      const response = simnet.callReadOnlyFn(
        contractName,
        "get-tier-name",
        [Cl.uint(1)],
        deployer
      );
      expect(response.result).toStrictEqual(Cl.stringAscii("Silver"));
    });

    it("should return correct tier name for Gold", () => {
      const response = simnet.callReadOnlyFn(
        contractName,
        "get-tier-name",
        [Cl.uint(2)],
        deployer
      );
      expect(response.result).toStrictEqual(Cl.stringAscii("Gold"));
    });

    it("should return correct tier name for Platinum", () => {
      const response = simnet.callReadOnlyFn(
        contractName,
        "get-tier-name",
        [Cl.uint(3)],
        deployer
      );
      expect(response.result).toStrictEqual(Cl.stringAscii("Platinum"));
    });

    it("should return correct tier name for Diamond", () => {
      const response = simnet.callReadOnlyFn(
        contractName,
        "get-tier-name",
        [Cl.uint(4)],
        deployer
      );
      expect(response.result).toStrictEqual(Cl.stringAscii("Diamond"));
    });
  });

  describe("Milestone System", () => {
    it("should return milestone eligibility for non-creator", () => {
      const response = simnet.callReadOnlyFn(
        contractName,
        "check-milestone-eligibility",
        [Cl.principal(wallet1)],
        deployer
      );
      const milestones = response.result as any;
      expect(milestones.data["supporters"].value).toBe(0n);
    });

    it("should reject milestone claim from non-creator", () => {
      const response = simnet.callPublicFn(
        contractName,
        "claim-creator-milestone",
        [Cl.uint(10)],
        wallet1
      );
      expect(response.result).toBeErr(Cl.uint(503)); // ERR_USER_NOT_FOUND
    });

    it("should reject milestone claim when not reached", () => {
      // Register as creator
      simnet.callPublicFn(
        contractName,
        "reward-creator-registration",
        [Cl.principal(wallet1)],
        deployer
      );

      // Try to claim milestone without enough supporters
      const response = simnet.callPublicFn(
        contractName,
        "claim-creator-milestone",
        [Cl.uint(10)],
        wallet1
      );
      expect(response.result).toBeErr(Cl.uint(506)); // ERR_MILESTONE_NOT_REACHED
    });
  });

  describe("Monthly Bonus", () => {
    it("should check monthly bonus eligibility", () => {
      const response = simnet.callReadOnlyFn(
        contractName,
        "check-monthly-bonus-eligibility",
        [Cl.principal(wallet1)],
        deployer
      );
      const eligibility = response.result as any;
      expect(eligibility.data).toHaveProperty("eligible");
      expect(eligibility.data).toHaveProperty("tips-this-month");
      expect(eligibility.data).toHaveProperty("tips-required");
    });

    it("should reject monthly bonus when not eligible", () => {
      const response = simnet.callPublicFn(
        contractName,
        "claim-monthly-bonus",
        [],
        wallet1
      );
      expect(response.result).toBeErr(Cl.uint(506)); // ERR_MILESTONE_NOT_REACHED
    });
  });

  describe("Admin Functions", () => {
    it("should allow admin to update tip reward rate", () => {
      const newRate = 3000000n; // 3 SNOZ per STX
      const response = simnet.callPublicFn(
        contractName,
        "set-tip-reward-rate",
        [Cl.uint(newRate)],
        deployer
      );
      expect(response.result).toBeOk(Cl.bool(true));
    });

    it("should reject zero rate", () => {
      const response = simnet.callPublicFn(
        contractName,
        "set-tip-reward-rate",
        [Cl.uint(0)],
        deployer
      );
      expect(response.result).toBeErr(Cl.uint(507)); // ERR_INVALID_RATE
    });

    it("should allow admin to update content reward rate", () => {
      const newRate = 2000000n;
      const response = simnet.callPublicFn(
        contractName,
        "set-content-reward-rate",
        [Cl.uint(newRate)],
        deployer
      );
      expect(response.result).toBeOk(Cl.bool(true));
    });

    it("should allow admin to update first tip bonus", () => {
      const newBonus = 20000000n; // 20 SNOZ
      const response = simnet.callPublicFn(
        contractName,
        "set-first-tip-bonus",
        [Cl.uint(newBonus)],
        deployer
      );
      expect(response.result).toBeOk(Cl.bool(true));
    });

    it("should allow admin to update monthly bonus", () => {
      const newBonus = 100000000n; // 100 SNOZ
      const response = simnet.callPublicFn(
        contractName,
        "set-monthly-bonus",
        [Cl.uint(newBonus)],
        deployer
      );
      expect(response.result).toBeOk(Cl.bool(true));
    });

    it("should allow admin to update creator bonus", () => {
      const newBonus = 200000000n; // 200 SNOZ
      const response = simnet.callPublicFn(
        contractName,
        "set-creator-bonus",
        [Cl.uint(newBonus)],
        deployer
      );
      expect(response.result).toBeOk(Cl.bool(true));
    });

    it("should reject non-admin updating rates", () => {
      const response = simnet.callPublicFn(
        contractName,
        "set-tip-reward-rate",
        [Cl.uint(3000000n)],
        wallet1
      );
      expect(response.result).toBeErr(Cl.uint(500)); // ERR_NOT_AUTHORIZED
    });
  });

  describe("Pause Functionality", () => {
    it("should allow admin to pause contract", () => {
      const response = simnet.callPublicFn(
        contractName,
        "pause",
        [],
        deployer
      );
      expect(response.result).toBeOk(Cl.bool(true));
    });

    it("should reject rewards when paused", () => {
      simnet.callPublicFn(contractName, "pause", [], deployer);

      const response = simnet.callPublicFn(
        contractName,
        "reward-for-tip",
        [Cl.principal(wallet1), Cl.principal(wallet2), Cl.uint(1000000n)],
        deployer
      );
      expect(response.result).toBeErr(Cl.uint(501)); // ERR_PAUSED
    });

    it("should allow admin to unpause contract", () => {
      simnet.callPublicFn(contractName, "pause", [], deployer);
      
      const response = simnet.callPublicFn(
        contractName,
        "unpause",
        [],
        deployer
      );
      expect(response.result).toBeOk(Cl.bool(true));
    });

    it("should reject non-admin pause", () => {
      const response = simnet.callPublicFn(
        contractName,
        "pause",
        [],
        wallet1
      );
      expect(response.result).toBeErr(Cl.uint(500)); // ERR_NOT_AUTHORIZED
    });
  });

  describe("Reward History", () => {
    it("should track reward distribution stats", () => {
      // Issue some rewards
      simnet.callPublicFn(
        contractName,
        "reward-for-tip",
        [Cl.principal(wallet1), Cl.principal(wallet2), Cl.uint(1000000n)],
        deployer
      );

      simnet.callPublicFn(
        contractName,
        "reward-for-content-purchase",
        [Cl.principal(wallet2), Cl.principal(wallet3), Cl.uint(2000000n)],
        deployer
      );

      const stats = simnet.callReadOnlyFn(
        contractName,
        "get-stats",
        [],
        deployer
      );
      const statsData = stats.result as any;
      expect(statsData.data["total-rewards-claimed"].value).toBeGreaterThan(0n);
    });
  });
});
