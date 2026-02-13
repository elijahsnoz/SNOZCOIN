/**
 * SNOZCOIN Tipping Contract Tests
 * Comprehensive test coverage for creator tipping functionality
 */

import { describe, expect, it, beforeEach } from "vitest";
import { Cl } from "@stacks/transactions";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;
const creator1 = accounts.get("wallet_1")!;
const creator2 = accounts.get("wallet_2")!;
const supporter1 = accounts.get("wallet_3")!;
const supporter2 = accounts.get("wallet_4")!;

const contractName = "snozcoin-tipping";

describe("SNOZCOIN Tipping Contract", () => {
  
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
        "total-creators": Cl.uint(0),
        "total-tips-processed": Cl.uint(0),
        "total-tip-count": Cl.uint(0),
        "total-platform-fees": Cl.uint(0),
        "is-paused": Cl.bool(false),
      });
    });

    it("should return correct minimum tip amount", () => {
      const { result } = simnet.callReadOnlyFn(
        contractName,
        "get-min-tip-amount",
        [],
        deployer
      );
      expect(result).toBeUint(1000); // 0.001 STX
    });

    it("should return correct platform fee", () => {
      const { result } = simnet.callReadOnlyFn(
        contractName,
        "get-platform-fee-bps",
        [],
        deployer
      );
      expect(result).toBeUint(250); // 2.5%
    });
  });

  describe("Creator Registration", () => {
    it("should allow a user to register as creator", () => {
      const { result } = simnet.callPublicFn(
        contractName,
        "register-creator",
        [Cl.stringUtf8("Test Creator"), Cl.stringUtf8("A test creator bio")],
        creator1
      );
      expect(result).toBeOk(Cl.bool(true));
    });

    it("should store creator profile correctly", () => {
      // Register first
      simnet.callPublicFn(
        contractName,
        "register-creator",
        [Cl.stringUtf8("Creator Profile"), Cl.stringUtf8("My bio here")],
        creator1
      );

      const { result } = simnet.callReadOnlyFn(
        contractName,
        "get-creator",
        [Cl.principal(creator1)],
        deployer
      );
      
      // Check that result is Some and has the right structure
      const profile = result as any;
      expect(profile.type).toBe(10); // Some
      expect(profile.value.data.name).toStrictEqual(Cl.stringUtf8("Creator Profile"));
      expect(profile.value.data.bio).toStrictEqual(Cl.stringUtf8("My bio here"));
      expect(profile.value.data["is-active"]).toStrictEqual(Cl.bool(true));
      expect(profile.value.data["is-verified"]).toStrictEqual(Cl.bool(false));
    });

    it("should prevent duplicate registration", () => {
      simnet.callPublicFn(
        contractName,
        "register-creator",
        [Cl.stringUtf8("Creator"), Cl.stringUtf8("Bio")],
        creator1
      );

      const { result } = simnet.callPublicFn(
        contractName,
        "register-creator",
        [Cl.stringUtf8("Creator Again"), Cl.stringUtf8("Bio Again")],
        creator1
      );
      expect(result).toBeErr(Cl.uint(104)); // ERR_CREATOR_ALREADY_REGISTERED
    });

    it("should reject empty name", () => {
      const { result } = simnet.callPublicFn(
        contractName,
        "register-creator",
        [Cl.stringUtf8(""), Cl.stringUtf8("Bio")],
        creator1
      );
      expect(result).toBeErr(Cl.uint(108)); // ERR_INVALID_NAME
    });

    it("should increment total creators count", () => {
      simnet.callPublicFn(
        contractName,
        "register-creator",
        [Cl.stringUtf8("Creator 1"), Cl.stringUtf8("Bio 1")],
        creator1
      );
      simnet.callPublicFn(
        contractName,
        "register-creator",
        [Cl.stringUtf8("Creator 2"), Cl.stringUtf8("Bio 2")],
        creator2
      );

      const { result } = simnet.callReadOnlyFn(
        contractName,
        "get-platform-stats",
        [],
        deployer
      );
      
      const stats = result as any;
      expect(stats.data["total-creators"]).toBeUint(2);
    });
  });

  describe("Creator Profile Management", () => {
    it("should allow creator to update profile", () => {
      simnet.callPublicFn(
        contractName,
        "register-creator",
        [Cl.stringUtf8("Original Name"), Cl.stringUtf8("Original Bio")],
        creator1
      );

      const { result } = simnet.callPublicFn(
        contractName,
        "update-creator-profile",
        [Cl.stringUtf8("Updated Name"), Cl.stringUtf8("Updated Bio")],
        creator1
      );
      expect(result).toBeOk(Cl.bool(true));
    });

    it("should allow creator to set tip goal", () => {
      simnet.callPublicFn(
        contractName,
        "register-creator",
        [Cl.stringUtf8("Creator"), Cl.stringUtf8("Bio")],
        creator1
      );

      const { result } = simnet.callPublicFn(
        contractName,
        "set-tip-goal",
        [Cl.uint(1000000000)], // 1000 STX
        creator1
      );
      expect(result).toBeOk(Cl.bool(true));
    });

    it("should allow creator to deactivate account", () => {
      simnet.callPublicFn(
        contractName,
        "register-creator",
        [Cl.stringUtf8("Creator"), Cl.stringUtf8("Bio")],
        creator1
      );

      const { result } = simnet.callPublicFn(
        contractName,
        "deactivate-creator",
        [],
        creator1
      );
      expect(result).toBeOk(Cl.bool(true));
    });
  });

  describe("Tipping", () => {
    it("should allow supporter to tip creator", () => {
      // Register creator
      simnet.callPublicFn(
        contractName,
        "register-creator",
        [Cl.stringUtf8("Creator"), Cl.stringUtf8("Bio")],
        creator1
      );

      // Tip creator
      const tipAmount = 100000; // 0.1 STX
      const { result } = simnet.callPublicFn(
        contractName,
        "tip-creator",
        [Cl.principal(creator1), Cl.uint(tipAmount), Cl.stringUtf8("Great work!")],
        supporter1
      );
      expect(result).toBeOk(Cl.uint(1)); // First tip ID
    });

    it("should reject tip below minimum", () => {
      simnet.callPublicFn(
        contractName,
        "register-creator",
        [Cl.stringUtf8("Creator"), Cl.stringUtf8("Bio")],
        creator1
      );

      const { result } = simnet.callPublicFn(
        contractName,
        "tip-creator",
        [Cl.principal(creator1), Cl.uint(500), Cl.stringUtf8("Too small")],
        supporter1
      );
      expect(result).toBeErr(Cl.uint(101)); // ERR_INVALID_AMOUNT
    });

    it("should reject self-tipping", () => {
      simnet.callPublicFn(
        contractName,
        "register-creator",
        [Cl.stringUtf8("Creator"), Cl.stringUtf8("Bio")],
        creator1
      );

      const { result } = simnet.callPublicFn(
        contractName,
        "tip-creator",
        [Cl.principal(creator1), Cl.uint(10000), Cl.stringUtf8("Self tip")],
        creator1
      );
      expect(result).toBeErr(Cl.uint(103)); // ERR_SELF_TIP_NOT_ALLOWED
    });

    it("should reject tip to non-existent creator", () => {
      const { result } = simnet.callPublicFn(
        contractName,
        "tip-creator",
        [Cl.principal(creator1), Cl.uint(10000), Cl.stringUtf8("Message")],
        supporter1
      );
      expect(result).toBeErr(Cl.uint(102)); // ERR_CREATOR_NOT_FOUND
    });

    it("should calculate fees correctly", () => {
      simnet.callPublicFn(
        contractName,
        "register-creator",
        [Cl.stringUtf8("Creator"), Cl.stringUtf8("Bio")],
        creator1
      );

      const tipAmount = 100000; // 0.1 STX
      simnet.callPublicFn(
        contractName,
        "tip-creator",
        [Cl.principal(creator1), Cl.uint(tipAmount), Cl.stringUtf8("Message")],
        supporter1
      );

      // Check creator balance (should be 97.5% of tip = 97500)
      const { result } = simnet.callReadOnlyFn(
        contractName,
        "get-creator-balance",
        [Cl.principal(creator1)],
        deployer
      );
      
      const balance = result as any;
      expect(balance.data.balance).toBeUint(97500); // 100000 - 2.5% fee
    });

    it("should track supporter stats", () => {
      simnet.callPublicFn(
        contractName,
        "register-creator",
        [Cl.stringUtf8("Creator"), Cl.stringUtf8("Bio")],
        creator1
      );

      simnet.callPublicFn(
        contractName,
        "tip-creator",
        [Cl.principal(creator1), Cl.uint(100000), Cl.stringUtf8("First tip")],
        supporter1
      );

      const { result } = simnet.callReadOnlyFn(
        contractName,
        "get-supporter-stats",
        [Cl.principal(creator1), Cl.principal(supporter1)],
        deployer
      );

      // Check that result is Some and has the right structure
      const stats = result as any;
      expect(stats.type).toBe(10); // Some
      expect(stats.value.data["total-tipped"]).toStrictEqual(Cl.uint(97500));
      expect(stats.value.data["tip-count"]).toStrictEqual(Cl.uint(1));
    });

    it("should record tip history", () => {
      simnet.callPublicFn(
        contractName,
        "register-creator",
        [Cl.stringUtf8("Creator"), Cl.stringUtf8("Bio")],
        creator1
      );

      simnet.callPublicFn(
        contractName,
        "tip-creator",
        [Cl.principal(creator1), Cl.uint(100000), Cl.stringUtf8("Hello!")],
        supporter1
      );

      const { result } = simnet.callReadOnlyFn(
        contractName,
        "get-tip",
        [Cl.uint(1)],
        deployer
      );

      const tip = result as any;
      expect(tip.type).toBe(10); // Some
    });
  });

  describe("Withdrawals", () => {
    it("should allow creator to withdraw tips", () => {
      simnet.callPublicFn(
        contractName,
        "register-creator",
        [Cl.stringUtf8("Creator"), Cl.stringUtf8("Bio")],
        creator1
      );

      simnet.callPublicFn(
        contractName,
        "tip-creator",
        [Cl.principal(creator1), Cl.uint(100000), Cl.stringUtf8("Message")],
        supporter1
      );

      const { result } = simnet.callPublicFn(
        contractName,
        "withdraw-tips",
        [],
        creator1
      );
      expect(result).toBeOk(Cl.uint(97500));
    });

    it("should reject withdrawal with zero balance", () => {
      simnet.callPublicFn(
        contractName,
        "register-creator",
        [Cl.stringUtf8("Creator"), Cl.stringUtf8("Bio")],
        creator1
      );

      const { result } = simnet.callPublicFn(
        contractName,
        "withdraw-tips",
        [],
        creator1
      );
      expect(result).toBeErr(Cl.uint(107)); // ERR_ZERO_BALANCE
    });

    it("should reset balance after withdrawal", () => {
      simnet.callPublicFn(
        contractName,
        "register-creator",
        [Cl.stringUtf8("Creator"), Cl.stringUtf8("Bio")],
        creator1
      );

      simnet.callPublicFn(
        contractName,
        "tip-creator",
        [Cl.principal(creator1), Cl.uint(100000), Cl.stringUtf8("Message")],
        supporter1
      );

      simnet.callPublicFn(
        contractName,
        "withdraw-tips",
        [],
        creator1
      );

      const { result } = simnet.callReadOnlyFn(
        contractName,
        "get-creator-balance",
        [Cl.principal(creator1)],
        deployer
      );
      
      const balance = result as any;
      expect(balance.data.balance).toBeUint(0);
    });
  });

  describe("Admin Functions", () => {
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
        creator1
      );
      expect(result).toBeErr(Cl.uint(100)); // ERR_NOT_AUTHORIZED
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
        "register-creator",
        [Cl.stringUtf8("Creator"), Cl.stringUtf8("Bio")],
        creator1
      );
      expect(result).toBeErr(Cl.uint(109)); // ERR_CONTRACT_PAUSED
    });

    it("should allow admin to unpause contract", () => {
      simnet.callPublicFn(
        contractName,
        "pause-contract",
        [],
        deployer
      );

      const { result } = simnet.callPublicFn(
        contractName,
        "unpause-contract",
        [],
        deployer
      );
      expect(result).toBeOk(Cl.bool(true));
    });

    it("should allow admin to verify creator", () => {
      simnet.callPublicFn(
        contractName,
        "register-creator",
        [Cl.stringUtf8("Creator"), Cl.stringUtf8("Bio")],
        creator1
      );

      const { result } = simnet.callPublicFn(
        contractName,
        "verify-creator",
        [Cl.principal(creator1)],
        deployer
      );
      expect(result).toBeOk(Cl.bool(true));
    });

    it("should allow admin to withdraw platform fees", () => {
      simnet.callPublicFn(
        contractName,
        "register-creator",
        [Cl.stringUtf8("Creator"), Cl.stringUtf8("Bio")],
        creator1
      );

      simnet.callPublicFn(
        contractName,
        "tip-creator",
        [Cl.principal(creator1), Cl.uint(100000), Cl.stringUtf8("Message")],
        supporter1
      );

      const { result } = simnet.callPublicFn(
        contractName,
        "withdraw-platform-fees",
        [],
        deployer
      );
      expect(result).toBeOk(Cl.uint(2500)); // 2.5% of 100000
    });
  });

  describe("Read-Only Functions", () => {
    it("should check if creator is registered", () => {
      simnet.callPublicFn(
        contractName,
        "register-creator",
        [Cl.stringUtf8("Creator"), Cl.stringUtf8("Bio")],
        creator1
      );

      const { result } = simnet.callReadOnlyFn(
        contractName,
        "is-creator-registered",
        [Cl.principal(creator1)],
        deployer
      );
      expect(result).toBeBool(true);
    });

    it("should return false for non-registered creator", () => {
      const { result } = simnet.callReadOnlyFn(
        contractName,
        "is-creator-registered",
        [Cl.principal(creator1)],
        deployer
      );
      expect(result).toBeBool(false);
    });

    it("should check paused status", () => {
      const { result } = simnet.callReadOnlyFn(
        contractName,
        "is-paused",
        [],
        deployer
      );
      expect(result).toBeBool(false);
    });
  });
});
