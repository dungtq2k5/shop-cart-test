import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Trash2,
  Plus,
  Minus,
  ShoppingBag,
  Tag,
  ArrowRight,
} from "lucide-react";
import { useCartStore } from "../stores/useCartStore";
import { formatCurrency, formatError } from "../utils";
import toast from "react-hot-toast";

export default function CartPage() {
  const {
    cartItems,
    subtotalCents,
    fetchCart,
    updateQuantity,
    removeFromCart,
  } = useCartStore();
  const navigate = useNavigate();
  const [couponCode, setCouponCode] = useState("");
  const [removing, setRemoving] = useState<string | null>(null);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  const handleRemove = async (
    cartItemId: string,
    productName: string,
  ): Promise<void> => {
    setRemoving(cartItemId);
    try {
      await removeFromCart(cartItemId);
      toast.success(`${productName} removed from cart`);
    } catch (err) {
      toast.error(formatError(err, "Failed to remove item"));
    } finally {
      setRemoving(null);
    }
  };

  const handleCheckout = (): void => {
    navigate("/checkout", {
      state: { couponCode: couponCode.trim() || undefined },
    });
  };

  return (
    <>
      {cartItems.length === 0 ? (
        <div className="min-h-screen pt-24 flex items-center justify-center">
          <div className="text-center">
            <div className="text-8xl mb-6">🛒</div>
            <h1 className="text-2xl font-bold text-(--color-text) mb-2">
              Your cart is empty
            </h1>
            <p className="text-(--color-text-muted) mb-6">
              Add some products to get started!
            </p>
            <Link
              to="/"
              id="cart-browse-btn"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-(--color-accent) hover:bg-(--color-accent-hover) text-white font-semibold transition-all shadow-lg shadow-indigo-500/25"
            >
              <ShoppingBag className="w-4 h-4" />
              Browse Products
            </Link>
          </div>
        </div>
      ) : (
        <div className="min-h-screen pt-24 pb-12">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <h1 className="text-2xl font-bold mb-6">Shopping Cart</h1>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Cart Items */}
              <div className="lg:col-span-2 space-y-3">
                {cartItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-4 p-4 bg-(--color-surface) border border-(--color-border) rounded-2xl"
                  >
                    <div className="w-14 h-14 rounded-xl bg-(--color-surface-2) flex items-center justify-center text-2xl shrink-0">
                      🛍️
                    </div>

                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm truncate">
                        {item.product.name}
                      </h3>
                      <p className="text-xs text-(--color-text-muted) mt-0.5">
                        {formatCurrency(item.product.priceCents)} each
                      </p>
                    </div>

                    {/* Quantity controls */}
                    <div className="flex items-center gap-1 bg-(--color-surface-2) rounded-lg border border-(--color-border) p-1">
                      <button
                        id={`cart-qty-dec-${item.id}`}
                        onClick={() =>
                          updateQuantity(
                            item.id,
                            Math.max(1, item.quantity - 1),
                          )
                        }
                        className="w-7 h-7 rounded-md hover:bg-(--color-border) flex items-center justify-center text-(--color-text-muted) hover:text-(--color-text) transition-colors"
                        disabled={item.quantity <= 1}
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span
                        data-testid={`cart-qty-${item.id}`}
                        className="w-7 text-center text-sm font-medium"
                      >
                        {item.quantity}
                      </span>
                      <button
                        id={`cart-qty-inc-${item.id}`}
                        onClick={() =>
                          updateQuantity(item.id, item.quantity + 1)
                        }
                        className="w-7 h-7 rounded-md hover:bg-(--color-border) flex items-center justify-center text-(--color-text-muted) hover:text-(--color-text) transition-colors disabled:opacity-50"
                        disabled={item.quantity >= item.product.stockQty}
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    <span
                      data-testid={`cart-item-subtotal-${item.id}`}
                      className="font-bold text-sm text-(--color-accent-light) w-20 text-right"
                    >
                      {formatCurrency(item.subtotalCents)}
                    </span>

                    <button
                      id={`cart-remove-${item.id}`}
                      onClick={() => handleRemove(item.id, item.product.name)}
                      disabled={removing === item.id}
                      className="p-2 text-(--color-text-muted) hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all disabled:opacity-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Order Summary */}
              <div className="space-y-4">
                {/* Coupon */}
                <div className="p-4 bg-(--color-surface) border border-(--color-border) rounded-2xl">
                  <div className="flex items-center gap-2 mb-3">
                    <Tag className="w-4 h-4 text-(--color-accent)" />
                    <h3 className="font-semibold text-sm">Promo Code</h3>
                  </div>
                  <div className="flex gap-2">
                    <input
                      id="coupon-input"
                      type="text"
                      value={couponCode}
                      onChange={(e) =>
                        setCouponCode(e.target.value.toUpperCase())
                      }
                      placeholder="e.g. SAVE10"
                      className="flex-1 px-3 py-2 rounded-lg bg-(--color-surface-2) border border-(--color-border) text-(--color-text) placeholder-(--color-text-muted) text-sm focus:border-(--color-accent) focus:ring-1 focus:ring-(--color-accent)/50 transition-all uppercase"
                    />
                  </div>
                  <p className="text-xs text-(--color-text-muted) mt-2">
                    Try:{" "}
                    <span className="text-(--color-accent-light)">SAVE10</span>{" "}
                    or{" "}
                    <span className="text-(--color-accent-light)">
                      SUMMER50
                    </span>
                  </p>
                </div>

                {/* Summary */}
                <div className="p-5 bg-(--color-surface) border border-(--color-border) rounded-2xl space-y-3">
                  <h3 className="font-bold">Order Summary</h3>
                  <div className="flex justify-between text-sm text-(--color-text-muted)">
                    <span>
                      Subtotal ({cartItems.reduce((s, i) => s + i.quantity, 0)}{" "}
                      items)
                    </span>
                    <span
                      data-testid="cart-summary-subtotal"
                      className="text-(--color-text)"
                    >
                      {formatCurrency(subtotalCents)}
                    </span>
                  </div>
                  {couponCode && (
                    <div className="flex justify-between text-sm">
                      <span className="text-emerald-400">
                        Coupon ({couponCode})
                      </span>
                      <span className="text-emerald-400">
                        Applied at checkout
                      </span>
                    </div>
                  )}
                  <div className="border-t border-(--color-border) pt-3 flex justify-between">
                    <span className="font-bold">Estimated Total</span>
                    <span
                      data-testid="cart-summary-total"
                      className="font-bold text-lg gradient-text"
                    >
                      {formatCurrency(subtotalCents)}
                    </span>
                  </div>
                  <button
                    id="proceed-checkout-btn"
                    onClick={handleCheckout}
                    className="w-full py-3 rounded-xl bg-(--color-accent) hover:bg-(--color-accent-hover) text-white font-semibold text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40"
                  >
                    Proceed to Checkout
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
