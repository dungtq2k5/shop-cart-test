/**
 * @file constants.ts
 * @description Central configuration file for all application-wide constants.
 * Inspired by the admin configs pattern — keeping all magic strings and
 * configurable values in one place for easy management.
 */

// ── API ────────────────────────────────────────────────────────────────────

export const API_BASE_URL = "/api/v1";

export const ENDPOINTS = {
  // Auth
  AUTH_CHECK: "/auth/check",
  AUTH_LOGIN: "/auth/login",
  AUTH_REGISTER: "/auth/register",
  AUTH_LOGOUT: "/auth/logout",

  // User
  USERS_ME: "/users/me",

  // Products
  PRODUCTS: "/products",

  // Cart
  CART: "/cart",

  // Orders
  ORDERS_ME: "/orders/me",
  ORDERS: "/orders",
  ORDERS_CHECKOUT: "/orders/checkout",
  ORDERS_CANCEL: (id: string) => `/orders/${id}/cancel`,
} as const;

// ── Order status ───────────────────────────────────────────────────────────

export const ORDER_STATUS = {
  PENDING: "PENDING",
  COMPLETED: "COMPLETED",
  CANCELLED: "CANCELLED",
} as const;

export type OrderStatus = (typeof ORDER_STATUS)[keyof typeof ORDER_STATUS];

// Status → Tailwind classes mapping (single source of truth for badge colours)
export const ORDER_STATUS_CLASSES: Record<OrderStatus, string> = {
  PENDING: "bg-amber-500/15 text-amber-400 border border-amber-500/30",
  COMPLETED: "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30",
  CANCELLED: "bg-red-500/15 text-red-400 border border-red-500/30",
} as const;

// ── Pagination defaults ────────────────────────────────────────────────────

export const DEFAULT_PAGE = 0;
export const DEFAULT_PAGE_SIZE = 12;
export const SORT_BY_NAME_ASC = "name,asc";

// ── Cart ───────────────────────────────────────────────────────────────────

export const MIN_CART_ITEM_QUANTITY = 1;
export const MAX_CART_ITEM_QUANTITY = 99;
export const CART_DEBOUNCE_MS = 600; // milliseconds before quantity update is sent to API

// ── Currency / Display ─────────────────────────────────────────────────────

export const CURRENCY_LOCALE = "en-US";
export const CURRENCY_CODE = "USD";
export const CENTS_PER_DOLLAR = 100;

// ── Dates ──────────────────────────────────────────────────────────────────

export const DATE_LOCALE = "en-US";
export const DATE_FORMAT_OPTIONS: Intl.DateTimeFormatOptions = {
  year: "numeric",
  month: "short",
  day: "numeric",
} as const;

// ── Toast / Notifications ─────────────────────────────────────────────────

export const TOAST_DURATION_MS = 4000;
export const TOAST_ERROR_DURATION_MS = 5000;

export const TOAST_STYLE = {
  background: "var(--color-surface)",
  color: "var(--color-text)",
  border: "1px solid var(--color-border)",
  borderRadius: "12px",
  fontSize: "14px",
} as const;

export const TOAST_SUCCESS_ICON_THEME = {
  primary: "#10b981",
  secondary: "#fff",
} as const;

export const TOAST_ERROR_ICON_THEME = {
  primary: "#ef4444",
  secondary: "#fff",
} as const;

// ── Routes ─────────────────────────────────────────────────────────────────

export const ROUTES = {
  HOME: "/",
  LOGIN: "/login",
  REGISTER: "/register",
  CART: "/cart",
  CHECKOUT: "/checkout",
  PROFILE: "/profile",
} as const;

// ── Auth events ────────────────────────────────────────────────────────────

export const AUTH_UNAUTHORIZED_EVENT = "auth:unauthorized";

// ── UI Messages ────────────────────────────────────────────────────────────

export const MESSAGES = {
  // Auth
  LOGIN_SUCCESS: "Welcome back!",
  REGISTER_SUCCESS: "Account created! Welcome to ShopCart!",
  LOGOUT_SUCCESS: "Logged out successfully",
  PASSWORD_MIN_LENGTH: "Password must be at least 8 characters",
  // Profile
  PROFILE_UPDATED: "Profile updated successfully",
  PROFILE_NO_CHANGES: "No changes to save",
  // Cart
  ADDED_TO_CART: "Added to cart!",
  REMOVED_FROM_CART: "Removed from cart",
  // Orders
  ORDER_PLACED: "Order placed successfully! 🎉",
  ORDER_CANCELLED: "Order cancelled and stock refunded.",
  ORDER_CANCEL_FAILED: "Failed to cancel order. Please try again.",
  // Errors
  FALLBACK_ERROR: "Something went wrong",
  LOGIN_FAILED: "Login failed",
  REGISTER_FAILED: "Registration failed",
  CHECKOUT_FAILED: "Checkout failed. Please try again.",
  ORDERS_LOAD_FAILED: "Failed to load orders",
  PROFILE_UPDATE_FAILED: "Failed to update profile",
} as const;

// ── Validation ─────────────────────────────────────────────────────────────

export const PASSWORD_MIN_LENGTH = 8;

// ── Product search defaults ────────────────────────────────────────────────

export const SEARCH_PARAM_NAME = "name";
export const SEARCH_PARAM_PRICE_MIN = "priceCentsMin";
export const SEARCH_PARAM_PRICE_MAX = "priceCentsMax";
