import {
  CURRENCY_LOCALE,
  CURRENCY_CODE,
  CENTS_PER_DOLLAR,
  DATE_LOCALE,
  DATE_FORMAT_OPTIONS,
  ORDER_STATUS_CLASSES,
  type OrderStatus,
} from "../config/constants";

/**
 * Format an integer cent value to a USD currency string.
 * e.g. formatCurrency(1050) → "$10.50"
 */
export function formatCurrency(cents: number): string {
  return new Intl.NumberFormat(CURRENCY_LOCALE, {
    style: "currency",
    currency: CURRENCY_CODE,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(cents / CENTS_PER_DOLLAR);
}

/**
 * Format an ISO timestamp string to a human-readable local date.
 */
export function formatDate(isoString: string): string {
  return new Date(isoString).toLocaleDateString(
    DATE_LOCALE,
    DATE_FORMAT_OPTIONS,
  );
}

/**
 * Returns status badge styling classes based on order status.
 * Uses the centralised ORDER_STATUS_CLASSES map for single-source-of-truth colors.
 */
export function getStatusClasses(status: string): string {
  return (
    ORDER_STATUS_CLASSES[status as OrderStatus] ??
    "bg-slate-500/20 text-slate-400 border border-slate-500/30"
  );
}

/**
 * Extracts a user-facing error message from an unknown caught value.
 * Handles: Axios errors, plain Error instances, strings, and opaque objects.
 */
export function formatError(
  err: unknown,
  fallback: string = "An unknown error occurred",
): string {
  if (typeof err === "string") return err;

  // Prioritize Axios-style error: { response: { data: { message: string } } }
  if (err !== null && typeof err === "object" && "response" in err) {
    const resp = (err as { response?: { data?: { message?: string } } })
      .response;
    if (resp?.data?.message) return resp.data.message;
  }

  if (err instanceof Error) return err.message;

  return fallback;
}
