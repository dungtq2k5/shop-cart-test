import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { MapPin, Package, Tag, ArrowRight } from "lucide-react";
import { useCartStore } from "../stores/useCartStore";
import { formatCurrency, formatError } from "../utils";
import api from "../lib/api";
import toast from "react-hot-toast";
import { ENDPOINTS, HARD_CODED_SHIPPING_FEE_CENTS } from "../config/constants";

export default function CheckoutPage() {
  const { cartItems, subtotalCents, clearCart } = useCartStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [couponCode, setCouponCode] = useState(
    (location.state as { couponCode: string } | null)?.couponCode || "",
  );
  const [loading, setLoading] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);

  useEffect(() => {
    if (cartItems.length === 0 && !orderPlaced) {
      navigate("/cart");
    }
  }, [cartItems, navigate, orderPlaced]);

  const handleSubmit = async (
    e: React.SubmitEvent<HTMLFormElement>,
  ): Promise<void> => {
    e.preventDefault();
    if (!deliveryAddress.trim()) {
      toast.error("Delivery address is required");
      return;
    }
    setLoading(true);
    try {
      await api.post(ENDPOINTS.ORDERS_CHECKOUT, {
        deliveryAddress: deliveryAddress.trim(),
        couponCode: couponCode.trim() || undefined,
      });
      setOrderPlaced(true);
      clearCart();
      toast.success("Order placed successfully! 🎉");
      navigate("/profile", { state: { tab: "orders" } });
    } catch (err: unknown) {
      toast.error(formatError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen pt-24 pb-12">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-2xl font-bold mb-6">Checkout</h1>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Form */}
          <form
            id="checkout-form"
            onSubmit={handleSubmit}
            className="lg:col-span-3 space-y-5"
          >
            {/* Delivery Address */}
            <div className="p-6 bg-(--color-surface) border border-(--color-border) rounded-2xl space-y-4">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-(--color-accent)" />
                <h2 className="font-semibold">Delivery Address</h2>
              </div>
              <div>
                <label
                  htmlFor="checkout-address"
                  className="block text-xs text-(--color-text-muted) mb-1.5"
                >
                  Full shipping address *
                </label>
                <textarea
                  id="checkout-address"
                  required
                  rows={3}
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  placeholder="123 Main Street, City, State ZIP, Country"
                  className="w-full px-4 py-3 rounded-xl bg-(--color-surface-2) border border-(--color-border) text-(--color-text) placeholder-(--color-text-muted) text-sm resize-none focus:border-(--color-accent) focus:ring-2 focus:ring-(--color-accent)/20 transition-all"
                />
              </div>
            </div>

            {/* Coupon */}
            <div className="p-6 bg-(--color-surface) border border-(--color-border) rounded-2xl space-y-3">
              <div className="flex items-center gap-2">
                <Tag className="w-4 h-4 text-(--color-accent)" />
                <h2 className="font-semibold">Promo Code</h2>
                <span className="text-xs text-(--color-text-muted)">
                  (optional)
                </span>
              </div>
              <input
                id="checkout-coupon"
                type="text"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                placeholder="Enter promo code (e.g. SAVE10)"
                className="w-full px-4 py-3 rounded-xl bg-(--color-surface-2) border border-(--color-border) text-(--color-text) placeholder-(--color-text-muted) text-sm uppercase focus:border-(--color-accent) focus:ring-2 focus:ring-(--color-accent)/20 transition-all"
              />
            </div>

            <button
              id="checkout-submit"
              type="submit"
              disabled={loading}
              className="w-full py-4 rounded-2xl bg-(--color-accent) hover:bg-(--color-accent-hover) disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold text-base flex items-center justify-center gap-2 transition-all shadow-2xl shadow-indigo-500/30 hover:shadow-indigo-500/50"
            >
              <Package className="w-5 h-5" />
              {loading ? "Placing Order..." : "Place Order"}
              {!loading && <ArrowRight className="w-5 h-5" />}
            </button>
          </form>

          {/* Order Summary */}
          <div className="lg:col-span-2">
            <div className="p-6 bg-(--color-surface) border border-(--color-border) rounded-2xl space-y-4 sticky top-24">
              <h2 className="font-bold">Order Summary</h2>
              <div className="space-y-3 max-h-72 overflow-y-auto scrollbar-hide">
                {cartItems.map((item) => (
                  <div key={item.id} className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-(--color-surface-2) flex items-center justify-center text-sm shrink-0">
                      🛍️
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">
                        {item.product.name}
                      </p>
                      <p className="text-xs text-(--color-text-muted)">
                        × {item.quantity}
                      </p>
                    </div>
                    <span className="text-xs font-bold text-(--color-accent-light)">
                      {formatCurrency(item.subtotalCents)}
                    </span>
                  </div>
                ))}
              </div>
              <div className="border-t border-(--color-border) pt-3 space-y-2">
                <div className="flex justify-between text-sm text-(--color-text-muted)">
                  <span>Subtotal</span>
                  <span>{formatCurrency(subtotalCents)}</span>
                </div>
                {couponCode && (
                  <div className="flex justify-between text-sm text-emerald-400">
                    <span>Coupon: {couponCode}</span>
                    <span>Applied</span>
                  </div>
                )}
                <div className="flex justify-between text-sm text-(--color-text-muted)">
                  <span>Shipping Fee</span>
                  <span>{formatCurrency(HARD_CODED_SHIPPING_FEE_CENTS)}</span>
                </div>
                <div className="flex justify-between font-bold text-base">
                  <span>Total</span>
                  <span id="checkout-total-price" className="gradient-text">
                    {formatCurrency(
                      subtotalCents + HARD_CODED_SHIPPING_FEE_CENTS,
                    )}
                  </span>
                </div>
                <p className="text-xs text-(--color-text-muted)">
                  * Final total calculated at server with coupon
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
