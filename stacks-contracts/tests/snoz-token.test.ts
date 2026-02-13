import { describe, expect, it, beforeEach } from "vitest";
import { Cl, ClarityType } from "@stacks/transactions";

// Test addresses
const deployer = "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM";
const wallet1 = "ST1SJ3DTE5DN7X54YDH5D64R3BCB6A2AG2ZQ8YPD5";
const wallet2 = "ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG";
const wallet3 = "ST2JHG361ZXG51QTKY2NQCVBPPRRE2KZB1HR05NNC";

const contractName = "snoz-token";

describe("SNOZ Token Contract", () => {
  describe("Token Metadata", () => {
    it("should return correct token name", () => {
      const response = simnet.callReadOnlyFn(
        contractName,
        "get-name",
        [],
        deployer
      );
      expect(response.result).toBeOk(Cl.stringAscii("SNOZ"));
    });

    it("should return correct token symbol", () => {
      const response = simnet.callReadOnlyFn(
        contractName,
        "get-symbol",
        [],
        deployer
      );
      expect(response.result).toBeOk(Cl.stringAscii("SNOZ"));
    });

    it("should return correct decimals", () => {
      const response = simnet.callReadOnlyFn(
        contractName,
        "get-decimals",
        [],
        deployer
      );
      expect(response.result).toBeOk(Cl.uint(6));
    });

    it("should return token URI", () => {
      const response = simnet.callReadOnlyFn(
        contractName,
        "get-token-uri",
        [],
        deployer
      );
      expect(response.result.type).toBe(ClarityType.ResponseOk);
    });
  });

  describe("Initial State", () => {
    it("should have zero initial supply", () => {
      const response = simnet.callReadOnlyFn(
        contractName,
        "get-total-supply",
        [],
        deployer
      );
      expect(response.result).toBeOk(Cl.uint(0));
    });

    it("should have zero balance for any account", () => {
      const response = simnet.callReadOnlyFn(
        contractName,
        "get-balance",
        [Cl.principal(wallet1)],
        deployer
      );
      expect(response.result).toBeOk(Cl.uint(0));
    });

    it("should have contract not paused initially", () => {
      const response = simnet.callReadOnlyFn(
        contractName,
        "get-contract-status",
        [],
        deployer
      );
      const status = response.result as any;
      expect(status.data["is-paused"].type).toBe(ClarityType.BoolFalse);
    });

    it("should have transfers enabled initially", () => {
      const response = simnet.callReadOnlyFn(
        contractName,
        "get-contract-status",
        [],
        deployer
      );
      const status = response.result as any;
      expect(status.data["transfers-enabled"].type).toBe(ClarityType.BoolTrue);
    });
  });

  describe("Minting", () => {
    it("should allow owner to mint tokens", () => {
      const mintAmount = 1000000000n; // 1000 SNOZ
      const response = simnet.callPublicFn(
        contractName,
        "mint",
        [Cl.uint(mintAmount), Cl.principal(wallet1)],
        deployer
      );
      expect(response.result).toBeOk(Cl.bool(true));

      // Verify balance
      const balance = simnet.callReadOnlyFn(
        contractName,
        "get-balance",
        [Cl.principal(wallet1)],
        deployer
      );
      expect(balance.result).toBeOk(Cl.uint(mintAmount));
    });

    it("should reject minting by non-admin", () => {
      const response = simnet.callPublicFn(
        contractName,
        "mint",
        [Cl.uint(1000000000n), Cl.principal(wallet2)],
        wallet1
      );
      expect(response.result).toBeErr(Cl.uint(400)); // ERR_NOT_AUTHORIZED
    });

    it("should reject minting zero amount", () => {
      const response = simnet.callPublicFn(
        contractName,
        "mint",
        [Cl.uint(0), Cl.principal(wallet1)],
        deployer
      );
      expect(response.result).toBeErr(Cl.uint(411)); // ERR_ZERO_AMOUNT
    });

    it("should reject minting over max supply", () => {
      // Max supply is 1,000,000,000,000,000
      const overMaxSupply = 1000000000000001n;
      const response = simnet.callPublicFn(
        contractName,
        "mint",
        [Cl.uint(overMaxSupply), Cl.principal(wallet1)],
        deployer
      );
      expect(response.result).toBeErr(Cl.uint(404)); // ERR_MAX_SUPPLY_EXCEEDED
    });

    it("should update total supply after minting", () => {
      const mintAmount = 5000000000n;
      simnet.callPublicFn(
        contractName,
        "mint",
        [Cl.uint(mintAmount), Cl.principal(wallet1)],
        deployer
      );

      const response = simnet.callReadOnlyFn(
        contractName,
        "get-total-supply",
        [],
        deployer
      );
      expect(response.result).toBeOk(Cl.uint(mintAmount));
    });
  });

  describe("Transfer", () => {
    beforeEach(() => {
      // Mint some tokens to wallet1
      simnet.callPublicFn(
        contractName,
        "mint",
        [Cl.uint(10000000000n), Cl.principal(wallet1)],
        deployer
      );
    });

    it("should allow transfer between accounts", () => {
      const transferAmount = 1000000000n;
      const response = simnet.callPublicFn(
        contractName,
        "transfer",
        [
          Cl.uint(transferAmount),
          Cl.principal(wallet1),
          Cl.principal(wallet2),
          Cl.none()
        ],
        wallet1
      );
      expect(response.result).toBeOk(Cl.bool(true));

      // Verify recipient balance
      const balance = simnet.callReadOnlyFn(
        contractName,
        "get-balance",
        [Cl.principal(wallet2)],
        deployer
      );
      expect(balance.result).toBeOk(Cl.uint(transferAmount));
    });

    it("should reject transfer to self", () => {
      const response = simnet.callPublicFn(
        contractName,
        "transfer",
        [
          Cl.uint(1000000000n),
          Cl.principal(wallet1),
          Cl.principal(wallet1),
          Cl.none()
        ],
        wallet1
      );
      expect(response.result).toBeErr(Cl.uint(410)); // ERR_SELF_TRANSFER
    });

    it("should reject transfer of zero amount", () => {
      const response = simnet.callPublicFn(
        contractName,
        "transfer",
        [
          Cl.uint(0),
          Cl.principal(wallet1),
          Cl.principal(wallet2),
          Cl.none()
        ],
        wallet1
      );
      expect(response.result).toBeErr(Cl.uint(411)); // ERR_ZERO_AMOUNT
    });

    it("should reject transfer exceeding balance", () => {
      const response = simnet.callPublicFn(
        contractName,
        "transfer",
        [
          Cl.uint(20000000000n), // More than minted
          Cl.principal(wallet1),
          Cl.principal(wallet2),
          Cl.none()
        ],
        wallet1
      );
      expect(response.result).toBeErr(Cl.uint(402)); // ERR_INSUFFICIENT_BALANCE
    });

    it("should reject unauthorized transfer", () => {
      const response = simnet.callPublicFn(
        contractName,
        "transfer",
        [
          Cl.uint(1000000000n),
          Cl.principal(wallet1),
          Cl.principal(wallet2),
          Cl.none()
        ],
        wallet3 // Not wallet1
      );
      expect(response.result).toBeErr(Cl.uint(400)); // ERR_NOT_AUTHORIZED
    });

    it("should include memo in transfer", () => {
      const memo = new Uint8Array([1, 2, 3, 4]);
      const response = simnet.callPublicFn(
        contractName,
        "transfer",
        [
          Cl.uint(1000000000n),
          Cl.principal(wallet1),
          Cl.principal(wallet2),
          Cl.some(Cl.buffer(memo))
        ],
        wallet1
      );
      expect(response.result).toBeOk(Cl.bool(true));
    });
  });

  describe("Burn", () => {
    beforeEach(() => {
      simnet.callPublicFn(
        contractName,
        "mint",
        [Cl.uint(10000000000n), Cl.principal(wallet1)],
        deployer
      );
    });

    it("should allow holder to burn tokens", () => {
      const burnAmount = 5000000000n;
      const response = simnet.callPublicFn(
        contractName,
        "burn",
        [Cl.uint(burnAmount)],
        wallet1
      );
      expect(response.result).toBeOk(Cl.bool(true));

      // Verify reduced balance
      const balance = simnet.callReadOnlyFn(
        contractName,
        "get-balance",
        [Cl.principal(wallet1)],
        deployer
      );
      expect(balance.result).toBeOk(Cl.uint(5000000000n));
    });

    it("should reduce total supply after burn", () => {
      simnet.callPublicFn(
        contractName,
        "burn",
        [Cl.uint(3000000000n)],
        wallet1
      );

      const response = simnet.callReadOnlyFn(
        contractName,
        "get-total-supply",
        [],
        deployer
      );
      expect(response.result).toBeOk(Cl.uint(7000000000n));
    });

    it("should reject burning zero amount", () => {
      const response = simnet.callPublicFn(
        contractName,
        "burn",
        [Cl.uint(0)],
        wallet1
      );
      expect(response.result).toBeErr(Cl.uint(411)); // ERR_ZERO_AMOUNT
    });

    it("should reject burning more than balance", () => {
      const response = simnet.callPublicFn(
        contractName,
        "burn",
        [Cl.uint(20000000000n)],
        wallet1
      );
      expect(response.result).toBeErr(Cl.uint(402)); // ERR_INSUFFICIENT_BALANCE
    });
  });

  describe("Admin Management", () => {
    it("should allow owner to add admin", () => {
      const response = simnet.callPublicFn(
        contractName,
        "add-admin",
        [Cl.principal(wallet1)],
        deployer
      );
      expect(response.result).toBeOk(Cl.bool(true));

      // Verify admin status
      const isAdmin = simnet.callReadOnlyFn(
        contractName,
        "is-admin",
        [Cl.principal(wallet1)],
        deployer
      );
      expect(isAdmin.result.type).toBe(ClarityType.BoolTrue);
    });

    it("should reject non-owner adding admin", () => {
      const response = simnet.callPublicFn(
        contractName,
        "add-admin",
        [Cl.principal(wallet2)],
        wallet1
      );
      expect(response.result).toBeErr(Cl.uint(400)); // ERR_NOT_AUTHORIZED
    });

    it("should allow owner to remove admin", () => {
      // First add admin
      simnet.callPublicFn(
        contractName,
        "add-admin",
        [Cl.principal(wallet1)],
        deployer
      );

      // Then remove
      const response = simnet.callPublicFn(
        contractName,
        "remove-admin",
        [Cl.principal(wallet1)],
        deployer
      );
      expect(response.result).toBeOk(Cl.bool(true));
    });

    it("should not allow removing owner as admin", () => {
      const response = simnet.callPublicFn(
        contractName,
        "remove-admin",
        [Cl.principal(deployer)],
        deployer
      );
      expect(response.result).toBeErr(Cl.uint(408)); // ERR_CANNOT_REMOVE_OWNER
    });

    it("should allow admin to mint after being added", () => {
      simnet.callPublicFn(
        contractName,
        "add-admin",
        [Cl.principal(wallet1)],
        deployer
      );

      const response = simnet.callPublicFn(
        contractName,
        "mint",
        [Cl.uint(1000000000n), Cl.principal(wallet2)],
        wallet1
      );
      expect(response.result).toBeOk(Cl.bool(true));
    });
  });

  describe("Minter Management", () => {
    it("should allow owner to add minter contract", () => {
      const response = simnet.callPublicFn(
        contractName,
        "add-minter",
        [Cl.principal(wallet1)],
        deployer
      );
      expect(response.result).toBeOk(Cl.bool(true));
    });

    it("should allow minter to mint tokens", () => {
      simnet.callPublicFn(
        contractName,
        "add-minter",
        [Cl.principal(wallet1)],
        deployer
      );

      const response = simnet.callPublicFn(
        contractName,
        "mint",
        [Cl.uint(1000000000n), Cl.principal(wallet2)],
        wallet1
      );
      expect(response.result).toBeOk(Cl.bool(true));
    });

    it("should allow owner to remove minter", () => {
      simnet.callPublicFn(
        contractName,
        "add-minter",
        [Cl.principal(wallet1)],
        deployer
      );

      const response = simnet.callPublicFn(
        contractName,
        "remove-minter",
        [Cl.principal(wallet1)],
        deployer
      );
      expect(response.result).toBeOk(Cl.bool(true));
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

    it("should reject operations when paused", () => {
      simnet.callPublicFn(contractName, "pause", [], deployer);

      const response = simnet.callPublicFn(
        contractName,
        "mint",
        [Cl.uint(1000000000n), Cl.principal(wallet1)],
        deployer
      );
      expect(response.result).toBeErr(Cl.uint(401)); // ERR_PAUSED
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

      // Operations should work again
      const mintResponse = simnet.callPublicFn(
        contractName,
        "mint",
        [Cl.uint(1000000000n), Cl.principal(wallet1)],
        deployer
      );
      expect(mintResponse.result).toBeOk(Cl.bool(true));
    });

    it("should reject non-admin pause", () => {
      const response = simnet.callPublicFn(
        contractName,
        "pause",
        [],
        wallet1
      );
      expect(response.result).toBeErr(Cl.uint(400)); // ERR_NOT_AUTHORIZED
    });
  });

  describe("Transfer Controls", () => {
    beforeEach(() => {
      simnet.callPublicFn(
        contractName,
        "mint",
        [Cl.uint(10000000000n), Cl.principal(wallet1)],
        deployer
      );
    });

    it("should allow admin to disable transfers", () => {
      const response = simnet.callPublicFn(
        contractName,
        "disable-transfers",
        [],
        deployer
      );
      expect(response.result).toBeOk(Cl.bool(true));
    });

    it("should reject transfer when transfers disabled", () => {
      simnet.callPublicFn(contractName, "disable-transfers", [], deployer);

      const response = simnet.callPublicFn(
        contractName,
        "transfer",
        [
          Cl.uint(1000000000n),
          Cl.principal(wallet1),
          Cl.principal(wallet2),
          Cl.none()
        ],
        wallet1
      );
      expect(response.result).toBeErr(Cl.uint(409)); // ERR_TRANSFER_DISABLED
    });

    it("should allow transfers after re-enabling", () => {
      simnet.callPublicFn(contractName, "disable-transfers", [], deployer);
      simnet.callPublicFn(contractName, "enable-transfers", [], deployer);

      const response = simnet.callPublicFn(
        contractName,
        "transfer",
        [
          Cl.uint(1000000000n),
          Cl.principal(wallet1),
          Cl.principal(wallet2),
          Cl.none()
        ],
        wallet1
      );
      expect(response.result).toBeOk(Cl.bool(true));
    });
  });

  describe("Allowance", () => {
    beforeEach(() => {
      simnet.callPublicFn(
        contractName,
        "mint",
        [Cl.uint(10000000000n), Cl.principal(wallet1)],
        deployer
      );
    });

    it("should allow setting allowance", () => {
      const response = simnet.callPublicFn(
        contractName,
        "approve",
        [Cl.principal(wallet2), Cl.uint(5000000000n)],
        wallet1
      );
      expect(response.result).toBeOk(Cl.bool(true));

      const allowance = simnet.callReadOnlyFn(
        contractName,
        "get-allowance",
        [Cl.principal(wallet1), Cl.principal(wallet2)],
        deployer
      );
      expect(allowance.result).toStrictEqual(Cl.uint(5000000000n));
    });

    it("should allow transfer-from with allowance", () => {
      simnet.callPublicFn(
        contractName,
        "approve",
        [Cl.principal(wallet2), Cl.uint(5000000000n)],
        wallet1
      );

      const response = simnet.callPublicFn(
        contractName,
        "transfer-from",
        [
          Cl.uint(3000000000n),
          Cl.principal(wallet1),
          Cl.principal(wallet3)
        ],
        wallet2
      );
      expect(response.result).toBeOk(Cl.bool(true));
    });

    it("should reject transfer-from exceeding allowance", () => {
      simnet.callPublicFn(
        contractName,
        "approve",
        [Cl.principal(wallet2), Cl.uint(1000000000n)],
        wallet1
      );

      const response = simnet.callPublicFn(
        contractName,
        "transfer-from",
        [
          Cl.uint(2000000000n),
          Cl.principal(wallet1),
          Cl.principal(wallet3)
        ],
        wallet2
      );
      expect(response.result).toBeErr(Cl.uint(402)); // ERR_INSUFFICIENT_BALANCE
    });

    it("should reduce allowance after transfer-from", () => {
      simnet.callPublicFn(
        contractName,
        "approve",
        [Cl.principal(wallet2), Cl.uint(5000000000n)],
        wallet1
      );

      simnet.callPublicFn(
        contractName,
        "transfer-from",
        [
          Cl.uint(2000000000n),
          Cl.principal(wallet1),
          Cl.principal(wallet3)
        ],
        wallet2
      );

      const allowance = simnet.callReadOnlyFn(
        contractName,
        "get-allowance",
        [Cl.principal(wallet1), Cl.principal(wallet2)],
        deployer
      );
      expect(allowance.result).toStrictEqual(Cl.uint(3000000000n));
    });
  });

  describe("Contract Status", () => {
    it("should return complete contract status", () => {
      const response = simnet.callReadOnlyFn(
        contractName,
        "get-contract-status",
        [],
        deployer
      );
      
      const status = response.result as any;
      expect(status.data).toHaveProperty("is-paused");
      expect(status.data).toHaveProperty("transfers-enabled");
      expect(status.data).toHaveProperty("total-supply");
      expect(status.data).toHaveProperty("total-burned");
      expect(status.data).toHaveProperty("max-supply");
      expect(status.data).toHaveProperty("remaining-mintable");
    });
  });

  describe("Edge Cases & Security", () => {
    it("should handle maximum mint amount within daily limit", () => {
      // DAILY_MINT_LIMIT is u100000000000 (100,000 SNOZ with 6 decimals)
      // Mint up to the daily limit
      const dailyLimit = 100000000000n;
      const response = simnet.callPublicFn(
        contractName,
        "mint",
        [Cl.uint(dailyLimit), Cl.principal(wallet1)],
        deployer
      );
      expect(response.result).toBeOk(Cl.bool(true));

      // Next mint of 1 should fail (exceeds daily limit)
      const overLimitMint = simnet.callPublicFn(
        contractName,
        "mint",
        [Cl.uint(1), Cl.principal(wallet1)],
        deployer
      );
      expect(overLimitMint.result).toBeErr(Cl.uint(405)); // ERR_MINT_LIMIT_EXCEEDED
    });

    it("should track total burned correctly", () => {
      // Mint then burn
      simnet.callPublicFn(
        contractName,
        "mint",
        [Cl.uint(10000000000n), Cl.principal(wallet1)],
        deployer
      );

      simnet.callPublicFn(
        contractName,
        "burn",
        [Cl.uint(3000000000n)],
        wallet1
      );

      const status = simnet.callReadOnlyFn(
        contractName,
        "get-contract-status",
        [],
        deployer
      );
      
      const statusData = status.result as any;
      expect(statusData.data["total-burned"].value).toBe(3000000000n);
    });
  });
});
