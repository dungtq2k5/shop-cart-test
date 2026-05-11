import { X, ShoppingCart, Star } from "lucide-react";
import type { Product } from "../types";
import { formatCurrency, formatError } from "../utils";
import { calculateLineSubtotal } from "../utils/cartValidation";
import { useCartStore } from "../stores/useCartStore";
import { useAuthStore } from "../stores/useAuthStore";
import { useEffect, useRef, useState, useMemo, useCallback, memo } from "react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";

type Props = Readonly<{
  product: Product;
  onClose: () => void;
}>;

const ProductModal = memo(({ product, onClose }: Props) => {
  const { cartItems, addToCart } = useCartStore();
  const { isAuth } = useAuthStore();
  const navigate = useNavigate();
  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);

  // Memoize stock availability — only recalculates when cartItems or product change
  const maxToAdd = useMemo(() => {
    const existing = cartItems.find((i) => i.product.id === product.id);
    const qty = existing ? existing.quantity : 0;
    return Math.max(0, product.stockQty - qty);
  }, [cartItems, product.id, product.stockQty]);

  // Memoize line subtotal display — recalculates only when price or quantity changes
  const lineSubtotal = useMemo(
    () => calculateLineSubtotal(product.priceCents, quantity),
    [product.priceCents, quantity],
  );

  // Trap focus & prevent background scroll
  useEffect(() => {
    document.body.style.overflow = "hidden";
    const firstFocusable = dialogRef.current?.querySelector<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    );
    firstFocusable?.focus();

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    globalThis.addEventListener("keydown", handleKey);
    return () => {
      document.body.style.overflow = "";
      globalThis.removeEventListener("keydown", handleKey);
    };
  }, [onClose]);

  const handleAddToCart = useCallback(async (): Promise<void> => {
    if (!isAuth) {
      toast.error("Please log in to add items to cart");
      navigate("/login");
      return;
    }
    setAdding(true);
    try {
      await addToCart({ productId: product.id, quantity });
      toast.success(`${product.name} added to cart!`);
      onClose();
    } catch (err) {
      toast.error(formatError(err, "Failed to add item to cart"));
    } finally {
      setAdding(false);
    }
  }, [
    isAuth,
    navigate,
    addToCart,
    product.id,
    product.name,
    quantity,
    onClose,
  ]);

  return (
    <div
      role="dialog"
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      aria-modal="true"
      aria-labelledby="product-modal-title"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Dialog */}
      <div
        ref={dialogRef}
        className="relative w-full max-w-lg bg-(--color-surface) rounded-2xl border border-(--color-border) shadow-2xl shadow-black/50 overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-start justify-between p-6 pb-0">
          <div className="flex-1 pr-4">
            <h2
              id="product-modal-title"
              className="text-xl font-bold text-(--color-text)"
            >
              {product.name}
            </h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-2xl font-bold gradient-text">
                {formatCurrency(product.priceCents)}
              </span>
              {product.stockQty < 10 && product.stockQty > 0 && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  Only {product.stockQty} left
                </span>
              )}
              {product.stockQty === 0 && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/30">
                  Out of stock
                </span>
              )}
            </div>
          </div>
          <button
            id="product-modal-close"
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-(--color-surface-2) text-(--color-text-muted) hover:text-(--color-text) transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          {product.description && (
            <p className="text-(--color-text-muted) text-sm leading-relaxed">
              {product.description}
            </p>
          )}

          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((s) => (
              <Star key={s} className="w-4 h-4 fill-amber-400 text-amber-400" />
            ))}
            <span className="text-xs text-(--color-text-muted) ml-1">
              5.0 (Premium Quality)
            </span>
          </div>

          {/* Quantity Selector */}
          {maxToAdd > 0 && (
            <div className="flex items-center gap-3">
              <span className="text-sm text-(--color-text-muted)">
                Quantity:
              </span>
              <div className="flex items-center gap-1 bg-(--color-surface-2) rounded-lg border border-(--color-border) p-1">
                <button
                  id="product-modal-qty-dec"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="w-8 h-8 rounded-md hover:bg-(--color-border) flex items-center justify-center text-(--color-text-muted) hover:text-(--color-text) transition-colors font-bold"
                  disabled={quantity <= 1}
                >
                  −
                </button>
                <span className="w-8 text-center text-sm font-medium">
                  {quantity}
                </span>
                <button
                  id="product-modal-qty-inc"
                  onClick={() => setQuantity((q) => Math.min(maxToAdd, q + 1))}
                  className="w-8 h-8 rounded-md hover:bg-(--color-border) flex items-center justify-center text-(--color-text-muted) hover:text-(--color-text) transition-colors font-bold"
                  disabled={quantity >= maxToAdd}
                >
                  +
                </button>
              </div>
              <span className="text-xs text-(--color-text-muted)">
                {product.stockQty} in stock
              </span>
            </div>
          )}

          {/* Subtotal */}
          {maxToAdd > 0 && (
            <div className="rounded-lg bg-(--color-surface-2) border border-(--color-border) p-3 flex items-center justify-between">
              <span className="text-sm text-(--color-text-muted)">Total</span>
              <span className="font-bold text-(--color-accent-light)">
                {formatCurrency(lineSubtotal)}
              </span>
            </div>
          )}

          <button
            id="product-modal-add-to-cart"
            onClick={handleAddToCart}
            disabled={adding || maxToAdd === 0}
            className="w-full py-3 rounded-xl bg-(--color-accent) hover:bg-(--color-accent-hover) disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40"
          >
            <ShoppingCart className="w-4 h-4" />
            {adding
              ? "Adding..."
              : maxToAdd === 0
                ? "Max Stock Reached"
                : "Add to Cart"}
          </button>
        </div>
      </div>
    </div>
  );
});

export default ProductModal;
