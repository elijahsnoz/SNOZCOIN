/**
 * SNOZCOIN Unlockable Content Contract Tests
 * Comprehensive test coverage for content locking and purchasing
 */

import { describe, expect, it, beforeEach } from "vitest";
import { Cl } from "@stacks/transactions";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;
const creator1 = accounts.get("wallet_1")!;
const creator2 = accounts.get("wallet_2")!;
const buyer1 = accounts.get("wallet_3")!;
const buyer2 = accounts.get("wallet_4")!;

const contractName = "snozcoin-content";

// Helper to create a 32-byte content hash
const createContentHash = (seed: number) => {
  const bytes = new Uint8Array(32);
  for (let i = 0; i < 32; i++) {
    bytes[i] = (seed + i) % 256;
  }
  return bytes;
};

describe("SNOZCOIN Content Contract", () => {
  
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
        "total-content": Cl.uint(0),
        "total-purchases": Cl.uint(0),
        "total-revenue": Cl.uint(0),
        "total-platform-fees": Cl.uint(0),
        "is-paused": Cl.bool(false),
      });
    });

    it("should return correct minimum content price", () => {
      const { result } = simnet.callReadOnlyFn(
        contractName,
        "get-min-content-price",
        [],
        deployer
      );
      expect(result).toBeUint(10000); // 0.01 STX
    });

    it("should return correct platform fee", () => {
      const { result } = simnet.callReadOnlyFn(
        contractName,
        "get-platform-fee-bps",
        [],
        deployer
      );
      expect(result).toBeUint(500); // 5%
    });
  });

  describe("Content Publishing", () => {
    it("should allow creator to publish content", () => {
      const { result } = simnet.callPublicFn(
        contractName,
        "publish-content",
        [
          Cl.stringUtf8("My Exclusive Content"),
          Cl.stringUtf8("This is exclusive content description"),
          Cl.buffer(createContentHash(1)),
          Cl.uint(100000), // 0.1 STX
          Cl.stringAscii("video"),
        ],
        creator1
      );
      expect(result).toBeOk(Cl.uint(1)); // First content ID
    });

    it("should store content metadata correctly", () => {
      simnet.callPublicFn(
        contractName,
        "publish-content",
        [
          Cl.stringUtf8("Test Content"),
          Cl.stringUtf8("Description here"),
          Cl.buffer(createContentHash(2)),
          Cl.uint(50000),
          Cl.stringAscii("image"),
        ],
        creator1
      );

      const { result } = simnet.callReadOnlyFn(
        contractName,
        "get-content",
        [Cl.uint(1)],
        deployer
      );
      
      const content = result as any;
      expect(content.type).toBe(10); // Some
    });

    it("should reject content with price below minimum", () => {
      const { result } = simnet.callPublicFn(
        contractName,
        "publish-content",
        [
          Cl.stringUtf8("Cheap Content"),
          Cl.stringUtf8("Description"),
          Cl.buffer(createContentHash(3)),
          Cl.uint(5000), // Below minimum
          Cl.stringAscii("text"),
        ],
        creator1
      );
      expect(result).toBeErr(Cl.uint(201)); // ERR_INVALID_PRICE
    });

    it("should reject content with empty title", () => {
      const { result } = simnet.callPublicFn(
        contractName,
        "publish-content",
        [
          Cl.stringUtf8(""),
          Cl.stringUtf8("Description"),
          Cl.buffer(createContentHash(4)),
          Cl.uint(50000),
          Cl.stringAscii("text"),
        ],
        creator1
      );
      expect(result).toBeErr(Cl.uint(210)); // ERR_INVALID_TITLE
    });

    it("should track creator content count", () => {
      simnet.callPublicFn(
        contractName,
        "publish-content",
        [
          Cl.stringUtf8("Content 1"),
          Cl.stringUtf8("Desc 1"),
          Cl.buffer(createContentHash(5)),
          Cl.uint(50000),
          Cl.stringAscii("text"),
        ],
        creator1
      );

      simnet.callPublicFn(
        contractName,
        "publish-content",
        [
          Cl.stringUtf8("Content 2"),
          Cl.stringUtf8("Desc 2"),
          Cl.buffer(createContentHash(6)),
          Cl.uint(50000),
          Cl.stringAscii("text"),
        ],
        creator1
      );

      const { result } = simnet.callReadOnlyFn(
        contractName,
        "get-creator-content-count",
        [Cl.principal(creator1)],
        deployer
      );
      
      const count = result as any;
      expect(count.data.count).toBeUint(2);
    });
  });

  describe("Content Management", () => {
    it("should allow creator to update content", () => {
      simnet.callPublicFn(
        contractName,
        "publish-content",
        [
          Cl.stringUtf8("Original Title"),
          Cl.stringUtf8("Original Desc"),
          Cl.buffer(createContentHash(7)),
          Cl.uint(50000),
          Cl.stringAscii("text"),
        ],
        creator1
      );

      const { result } = simnet.callPublicFn(
        contractName,
        "update-content",
        [
          Cl.uint(1),
          Cl.stringUtf8("Updated Title"),
          Cl.stringUtf8("Updated Desc"),
          Cl.uint(75000),
        ],
        creator1
      );
      expect(result).toBeOk(Cl.bool(true));
    });

    it("should reject update from non-creator", () => {
      simnet.callPublicFn(
        contractName,
        "publish-content",
        [
          Cl.stringUtf8("Title"),
          Cl.stringUtf8("Desc"),
          Cl.buffer(createContentHash(8)),
          Cl.uint(50000),
          Cl.stringAscii("text"),
        ],
        creator1
      );

      const { result } = simnet.callPublicFn(
        contractName,
        "update-content",
        [
          Cl.uint(1),
          Cl.stringUtf8("Hacked Title"),
          Cl.stringUtf8("Hacked Desc"),
          Cl.uint(1000000),
        ],
        creator2
      );
      expect(result).toBeErr(Cl.uint(206)); // ERR_NOT_CREATOR
    });

    it("should allow creator to deactivate content", () => {
      simnet.callPublicFn(
        contractName,
        "publish-content",
        [
          Cl.stringUtf8("Title"),
          Cl.stringUtf8("Desc"),
          Cl.buffer(createContentHash(9)),
          Cl.uint(50000),
          Cl.stringAscii("text"),
        ],
        creator1
      );

      const { result } = simnet.callPublicFn(
        contractName,
        "deactivate-content",
        [Cl.uint(1)],
        creator1
      );
      expect(result).toBeOk(Cl.bool(true));
    });

    it("should allow creator to reactivate content", () => {
      simnet.callPublicFn(
        contractName,
        "publish-content",
        [
          Cl.stringUtf8("Title"),
          Cl.stringUtf8("Desc"),
          Cl.buffer(createContentHash(10)),
          Cl.uint(50000),
          Cl.stringAscii("text"),
        ],
        creator1
      );

      simnet.callPublicFn(
        contractName,
        "deactivate-content",
        [Cl.uint(1)],
        creator1
      );

      const { result } = simnet.callPublicFn(
        contractName,
        "reactivate-content",
        [Cl.uint(1)],
        creator1
      );
      expect(result).toBeOk(Cl.bool(true));
    });
  });

  describe("Content Purchasing", () => {
    it("should allow user to purchase content", () => {
      simnet.callPublicFn(
        contractName,
        "publish-content",
        [
          Cl.stringUtf8("Premium Content"),
          Cl.stringUtf8("Worth every sat"),
          Cl.buffer(createContentHash(11)),
          Cl.uint(100000),
          Cl.stringAscii("video"),
        ],
        creator1
      );

      const { result } = simnet.callPublicFn(
        contractName,
        "purchase-content",
        [Cl.uint(1)],
        buyer1
      );
      expect(result).toBeOk(Cl.bool(true));
    });

    it("should grant access after purchase", () => {
      simnet.callPublicFn(
        contractName,
        "publish-content",
        [
          Cl.stringUtf8("Content"),
          Cl.stringUtf8("Desc"),
          Cl.buffer(createContentHash(12)),
          Cl.uint(50000),
          Cl.stringAscii("text"),
        ],
        creator1
      );

      simnet.callPublicFn(
        contractName,
        "purchase-content",
        [Cl.uint(1)],
        buyer1
      );

      const { result } = simnet.callReadOnlyFn(
        contractName,
        "has-access",
        [Cl.uint(1), Cl.principal(buyer1)],
        deployer
      );
      expect(result).toBeBool(true);
    });

    it("should reject duplicate purchase", () => {
      simnet.callPublicFn(
        contractName,
        "publish-content",
        [
          Cl.stringUtf8("Content"),
          Cl.stringUtf8("Desc"),
          Cl.buffer(createContentHash(13)),
          Cl.uint(50000),
          Cl.stringAscii("text"),
        ],
        creator1
      );

      simnet.callPublicFn(
        contractName,
        "purchase-content",
        [Cl.uint(1)],
        buyer1
      );

      const { result } = simnet.callPublicFn(
        contractName,
        "purchase-content",
        [Cl.uint(1)],
        buyer1
      );
      expect(result).toBeErr(Cl.uint(203)); // ERR_ALREADY_PURCHASED
    });

    it("should reject purchase of inactive content", () => {
      simnet.callPublicFn(
        contractName,
        "publish-content",
        [
          Cl.stringUtf8("Content"),
          Cl.stringUtf8("Desc"),
          Cl.buffer(createContentHash(14)),
          Cl.uint(50000),
          Cl.stringAscii("text"),
        ],
        creator1
      );

      simnet.callPublicFn(
        contractName,
        "deactivate-content",
        [Cl.uint(1)],
        creator1
      );

      const { result } = simnet.callPublicFn(
        contractName,
        "purchase-content",
        [Cl.uint(1)],
        buyer1
      );
      expect(result).toBeErr(Cl.uint(204)); // ERR_CONTENT_INACTIVE
    });

    it("should calculate creator earnings correctly", () => {
      simnet.callPublicFn(
        contractName,
        "publish-content",
        [
          Cl.stringUtf8("Content"),
          Cl.stringUtf8("Desc"),
          Cl.buffer(createContentHash(15)),
          Cl.uint(100000), // 0.1 STX
          Cl.stringAscii("text"),
        ],
        creator1
      );

      simnet.callPublicFn(
        contractName,
        "purchase-content",
        [Cl.uint(1)],
        buyer1
      );

      const { result } = simnet.callReadOnlyFn(
        contractName,
        "get-creator-earnings",
        [Cl.principal(creator1)],
        deployer
      );
      
      const earnings = result as any;
      expect(earnings.data.balance).toBeUint(95000); // 100000 - 5% fee
    });

    it("should give creator automatic access", () => {
      simnet.callPublicFn(
        contractName,
        "publish-content",
        [
          Cl.stringUtf8("My Content"),
          Cl.stringUtf8("Desc"),
          Cl.buffer(createContentHash(16)),
          Cl.uint(50000),
          Cl.stringAscii("text"),
        ],
        creator1
      );

      const { result } = simnet.callReadOnlyFn(
        contractName,
        "has-access",
        [Cl.uint(1), Cl.principal(creator1)],
        deployer
      );
      expect(result).toBeBool(true);
    });
  });

  describe("Withdrawals", () => {
    it("should allow creator to withdraw earnings", () => {
      simnet.callPublicFn(
        contractName,
        "publish-content",
        [
          Cl.stringUtf8("Content"),
          Cl.stringUtf8("Desc"),
          Cl.buffer(createContentHash(17)),
          Cl.uint(100000),
          Cl.stringAscii("text"),
        ],
        creator1
      );

      simnet.callPublicFn(
        contractName,
        "purchase-content",
        [Cl.uint(1)],
        buyer1
      );

      const { result } = simnet.callPublicFn(
        contractName,
        "withdraw-earnings",
        [],
        creator1
      );
      expect(result).toBeOk(Cl.uint(95000));
    });

    it("should reject withdrawal with zero balance", () => {
      // Initialize creator earnings by publishing (even without sales)
      simnet.callPublicFn(
        contractName,
        "publish-content",
        [
          Cl.stringUtf8("Content"),
          Cl.stringUtf8("Desc"),
          Cl.buffer(createContentHash(18)),
          Cl.uint(50000),
          Cl.stringAscii("text"),
        ],
        creator1
      );

      const { result } = simnet.callPublicFn(
        contractName,
        "withdraw-earnings",
        [],
        creator1
      );
      expect(result).toBeErr(Cl.uint(209)); // ERR_ZERO_BALANCE
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
      expect(result).toBeErr(Cl.uint(200)); // ERR_NOT_AUTHORIZED
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
        "publish-content",
        [
          Cl.stringUtf8("Content"),
          Cl.stringUtf8("Desc"),
          Cl.buffer(createContentHash(19)),
          Cl.uint(50000),
          Cl.stringAscii("text"),
        ],
        creator1
      );
      expect(result).toBeErr(Cl.uint(207)); // ERR_CONTRACT_PAUSED
    });

    it("should allow admin to withdraw platform fees", () => {
      simnet.callPublicFn(
        contractName,
        "publish-content",
        [
          Cl.stringUtf8("Content"),
          Cl.stringUtf8("Desc"),
          Cl.buffer(createContentHash(20)),
          Cl.uint(100000),
          Cl.stringAscii("text"),
        ],
        creator1
      );

      simnet.callPublicFn(
        contractName,
        "purchase-content",
        [Cl.uint(1)],
        buyer1
      );

      const { result } = simnet.callPublicFn(
        contractName,
        "withdraw-platform-fees",
        [],
        deployer
      );
      expect(result).toBeOk(Cl.uint(5000)); // 5% of 100000
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

    it("should return none for non-existent content", () => {
      const { result } = simnet.callReadOnlyFn(
        contractName,
        "get-content",
        [Cl.uint(999)],
        deployer
      );
      expect(result).toBeNone();
    });

    it("should return false for unauthorized user access", () => {
      simnet.callPublicFn(
        contractName,
        "publish-content",
        [
          Cl.stringUtf8("Content"),
          Cl.stringUtf8("Desc"),
          Cl.buffer(createContentHash(21)),
          Cl.uint(50000),
          Cl.stringAscii("text"),
        ],
        creator1
      );

      const { result } = simnet.callReadOnlyFn(
        contractName,
        "has-access",
        [Cl.uint(1), Cl.principal(buyer1)],
        deployer
      );
      expect(result).toBeBool(false);
    });
  });
});
