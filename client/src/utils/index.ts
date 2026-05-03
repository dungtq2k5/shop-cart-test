/**
 * Format an integer cent value to a USD currency string.
 * e.g. formatCurrency(1050) → "$10.50"
 */
export function formatCurrency(cents: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(cents / 100);
}

/**
 * Format an ISO timestamp string to a human-readable local date.
 */
export function formatDate(isoString: string): string {
  return new Date(isoString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Returns status badge styling classes based on order status.
 */
export function getStatusClasses(status: string): string {
  switch (status) {
    case 'COMPLETED':
      return 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30';
    case 'PENDING':
      return 'bg-amber-500/20 text-amber-400 border border-amber-500/30';
    case 'CANCELLED':
      return 'bg-red-500/20 text-red-400 border border-red-500/30';
    default:
      return 'bg-slate-500/20 text-slate-400 border border-slate-500/30';
  }
}
