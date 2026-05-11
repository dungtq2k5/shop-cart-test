/**
 * @file cartValidation.ts
 * @description Pure functions for validating shopping cart input data.
 *
 * These functions contain NO side effects, NO API calls, and NO React imports —
 * they are intentionally "pure" so they are easy to unit-test in isolation.
 *
 * TDD note: The tests for this module were designed BEFORE writing these
 * implementations (Red → Green → Refactor).
 */

// ── Types ──────────────────────────────────────────────────────────────────

/** Input payload for adding a product to the cart. */
export type CartItemInput = {
  productId: string | null | undefined;
  quantity: number;
  stock: number;
  isActive?: boolean; // defaults to true if omitted
};

/** The result returned by validateCartItem(). */
export type ValidationResult = {
  valid: boolean;
  error?: string;
};

// ── Constants ─────────────────────────────────────────────────────────────

/** Minimum allowed quantity for any cart item. */
export const MIN_QUANTITY = 1;

// ── Functions ──────────────────────────────────────────────────────────────

/**
 * Validates a cart item before adding it to the cart.
 *
 * Business rules checked (in order):
 * 1. productId must be non-null, non-empty.
 * 2. quantity must be >= 1 (no zero or negative values).
 * 3. quantity must not exceed available stock.
 * 4. product must be active (isActive === true).
 *
 * @param input - The cart item payload to validate.
 * @returns A ValidationResult with `valid: true` or `valid: false` plus an error message.
 *
 * @example
 * validateCartItem({ productId: "p1", quantity: 2, stock: 10 })
 * // → { valid: true }
 *
 * validateCartItem({ productId: "p1", quantity: 0, stock: 10 })
 * // → { valid: false, error: "Quantity must be at least 1" }
 */
export function validateCartItem(input: CartItemInput): ValidationResult {
  // Rule 1: productId must exist and be non-empty
  if (!input.productId || input.productId.trim() === "") {
    return { valid: false, error: "Product ID is required" };
  }

  // Rule 2: quantity must be a positive integer (≥ 1)
  if (!Number.isInteger(input.quantity) || input.quantity < MIN_QUANTITY) {
    return { valid: false, error: "Quantity must be at least 1" };
  }

  // Rule 3: quantity cannot exceed available stock
  if (input.quantity > input.stock) {
    return {
      valid: false,
      error: `Quantity (${input.quantity}) exceeds available stock (${input.stock})`,
    };
  }

  // Rule 4: product must be active
  if (input.isActive === false) {
    return { valid: false, error: "Product is not available for purchase" };
  }

  return { valid: true };
}

/**
 * Calculates the line subtotal for a single cart item.
 *
 * All prices are stored and calculated in **integer cents** to avoid
 * floating-point rounding errors (e.g., $10.50 → 1050 cents).
 *
 * @param priceCents - Unit price in cents (must be > 0).
 * @param quantity   - Number of units (must be ≥ 1).
 * @returns Total cost in cents for this line item.
 *
 * @example
 * calculateLineSubtotal(1500, 3) // → 4500 (i.e., $45.00)
 */
export function calculateLineSubtotal(
  priceCents: number,
  quantity: number,
): number {
  return priceCents * quantity;
}

/**
 * Calculates the grand total of all items in the cart.
 *
 * @param items - Array of { priceCents, quantity } objects.
 * @returns Sum of all line subtotals in cents.
 *
 * @example
 * calculateCartTotal([{ priceCents: 1000, quantity: 2 }, { priceCents: 500, quantity: 1 }])
 * // → 2500
 */
export function calculateCartTotal(
  items: Array<{ priceCents: number; quantity: number }>,
): number {
  return items.reduce(
    (sum, item) => sum + calculateLineSubtotal(item.priceCents, item.quantity),
    0,
  );
}

/**
 * Counts the total number of individual units across all items in the cart.
 *
 * @param items - Array of objects with a `quantity` field.
 * @returns Sum of all quantities.
 *
 * @example
 * calculateCartItemCount([{ quantity: 2 }, { quantity: 3 }]) // → 5
 */
export function calculateCartItemCount(
  items: Array<{ quantity: number }>,
): number {
  return items.reduce((sum, item) => sum + item.quantity, 0);
}
