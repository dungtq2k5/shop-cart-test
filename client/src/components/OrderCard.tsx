import { memo, useState } from "react";
import { ChevronDown, ChevronUp, Package, X } from "lucide-react";
import { formatCurrency, formatDate, getStatusClasses } from "../utils";
import type { Order } from "../types";
import { ORDER_STATUS } from "../config/constants";

type Props = Readonly<{
  order: Order;
  onCancel?: (orderId: string) => Promise<void>;
}>;

const OrderCard = memo(({ order, onCancel }: Props) => {
  const [expanded, setExpanded] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const handleCancel = async (): Promise<void> => {
    if (!onCancel) return;
    setCancelling(true);
    try {
      await onCancel(order.id);
    } finally {
      setCancelling(false);
    }
  };

  return (
    <div className="bg-(--color-surface) border border-(--color-border) rounded-2xl overflow-hidden">
      {/* Order Header */}
      <button
        id={`order-toggle-${order.id}`}
        onClick={() => setExpanded((e) => !e)}
        className="w-full flex items-center justify-between p-4 hover:bg-(--color-surface-2) transition-colors"
      >
        <div className="flex items-center gap-4 text-left">
          <div className="w-10 h-10 rounded-xl bg-(--color-surface-2) border border-(--color-border) flex items-center justify-center">
            <Package className="w-5 h-5 text-(--color-accent)" />
          </div>
          <div>
            <p className="text-xs text-(--color-text-muted)">
              Order #{order.id.slice(0, 8)}...
            </p>
            <p className="text-xs text-(--color-text-muted) mt-0.5">
              {formatDate(order.createdAt)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span
            className={`text-xs px-2 py-1 rounded-full font-medium ${getStatusClasses(order.status)}`}
          >
            {order.status}
          </span>
          <span className="font-bold text-sm text-(--color-accent-light)">
            {formatCurrency(order.totalAmountCents)}
          </span>
          {expanded ? (
            <ChevronUp className="w-4 h-4 text-(--color-text-muted)" />
          ) : (
            <ChevronDown className="w-4 h-4 text-(--color-text-muted)" />
          )}
        </div>
      </button>

      {/* Order Details */}
      {expanded && (
        <div className="border-t border-(--color-border) p-4 space-y-4">
          {/* Items */}
          <div className="space-y-2">
            {order.items.map((item) => (
              <div key={item.id} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-(--color-surface-2) flex items-center justify-center text-sm">
                  🛍️
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {item.product.name}
                  </p>
                  <p className="text-xs text-(--color-text-muted)">
                    {formatCurrency(item.unitPriceCents)} × {item.quantity}
                  </p>
                </div>
                <span className="text-sm font-bold text-(--color-accent-light)">
                  {formatCurrency(item.lineTotalCents)}
                </span>
              </div>
            ))}
          </div>

          {/* Financial summary */}
          <div className="rounded-xl bg-(--color-surface-2) border border-(--color-border) p-3 space-y-2">
            {order.couponCode && (
              <div className="flex justify-between text-sm text-emerald-400">
                <span>Coupon ({order.couponCode})</span>
                <span>−{formatCurrency(order.discountAmountCents)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-sm">
              <span>Total Paid</span>
              <span className="gradient-text">
                {formatCurrency(order.totalAmountCents)}
              </span>
            </div>
          </div>

          {/* Address */}
          <div className="text-xs text-(--color-text-muted)">
            <span className="font-medium text-(--color-text)">Delivery: </span>
            {order.deliveryAddress}
          </div>

          {/* Cancel button — only for PENDING orders */}
          {order.status === ORDER_STATUS.PENDING && onCancel && (
            <button
              id={`order-cancel-${order.id}`}
              onClick={handleCancel}
              disabled={cancelling}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-red-500/40 text-red-400 text-sm font-medium hover:bg-red-500/10 hover:border-red-500/70 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              <X className="w-4 h-4" />
              {cancelling ? "Cancelling…" : "Cancel Order"}
            </button>
          )}
        </div>
      )}
    </div>
  );
});

export default OrderCard;
