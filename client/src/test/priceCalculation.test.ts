/**
 * @file priceCalculation.test.ts
 * @description Unit tests for the priceCalculation utility module.
 *
 * Test strategy: TDD — tests written before implementation.
 * Pattern: AAA (Arrange → Act → Assert)
 *
 * Covers:
 * - calculateOrderPrice(): subtotal, percentage coupon, fixed coupon, shipping, final total
 * - checkInventoryAvailability(): all sufficient, some insufficient, all insufficient, empty list
 */

import { describe, test, expect } from "vitest";
import {
  calculateOrderPrice,
  checkInventoryAvailability,
} from "../utils/priceCalculation";

// ─────────────────────────────────────────────────────────────────────────────
// Group: calculateOrderPrice()
// ─────────────────────────────────────────────────────────────────────────────
describe("calculateOrderPrice()", () => {
  // ── Happy Path: No Coupon ───────────────────────────────────────────────

  test("TC_PUR_CALC_001 – calculates subtotal correctly with no discount", () => {
    /**
     * Arrange: two items in cart
     *   - Laptop: 15_000_00 cents (=$150.00) × 2 = 30_000_00 cents
     *   - Mouse:   5_00_00 cents  (=$5.00)   × 1 =    5_00_00 cents
     *   Subtotal = 305_00_00 → Wait let's use simpler numbers:
     *   Item A: 15000 cents × 2 = 30000
     *   Item B:  5000 cents × 1 =  5000
     *   Subtotal = 35000, no discount, no shipping
     */
    const items = [
      { priceCents: 15000, quantity: 2 },
      { priceCents: 5000, quantity: 1 },
    ];

    // Act
    const result = calculateOrderPrice(items, null, 0);

    // Assert
    expect(result.subtotalCents).toBe(35000);
    expect(result.discountCents).toBe(0);
    expect(result.shippingCents).toBe(0);
    expect(result.totalCents).toBe(35000);
  });

  // ── Happy Path: Percentage Coupon (SAVE10 = 10% off) ────────────────────

  test("TC_PUR_CALC_002 – applies 10% percentage coupon correctly (SAVE10)", () => {
    /**
     * Arrange:
     *   Subtotal = 10000 cents ($100.00)
     *   Coupon = 10% off → discount = 10000 × 10/100 = 1000 cents ($10.00)
     *   Total = 10000 - 1000 = 9000 cents ($90.00)
     */
    const items = [{ priceCents: 10000, quantity: 1 }];
    const coupon = { type: "percentage" as const, value: 10 };

    // Act
    const result = calculateOrderPrice(items, coupon, 0);

    // Assert
    expect(result.subtotalCents).toBe(10000);
    expect(result.discountCents).toBe(1000); // 10% of 10000
    expect(result.totalCents).toBe(9000);
  });

  test("TC_PUR_CALC_003 – applies 50% percentage coupon correctly (SUMMER50)", () => {
    /**
     * Arrange:
     *   Subtotal = 20000 cents ($200.00)
     *   Coupon = 50% off → discount = 20000 × 50/100 = 10000 cents ($100.00)
     */
    const items = [{ priceCents: 20000, quantity: 1 }];
    const coupon = { type: "percentage" as const, value: 50 };

    // Act
    const result = calculateOrderPrice(items, coupon, 0);

    // Assert
    expect(result.discountCents).toBe(10000);
    expect(result.totalCents).toBe(10000);
  });

  // ── Happy Path: Fixed Amount Coupon ─────────────────────────────────────

  test("TC_PUR_CALC_004 – applies fixed-amount coupon correctly", () => {
    /**
     * Arrange:
     *   Subtotal = 8000 cents ($80.00)
     *   Coupon = flat $5.00 off (500 cents)
     *   Total = 8000 - 500 = 7500 cents ($75.00)
     */
    const items = [{ priceCents: 8000, quantity: 1 }];
    const coupon = { type: "fixed" as const, value: 500 };

    // Act
    const result = calculateOrderPrice(items, coupon, 0);

    // Assert
    expect(result.discountCents).toBe(500);
    expect(result.totalCents).toBe(7500);
  });

  test("TC_PUR_CALC_005 – fixed coupon cannot reduce total below 0", () => {
    /**
     * Edge case: coupon value larger than subtotal
     * Subtotal = 300 cents, coupon = 1000 cents
     * Discount capped at subtotal (300), total = 0 (clamped, never negative)
     */
    const items = [{ priceCents: 300, quantity: 1 }];
    const coupon = { type: "fixed" as const, value: 1000 };

    // Act
    const result = calculateOrderPrice(items, coupon, 0);

    // Assert: discount is capped to the subtotal amount
    expect(result.discountCents).toBe(300);
    // Assert: total is clamped at 0, never negative
    expect(result.totalCents).toBe(0);
  });

  // ── Happy Path: Shipping Fee ─────────────────────────────────────────────

  test("TC_PUR_CALC_006 – includes shipping fee in the final total", () => {
    /**
     * Arrange:
     *   Subtotal = 5000 cents ($50.00)
     *   Shipping = 500 cents ($5.00)
     *   Total = 5000 + 500 = 5500 cents ($55.00)
     */
    const items = [{ priceCents: 5000, quantity: 1 }];

    // Act
    const result = calculateOrderPrice(items, null, 500);

    // Assert
    expect(result.shippingCents).toBe(500);
    expect(result.totalCents).toBe(5500);
  });

  test("TC_PUR_CALC_007 – combines coupon and shipping correctly", () => {
    /**
     * Arrange:
     *   Subtotal  = 10000 cents
     *   Shipping  = 300 cents
     *   Coupon    = 10% → discount = 1000 cents
     *   Total     = 10000 + 300 - 1000 = 9300 cents
     */
    const items = [{ priceCents: 10000, quantity: 1 }];
    const coupon = { type: "percentage" as const, value: 10 };

    // Act
    const result = calculateOrderPrice(items, coupon, 300);

    // Assert
    expect(result.subtotalCents).toBe(10000);
    expect(result.discountCents).toBe(1000);
    expect(result.shippingCents).toBe(300);
    expect(result.totalCents).toBe(9300);
  });

  // ── Edge Case: Empty Cart ─────────────────────────────────────────────────

  test("TC_PUR_CALC_008 – returns all zeros for an empty item list", () => {
    // Edge case: empty cart should produce all-zero price breakdown
    const result = calculateOrderPrice([], null, 0);
    expect(result.subtotalCents).toBe(0);
    expect(result.discountCents).toBe(0);
    expect(result.totalCents).toBe(0);
  });

  // ── Edge Case: Multi-item with coupon ────────────────────────────────────

  test("TC_PUR_CALC_009 – handles multi-item cart with percentage coupon", () => {
    /**
     * Items:
     *   A: 20000 × 1 = 20000
     *   B:  5000 × 2 = 10000
     *   Subtotal = 30000
     *   Coupon 20% → discount = 6000
     *   Total = 24000
     */
    const items = [
      { priceCents: 20000, quantity: 1 },
      { priceCents: 5000, quantity: 2 },
    ];
    const coupon = { type: "percentage" as const, value: 20 };

    const result = calculateOrderPrice(items, coupon, 0);

    expect(result.subtotalCents).toBe(30000);
    expect(result.discountCents).toBe(6000);
    expect(result.totalCents).toBe(24000);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Group: checkInventoryAvailability()
// ─────────────────────────────────────────────────────────────────────────────
describe("checkInventoryAvailability()", () => {
  // ── Happy Path: All Items Available ─────────────────────────────────────

  test("TC_PUR_INV_001 – returns available:true when all items have sufficient stock", () => {
    // Arrange: two items, both have more than enough stock
    const items = [
      { productId: "P1", requestedQty: 2, availableStock: 10 },
      { productId: "P2", requestedQty: 1, availableStock: 5 },
    ];

    // Act
    const result = checkInventoryAvailability(items);

    // Assert
    expect(result.available).toBe(true);
    expect(result.insufficientItems).toHaveLength(0);
  });

  test("TC_PUR_INV_002 – returns available:true when requested quantity exactly equals stock", () => {
    // Boundary test: requesting ALL remaining units should be allowed
    const items = [{ productId: "P1", requestedQty: 10, availableStock: 10 }];

    const result = checkInventoryAvailability(items);

    expect(result.available).toBe(true);
    expect(result.insufficientItems).toHaveLength(0);
  });

  // ── Negative: Insufficient Stock ─────────────────────────────────────────

  test("TC_PUR_INV_003 – returns available:false when one item exceeds stock", () => {
    /**
     * Negative test: P2 needs 3 but only 2 are available → should be flagged.
     * P1 is fine.
     */
    const items = [
      { productId: "P1", requestedQty: 5, availableStock: 10 }, // OK
      { productId: "P2", requestedQty: 3, availableStock: 2 }, // ❌ insufficient
    ];

    // Act
    const result = checkInventoryAvailability(items);

    // Assert: overall check fails, and P2 is in the insufficient list
    expect(result.available).toBe(false);
    expect(result.insufficientItems).toContain("P2");
    expect(result.insufficientItems).toHaveLength(1);
  });

  test("TC_PUR_INV_004 – lists ALL insufficient items (not just the first one)", () => {
    /**
     * Edge case: race condition or multi-item failure.
     * Both P1 and P2 are insufficient — the system should report both,
     * not stop at the first one.
     */
    const items = [
      { productId: "P1", requestedQty: 10, availableStock: 5 }, // ❌
      { productId: "P2", requestedQty: 7, availableStock: 3 }, // ❌
      { productId: "P3", requestedQty: 1, availableStock: 50 }, // OK
    ];

    // Act
    const result = checkInventoryAvailability(items);

    // Assert: both insufficient items are reported
    expect(result.available).toBe(false);
    expect(result.insufficientItems).toContain("P1");
    expect(result.insufficientItems).toContain("P2");
    expect(result.insufficientItems).not.toContain("P3");
    expect(result.insufficientItems).toHaveLength(2);
  });

  test("TC_PUR_INV_005 – returns available:false when stock is 0 (out of stock)", () => {
    // Negative test: zero stock means the product is completely unavailable
    const items = [{ productId: "P1", requestedQty: 1, availableStock: 0 }];

    const result = checkInventoryAvailability(items);

    expect(result.available).toBe(false);
    expect(result.insufficientItems).toContain("P1");
  });

  // ── Edge Case: Empty List ─────────────────────────────────────────────────

  test("TC_PUR_INV_006 – returns available:true for an empty item list", () => {
    // Edge case: no items means no inventory issues
    const result = checkInventoryAvailability([]);
    expect(result.available).toBe(true);
    expect(result.insufficientItems).toHaveLength(0);
  });
});
