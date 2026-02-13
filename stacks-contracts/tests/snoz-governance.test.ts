import { describe, expect, it } from "vitest";
import { Cl, ClarityType } from "@stacks/transactions";

// Test addresses
const deployer = "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM";
const wallet1 = "ST1SJ3DTE5DN7X54YDH5D64R3BCB6A2AG2ZQ8YPD5";
const wallet2 = "ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG";
const wallet3 = "ST2JHG361ZXG51QTKY2NQCVBPPRRE2KZB1HR05NNC";

const contractName = "snoz-governance";

describe("SNOZ Governance Contract", () => {
  describe("Initial State", () => {
    it("should have governance disabled by default", () => {
      const response = simnet.callReadOnlyFn(
        contractName,
        "get-governance-params",
        [],
        deployer
      );
      const params = response.result as any;
      expect(params.data["governance-active"].type).toBe(ClarityType.BoolFalse);
    });

    it("should have correct default parameters", () => {
      const response = simnet.callReadOnlyFn(
        contractName,
        "get-governance-params",
        [],
        deployer
      );
      const params = response.result as any;
      expect(params.data["quorum-percent"].value).toBe(10n);
      expect(params.data["pass-threshold"].value).toBe(51n);
      expect(params.data["voting-period"].value).toBe(1008n);
      expect(params.data["proposal-count"].value).toBe(0n);
    });

    it("should not be paused initially", () => {
      const response = simnet.callReadOnlyFn(
        contractName,
        "get-governance-params",
        [],
        deployer
      );
      const params = response.result as any;
      expect(params.data["is-paused"].type).toBe(ClarityType.BoolFalse);
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

    it("should identify non-admin correctly", () => {
      const response = simnet.callReadOnlyFn(
        contractName,
        "is-admin",
        [Cl.principal(wallet1)],
        deployer
      );
      expect(response.result.type).toBe(ClarityType.BoolFalse);
    });

    it("should identify non-council member correctly", () => {
      const response = simnet.callReadOnlyFn(
        contractName,
        "is-council-member",
        [Cl.principal(wallet1)],
        deployer
      );
      expect(response.result.type).toBe(ClarityType.BoolFalse);
    });
  });

  describe("Council Management", () => {
    it("should allow admin to add council member", () => {
      const response = simnet.callPublicFn(
        contractName,
        "add-council-member",
        [Cl.principal(wallet1), Cl.stringAscii("moderator")],
        deployer
      );
      expect(response.result.type).toBe(ClarityType.ResponseOk);

      // Verify membership
      const isMember = simnet.callReadOnlyFn(
        contractName,
        "is-council-member",
        [Cl.principal(wallet1)],
        deployer
      );
      expect(isMember.result.type).toBe(ClarityType.BoolTrue);
    });

    it("should reject non-admin adding council member", () => {
      const response = simnet.callPublicFn(
        contractName,
        "add-council-member",
        [Cl.principal(wallet2), Cl.stringAscii("moderator")],
        wallet1
      );
      expect(response.result.type).toBe(ClarityType.ResponseErr);
    });

    it("should allow admin to remove council member", () => {
      // First add
      simnet.callPublicFn(
        contractName,
        "add-council-member",
        [Cl.principal(wallet1), Cl.stringAscii("moderator")],
        deployer
      );

      // Then remove
      const response = simnet.callPublicFn(
        contractName,
        "remove-council-member",
        [Cl.principal(wallet1)],
        deployer
      );
      expect(response.result.type).toBe(ClarityType.ResponseOk);

      // Verify removal
      const isMember = simnet.callReadOnlyFn(
        contractName,
        "is-council-member",
        [Cl.principal(wallet1)],
        deployer
      );
      expect(isMember.result.type).toBe(ClarityType.BoolFalse);
    });
  });

  describe("Governance Controls", () => {
    it("should allow admin to enable governance", () => {
      const response = simnet.callPublicFn(
        contractName,
        "enable-governance",
        [],
        deployer
      );
      expect(response.result.type).toBe(ClarityType.ResponseOk);

      // Verify enabled
      const params = simnet.callReadOnlyFn(
        contractName,
        "get-governance-params",
        [],
        deployer
      );
      const paramsData = params.result as any;
      expect(paramsData.data["governance-active"].type).toBe(ClarityType.BoolTrue);
    });

    it("should allow admin to disable governance", () => {
      // First enable
      simnet.callPublicFn(contractName, "enable-governance", [], deployer);

      // Then disable
      const response = simnet.callPublicFn(
        contractName,
        "disable-governance",
        [],
        deployer
      );
      expect(response.result.type).toBe(ClarityType.ResponseOk);
    });

    it("should reject non-admin enabling governance", () => {
      const response = simnet.callPublicFn(
        contractName,
        "enable-governance",
        [],
        wallet1
      );
      expect(response.result.type).toBe(ClarityType.ResponseErr);
    });
  });

  describe("Governance Parameters", () => {
    it("should allow admin to update quorum percent", () => {
      const response = simnet.callPublicFn(
        contractName,
        "set-quorum-percent",
        [Cl.uint(20)],
        deployer
      );
      expect(response.result.type).toBe(ClarityType.ResponseOk);
    });

    it("should reject invalid quorum percent (0)", () => {
      const response = simnet.callPublicFn(
        contractName,
        "set-quorum-percent",
        [Cl.uint(0)],
        deployer
      );
      expect(response.result.type).toBe(ClarityType.ResponseErr);
    });

    it("should reject invalid quorum percent (>100)", () => {
      const response = simnet.callPublicFn(
        contractName,
        "set-quorum-percent",
        [Cl.uint(101)],
        deployer
      );
      expect(response.result.type).toBe(ClarityType.ResponseErr);
    });

    it("should allow admin to update pass threshold", () => {
      const response = simnet.callPublicFn(
        contractName,
        "set-pass-threshold",
        [Cl.uint(66)],
        deployer
      );
      expect(response.result.type).toBe(ClarityType.ResponseOk);
    });

    it("should allow admin to update voting period", () => {
      const response = simnet.callPublicFn(
        contractName,
        "set-voting-period",
        [Cl.uint(2016)], // ~14 days
        deployer
      );
      expect(response.result.type).toBe(ClarityType.ResponseOk);
    });

    it("should allow admin to update min proposal power", () => {
      const response = simnet.callPublicFn(
        contractName,
        "set-min-proposal-power",
        [Cl.uint(5000000000n)], // 5000 SNOZ
        deployer
      );
      expect(response.result.type).toBe(ClarityType.ResponseOk);
    });
  });

  describe("Voting Power", () => {
    it("should allow admin to update voting power", () => {
      const response = simnet.callPublicFn(
        contractName,
        "update-voting-power",
        [Cl.principal(wallet1), Cl.uint(1000000000n)],
        deployer
      );
      expect(response.result.type).toBe(ClarityType.ResponseOk);
    });

    it("should return effective voting power", () => {
      // Update voting power
      simnet.callPublicFn(
        contractName,
        "update-voting-power",
        [Cl.principal(wallet1), Cl.uint(1000000000n)],
        deployer
      );

      const power = simnet.callReadOnlyFn(
        contractName,
        "get-effective-voting-power",
        [Cl.principal(wallet1)],
        deployer
      );
      expect(power.result).toStrictEqual(Cl.uint(1000000000n));
    });

    it("should reject non-admin updating voting power", () => {
      const response = simnet.callPublicFn(
        contractName,
        "update-voting-power",
        [Cl.principal(wallet2), Cl.uint(1000000000n)],
        wallet1
      );
      expect(response.result.type).toBe(ClarityType.ResponseErr);
    });
  });

  describe("Delegation", () => {
    it("should allow user to delegate voting power", () => {
      // First give user some voting power
      simnet.callPublicFn(
        contractName,
        "update-voting-power",
        [Cl.principal(wallet1), Cl.uint(1000000000n)],
        deployer
      );

      // Then delegate
      const response = simnet.callPublicFn(
        contractName,
        "delegate-voting-power",
        [Cl.principal(wallet2)],
        wallet1
      );
      expect(response.result.type).toBe(ClarityType.ResponseOk);
    });

    it("should reject delegation without voting power", () => {
      const response = simnet.callPublicFn(
        contractName,
        "delegate-voting-power",
        [Cl.principal(wallet2)],
        wallet3 // Has no voting power
      );
      expect(response.result.type).toBe(ClarityType.ResponseErr);
    });

    it("should allow user to revoke delegation", () => {
      // Setup: give power and delegate
      simnet.callPublicFn(
        contractName,
        "update-voting-power",
        [Cl.principal(wallet1), Cl.uint(1000000000n)],
        deployer
      );
      simnet.callPublicFn(
        contractName,
        "delegate-voting-power",
        [Cl.principal(wallet2)],
        wallet1
      );

      // Revoke
      const response = simnet.callPublicFn(
        contractName,
        "revoke-delegation",
        [],
        wallet1
      );
      expect(response.result.type).toBe(ClarityType.ResponseOk);
    });

    it("should return zero effective power when delegated", () => {
      // Setup: give power and delegate
      simnet.callPublicFn(
        contractName,
        "update-voting-power",
        [Cl.principal(wallet1), Cl.uint(1000000000n)],
        deployer
      );
      simnet.callPublicFn(
        contractName,
        "delegate-voting-power",
        [Cl.principal(wallet2)],
        wallet1
      );

      // Check delegator's effective power (should be 0)
      const power = simnet.callReadOnlyFn(
        contractName,
        "get-effective-voting-power",
        [Cl.principal(wallet1)],
        deployer
      );
      expect(power.result).toStrictEqual(Cl.uint(0));
    });

    it("should add delegated power to delegate", () => {
      // Setup: give power to wallet1 and delegate to wallet2
      simnet.callPublicFn(
        contractName,
        "update-voting-power",
        [Cl.principal(wallet1), Cl.uint(1000000000n)],
        deployer
      );
      simnet.callPublicFn(
        contractName,
        "delegate-voting-power",
        [Cl.principal(wallet2)],
        wallet1
      );

      // Check delegate's effective power
      const power = simnet.callReadOnlyFn(
        contractName,
        "get-effective-voting-power",
        [Cl.principal(wallet2)],
        deployer
      );
      expect(power.result).toStrictEqual(Cl.uint(1000000000n));
    });
  });

  describe("Snapshots", () => {
    it("should allow council member to create snapshot", () => {
      // Add wallet1 as council member
      simnet.callPublicFn(
        contractName,
        "add-council-member",
        [Cl.principal(wallet1), Cl.stringAscii("moderator")],
        deployer
      );

      // Create snapshot
      const response = simnet.callPublicFn(
        contractName,
        "create-snapshot",
        [],
        wallet1
      );
      expect(response.result.type).toBe(ClarityType.ResponseOk);
    });

    it("should reject non-council creating snapshot", () => {
      const response = simnet.callPublicFn(
        contractName,
        "create-snapshot",
        [],
        wallet2
      );
      expect(response.result.type).toBe(ClarityType.ResponseErr);
    });

    it("should allow recording snapshot balance", () => {
      // Create snapshot first
      simnet.callPublicFn(contractName, "create-snapshot", [], deployer);

      // Record balance
      const response = simnet.callPublicFn(
        contractName,
        "record-snapshot-balance",
        [Cl.uint(0), Cl.principal(wallet1), Cl.uint(5000000000n)],
        deployer
      );
      expect(response.result.type).toBe(ClarityType.ResponseOk);

      // Verify balance
      const balance = simnet.callReadOnlyFn(
        contractName,
        "get-snapshot-balance",
        [Cl.uint(0), Cl.principal(wallet1)],
        deployer
      );
      expect(balance.result).toStrictEqual(Cl.uint(5000000000n));
    });
  });

  describe("Proposal System (when governance inactive)", () => {
    it("should reject proposal creation when governance inactive", () => {
      const response = simnet.callPublicFn(
        contractName,
        "create-proposal",
        [
          Cl.stringUtf8("Test Proposal"),
          Cl.stringUtf8("This is a test proposal description")
        ],
        deployer
      );
      expect(response.result.type).toBe(ClarityType.ResponseErr);
    });
  });

  describe("Proposal System (when governance active)", () => {
    it("should allow proposal creation with sufficient voting power", () => {
      // Enable governance and set voting power
      simnet.callPublicFn(contractName, "enable-governance", [], deployer);
      simnet.callPublicFn(
        contractName,
        "update-voting-power",
        [Cl.principal(wallet1), Cl.uint(2000000000n)], // 2000 SNOZ > min 1000
        deployer
      );

      const response = simnet.callPublicFn(
        contractName,
        "create-proposal",
        [
          Cl.stringUtf8("Test Proposal"),
          Cl.stringUtf8("This is a test proposal")
        ],
        wallet1
      );
      expect(response.result.type).toBe(ClarityType.ResponseOk);
    });

    it("should reject proposal creation without sufficient voting power", () => {
      simnet.callPublicFn(contractName, "enable-governance", [], deployer);
      simnet.callPublicFn(
        contractName,
        "update-voting-power",
        [Cl.principal(wallet2), Cl.uint(100000000n)], // 100 SNOZ < min 1000
        deployer
      );

      const response = simnet.callPublicFn(
        contractName,
        "create-proposal",
        [
          Cl.stringUtf8("Test Proposal"),
          Cl.stringUtf8("This is a test proposal")
        ],
        wallet2
      );
      expect(response.result.type).toBe(ClarityType.ResponseErr);
    });
  });

  describe("Voting (when governance active)", () => {
    it("should allow voting on active proposal", () => {
      // Setup
      simnet.callPublicFn(contractName, "enable-governance", [], deployer);
      simnet.callPublicFn(
        contractName,
        "update-voting-power",
        [Cl.principal(wallet1), Cl.uint(2000000000n)],
        deployer
      );
      simnet.callPublicFn(
        contractName,
        "update-voting-power",
        [Cl.principal(wallet2), Cl.uint(1000000000n)],
        deployer
      );

      // Create proposal
      simnet.callPublicFn(
        contractName,
        "create-proposal",
        [
          Cl.stringUtf8("Test Proposal"),
          Cl.stringUtf8("This is a test proposal")
        ],
        wallet1
      );

      // Vote
      const response = simnet.callPublicFn(
        contractName,
        "vote",
        [Cl.uint(0), Cl.uint(1)], // proposal 0, vote FOR
        wallet2
      );
      expect(response.result.type).toBe(ClarityType.ResponseOk);
    });

    it("should reject double voting", () => {
      // Setup
      simnet.callPublicFn(contractName, "enable-governance", [], deployer);
      simnet.callPublicFn(
        contractName,
        "update-voting-power",
        [Cl.principal(wallet1), Cl.uint(2000000000n)],
        deployer
      );
      simnet.callPublicFn(
        contractName,
        "update-voting-power",
        [Cl.principal(wallet2), Cl.uint(1000000000n)],
        deployer
      );

      // Create proposal
      simnet.callPublicFn(
        contractName,
        "create-proposal",
        [
          Cl.stringUtf8("Test Proposal"),
          Cl.stringUtf8("This is a test proposal")
        ],
        wallet1
      );

      // First vote
      simnet.callPublicFn(
        contractName,
        "vote",
        [Cl.uint(0), Cl.uint(1)],
        wallet2
      );

      // Second vote (should fail)
      const response = simnet.callPublicFn(
        contractName,
        "vote",
        [Cl.uint(0), Cl.uint(2)], // Try to change vote
        wallet2
      );
      expect(response.result.type).toBe(ClarityType.ResponseErr);
    });

    it("should reject voting without voting power", () => {
      // Setup
      simnet.callPublicFn(contractName, "enable-governance", [], deployer);
      simnet.callPublicFn(
        contractName,
        "update-voting-power",
        [Cl.principal(wallet1), Cl.uint(2000000000n)],
        deployer
      );

      // Create proposal
      simnet.callPublicFn(
        contractName,
        "create-proposal",
        [
          Cl.stringUtf8("Test Proposal"),
          Cl.stringUtf8("This is a test proposal")
        ],
        wallet1
      );

      // Try to vote without power
      const response = simnet.callPublicFn(
        contractName,
        "vote",
        [Cl.uint(0), Cl.uint(1)],
        wallet3 // Has no voting power
      );
      expect(response.result.type).toBe(ClarityType.ResponseErr);
    });
  });

  describe("Helper Functions", () => {
    it("should return correct proposal state name", () => {
      expect(simnet.callReadOnlyFn(contractName, "get-proposal-state-name", [Cl.uint(0)], deployer).result)
        .toStrictEqual(Cl.stringAscii("draft"));
      expect(simnet.callReadOnlyFn(contractName, "get-proposal-state-name", [Cl.uint(1)], deployer).result)
        .toStrictEqual(Cl.stringAscii("active"));
      expect(simnet.callReadOnlyFn(contractName, "get-proposal-state-name", [Cl.uint(2)], deployer).result)
        .toStrictEqual(Cl.stringAscii("passed"));
      expect(simnet.callReadOnlyFn(contractName, "get-proposal-state-name", [Cl.uint(3)], deployer).result)
        .toStrictEqual(Cl.stringAscii("rejected"));
    });

    it("should return correct vote type name", () => {
      expect(simnet.callReadOnlyFn(contractName, "get-vote-type-name", [Cl.uint(1)], deployer).result)
        .toStrictEqual(Cl.stringAscii("for"));
      expect(simnet.callReadOnlyFn(contractName, "get-vote-type-name", [Cl.uint(2)], deployer).result)
        .toStrictEqual(Cl.stringAscii("against"));
      expect(simnet.callReadOnlyFn(contractName, "get-vote-type-name", [Cl.uint(3)], deployer).result)
        .toStrictEqual(Cl.stringAscii("abstain"));
    });
  });

  describe("Pause Functionality", () => {
    it("should allow admin to pause", () => {
      const response = simnet.callPublicFn(contractName, "pause", [], deployer);
      expect(response.result.type).toBe(ClarityType.ResponseOk);
    });

    it("should allow admin to unpause", () => {
      simnet.callPublicFn(contractName, "pause", [], deployer);
      const response = simnet.callPublicFn(contractName, "unpause", [], deployer);
      expect(response.result.type).toBe(ClarityType.ResponseOk);
    });

    it("should reject non-admin pause", () => {
      const response = simnet.callPublicFn(contractName, "pause", [], wallet1);
      expect(response.result.type).toBe(ClarityType.ResponseErr);
    });

    it("should reject operations when paused", () => {
      simnet.callPublicFn(contractName, "pause", [], deployer);
      
      const response = simnet.callPublicFn(
        contractName,
        "delegate-voting-power",
        [Cl.principal(wallet2)],
        wallet1
      );
      expect(response.result.type).toBe(ClarityType.ResponseErr);
    });
  });
});
