import { memo } from "react";
import type { Product } from "../types";
import { formatCurrency } from "../utils";

const ProductCard = memo(
  ({
    product,
    onClick,
  }: Readonly<{ product: Product; onClick: () => void }>) => {
    return (
      <button
        id={`product-card-${product.id}`}
        onClick={onClick}
        className="group text-left bg-(--color-surface) border border-(--color-border) rounded-2xl overflow-hidden hover:border-(--color-accent)/50 hover:shadow-xl hover:shadow-indigo-500/10 transition-all duration-300 hover:-translate-y-1"
      >
        {/* Placeholder image area */}
        <div className="h-48 bg-linear-to-br from-(--color-surface-2) to-(--color-border) flex items-center justify-center relative overflow-hidden">
          <div className="text-5xl select-none opacity-60">🛍️</div>
          <div className="absolute inset-0 bg-linear-to-t from-(--color-surface) via-transparent to-transparent opacity-60" />
          {product.stockQty === 0 && (
            <div className="absolute top-2 right-2 px-2 py-1 rounded-full bg-red-500/90 text-white text-xs font-semibold">
              Sold Out
            </div>
          )}
          {product.stockQty > 0 && product.stockQty < 10 && (
            <div className="absolute top-2 right-2 px-2 py-1 rounded-full bg-amber-500/90 text-white text-xs font-semibold">
              Low Stock
            </div>
          )}
        </div>

        <div className="p-4 space-y-2">
          <h3 className="font-semibold text-sm text-(--color-text) line-clamp-2 group-hover:text-(--color-accent-light) transition-colors">
            {product.name}
          </h3>
          {product.description && (
            <p className="text-xs text-(--color-text-muted) line-clamp-2">
              {product.description}
            </p>
          )}
          <div className="flex items-center justify-between pt-1">
            <span className="font-bold text-(--color-accent-light)">
              {formatCurrency(product.priceCents)}
            </span>
            <span className="text-xs text-(--color-text-muted)">
              {product.stockQty} in stock
            </span>
          </div>
        </div>
      </button>
    );
  },
);

export default ProductCard;
