/**
 * @file cartValidation.test.ts
 * @description Unit tests for the cartValidation utility module.
 *
 * Test strategy: TDD (Test-Driven Development)
 * - These tests were designed BEFORE implementing cartValidation.ts
 * - Pattern used: AAA (Arrange → Act → Assert)
 *
 * Coverage targets:
 * - validateCartItem()      → all 4 validation rules
 * - calculateLineSubtotal() → normal + boundary values
 * - calculateCartTotal()    → empty cart + multi-item cart
 */

import { describe, test, expect } from "vitest";
import {
  validateCartItem,
  calculateLineSubtotal,
  calculateCartTotal,
} from "../utils/cartValidation";

// ─────────────────────────────────────────────────────────────────────────────
// Group: validateCartItem()
// ─────────────────────────────────────────────────────────────────────────────
describe("validateCartItem()", () => {
  // ── Happy Path ──────────────────────────────────────────────────────────

  test("TC_CART_001 – returns valid:true for a normal, in-stock product", () => {
    // Arrange: a standard product with plenty of stock
    const input = { productId: "P001", quantity: 2, stock: 10, isActive: true };

    // Act: run validation
    const result = validateCartItem(input);

    // Assert: should pass without errors
    expect(result.valid).toBe(true);
    expect(result.error).toBeUndefined();
  });

  test("TC_CART_BOUND_MIN – returns valid:true when quantity equals 1 (minimum boundary)", () => {
    // Boundary test: quantity = 1 is the minimum allowed value
    const input = { productId: "P001", quantity: 1, stock: 10 };
    const result = validateCartItem(input);
    expect(result.valid).toBe(true);
  });

  test("TC_CART_BOUND_MAX – returns valid:true when quantity equals available stock (max boundary)", () => {
    // Boundary test: requesting ALL remaining stock should be allowed
    const input = { productId: "P001", quantity: 50, stock: 50 };
    const result = validateCartItem(input);
    expect(result.valid).toBe(true);
  });

  // ── Negative: Invalid Product ID ────────────────────────────────────────

  test("TC_CART_NEG_001 – returns error when productId is null", () => {
    // Negative test: null productId must be rejected
    const input = { productId: null, quantity: 1, stock: 10 };
    const result = validateCartItem(input);
    expect(result.valid).toBe(false);
    expect(result.error).toBe("Product ID is required");
  });

  test("TC_CART_NEG_002 – returns error when productId is an empty string", () => {
    // Negative test: empty string is considered missing ID
    const input = { productId: "   ", quantity: 1, stock: 10 };
    const result = validateCartItem(input);
    expect(result.valid).toBe(false);
    expect(result.error).toBe("Product ID is required");
  });

  // ── Negative: Invalid Quantity ──────────────────────────────────────────

  test("TC_CART_NEG_003 – returns error when quantity is 0", () => {
    // Negative test: zero quantity is not meaningful in a cart
    const input = { productId: "P001", quantity: 0, stock: 10 };
    const result = validateCartItem(input);
    expect(result.valid).toBe(false);
    expect(result.error).toBe("Quantity must be at least 1");
  });

  test("TC_CART_NEG_004 – returns error when quantity is negative (-1)", () => {
    // Negative test: negative quantity is an invalid state
    const input = { productId: "P001", quantity: -1, stock: 10 };
    const result = validateCartItem(input);
    expect(result.valid).toBe(false);
    expect(result.error).toBe("Quantity must be at least 1");
  });

  test("TC_CART_NEG_005 – returns error when quantity is a decimal (1.5)", () => {
    // Negative test: cart quantities must be whole numbers
    const input = { productId: "P001", quantity: 1.5, stock: 10 };
    const result = validateCartItem(input);
    expect(result.valid).toBe(false);
    expect(result.error).toBe("Quantity must be at least 1");
  });

  // ── Negative: Stock Exceeded ────────────────────────────────────────────

  test("TC_CART_002 – returns error when quantity exceeds available stock", () => {
    // Negative test: requesting more than available stock must fail
    // This prevents overselling
    const input = { productId: "P002", quantity: 6, stock: 5 };
    const result = validateCartItem(input);
    expect(result.valid).toBe(false);
    // Error message should mention both the requested and available amounts
    expect(result.error).toContain("6");
    expect(result.error).toContain("5");
  });

  test("TC_CART_NEG_006 – returns error when product stock is 0 (out of stock)", () => {
    // Negative test: zero stock means item is unavailable
    const input = { productId: "P001", quantity: 1, stock: 0 };
    const result = validateCartItem(input);
    expect(result.valid).toBe(false);
  });

  // ── Negative: Inactive Product ─────────────────────────────────────────

  test("TC_CART_004 – returns error when product is inactive (isActive=false)", () => {
    // Negative test: users should not be able to buy retired products
    const input = {
      productId: "P003",
      quantity: 1,
      stock: 100,
      isActive: false,
    };
    const result = validateCartItem(input);
    expect(result.valid).toBe(false);
    expect(result.error).toBe("Product is not available for purchase");
  });

  test("TC_CART_ACT_001 – treats missing isActive as active (defaults to allowed)", () => {
    // Edge case: if isActive is not provided, it should default to allowed
    const input = { productId: "P001", quantity: 1, stock: 10 };
    // isActive is omitted — should behave as if the product is active
    const result = validateCartItem(input);
    expect(result.valid).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Group: calculateLineSubtotal()
// ─────────────────────────────────────────────────────────────────────────────
describe("calculateLineSubtotal()", () => {
  test("TC_CART_CALC_001 – correctly multiplies price × quantity", () => {
    // Arrange: product costs 1500 cents ($15.00), ordering 3 units
    // Act + Assert: 1500 × 3 = 4500 cents ($45.00)
    expect(calculateLineSubtotal(1500, 3)).toBe(4500);
  });

  test("TC_CART_CALC_002 – returns priceCents itself when quantity is 1", () => {
    // Boundary: qty=1 is the identity case for multiplication
    expect(calculateLineSubtotal(9900, 1)).toBe(9900);
  });

  test("TC_CART_CALC_003 – returns 0 when price is 0", () => {
    // Edge case: a free product should yield zero cost
    expect(calculateLineSubtotal(0, 5)).toBe(0);
  });

  test("TC_CART_CALC_004 – handles large quantities correctly", () => {
    // Edge case: large orders (e.g. bulk purchasing)
    expect(calculateLineSubtotal(100, 1000)).toBe(100000);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Group: calculateCartTotal()
// ─────────────────────────────────────────────────────────────────────────────
describe("calculateCartTotal()", () => {
  test("TC_CART_TOT_001 – returns 0 for an empty cart", () => {
    // Edge case: an empty cart should have zero total
    expect(calculateCartTotal([])).toBe(0);
  });

  test("TC_CART_TOT_002 – correctly sums multiple items", () => {
    // Happy path: standard multi-item cart
    // Laptop: 150000 cents × 1 = 150000
    // Mouse:    5000 cents × 2 =  10000
    // Total = 160000
    const items = [
      { priceCents: 150000, quantity: 1 },
      { priceCents: 5000, quantity: 2 },
    ];
    expect(calculateCartTotal(items)).toBe(160000);
  });

  test("TC_CART_TOT_003 – works with a single item", () => {
    // Boundary: single-item cart
    const items = [{ priceCents: 2500, quantity: 4 }];
    expect(calculateCartTotal(items)).toBe(10000);
  });
});
