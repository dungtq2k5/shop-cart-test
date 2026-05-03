import { memo, useState } from "react";
import { ChevronDown, ChevronUp, Package } from "lucide-react";
import { formatCurrency, formatDate, getStatusClasses } from "../utils";
import type { Order } from "../types";

const OrderCard = memo(({ order }: Readonly<{ order: Order }>) => {
  const [expanded, setExpanded] = useState(false);

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
        </div>
      )}
    </div>
  );
});

export default OrderCard;
