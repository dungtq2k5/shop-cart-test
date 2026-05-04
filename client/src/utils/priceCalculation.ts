/**
 * @file priceCalculation.ts
 * @description Pure functions for order price and inventory calculations.
 *
 * These functions have NO side effects — they take inputs and return outputs.
 * This makes them ideal for TDD: write the test first (Red), implement the
 * function to pass (Green), then clean up (Refactor).
 *
 * All monetary values are in **integer cents** to avoid floating-point issues.
 */

// ── Types ──────────────────────────────────────────────────────────────────

/** A single order line item: price + quantity. */
export type OrderLineItem = {
  priceCents: number;
  quantity: number;
};

/** Coupon discount types supported by the system. */
export type Coupon =
  | { type: "percentage"; value: number } // e.g. { type: "percentage", value: 10 } → 10% off
  | { type: "fixed"; value: number }; // e.g. { type: "fixed", value: 500 } → $5.00 off

/** Full breakdown of an order price calculation. */
export type OrderPriceResult = {
  subtotalCents: number;
  discountCents: number;
  shippingCents: number;
  totalCents: number;
};

/** Inventory check input per product. */
export type InventoryCheckItem = {
  productId: string;
  requestedQty: number;
  availableStock: number;
};

/** Result of an inventory availability check. */
export type InventoryCheckResult = {
  available: boolean;
  insufficientItems: string[]; // product IDs that don't have enough stock
};

// ── Functions ──────────────────────────────────────────────────────────────

/**
 * Calculates the complete price breakdown for a purchase.
 *
 * Formula:
 *   subtotal  = Σ (priceCents × quantity)
 *   discount  = calculated from coupon (percentage or fixed)
 *   total     = subtotal + shipping − discount  (never negative)
 *
 * @param items         - Array of order line items.
 * @param coupon        - Optional coupon to apply (null/undefined = no discount).
 * @param shippingCents - Flat shipping fee in cents (default 0).
 * @returns An OrderPriceResult with the full price breakdown.
 *
 * @example
 * // No coupon, free shipping
 * calculateOrderPrice([{ priceCents: 5000, quantity: 2 }], null, 0)
 * // → { subtotalCents: 10000, discountCents: 0, shippingCents: 0, totalCents: 10000 }
 *
 * // 10% coupon
 * calculateOrderPrice([{ priceCents: 10000, quantity: 1 }], { type: "percentage", value: 10 }, 0)
 * // → { subtotalCents: 10000, discountCents: 1000, shippingCents: 0, totalCents: 9000 }
 */
export function calculateOrderPrice(
  items: OrderLineItem[],
  coupon: Coupon | null | undefined,
  shippingCents: number = 0,
): OrderPriceResult {
  // Step 1: calculate subtotal (sum of all line totals)
  const subtotalCents = items.reduce(
    (sum, item) => sum + item.priceCents * item.quantity,
    0,
  );

  // Step 2: calculate discount based on coupon type
  let discountCents = 0;
  if (coupon) {
    if (coupon.type === "percentage") {
      // Integer math: round half-up to avoid fractional cents
      discountCents = Math.round((subtotalCents * coupon.value) / 100);
    } else if (coupon.type === "fixed") {
      // Fixed amount — cannot exceed the subtotal
      discountCents = Math.min(coupon.value, subtotalCents);
    }
  }

  // Step 3: final total — clamp to 0 so it never goes negative
  const totalCents = Math.max(0, subtotalCents + shippingCents - discountCents);

  return { subtotalCents, discountCents, shippingCents, totalCents };
}

/**
 * Checks whether all items in an order have sufficient inventory.
 *
 * Iterates over each item and compares requestedQty against availableStock.
 * Collects ALL insufficient items (not just the first one) for a better UX.
 *
 * @param items - Array of inventory check items.
 * @returns An InventoryCheckResult indicating overall availability and which
 *          products are insufficient.
 *
 * @example
 * checkInventoryAvailability([
 *   { productId: "P1", requestedQty: 5, availableStock: 10 }, // ✅ OK
 *   { productId: "P2", requestedQty: 3, availableStock: 2 },  // ❌ insufficient
 * ])
 * // → { available: false, insufficientItems: ["P2"] }
 */
export function checkInventoryAvailability(
  items: InventoryCheckItem[],
): InventoryCheckResult {
  // Filter down to only items where we don't have enough stock
  const insufficientItems = items
    .filter((item) => item.requestedQty > item.availableStock)
    .map((item) => item.productId);

  return {
    available: insufficientItems.length === 0,
    insufficientItems,
  };
}
