import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { User, ShoppingBag, Eye, EyeOff } from "lucide-react";
import { useAuthStore } from "../stores/useAuthStore";
import { formatDate, formatError } from "../utils";
import api from "../lib/api";
import type { Order } from "../types";
import toast from "react-hot-toast";
import OrderCard from "../components/OrderCard";
import { ENDPOINTS, MESSAGES } from "../config/constants";

type Tab = "account" | "orders";

type LocationState = {
  tab?: Tab;
};

export default function ProfilePage() {
  const { user, setUser } = useAuthStore();
  const location = useLocation();
  const defaultTab: Tab =
    (location.state as LocationState)?.tab === "orders" ? "orders" : "account";
  const [activeTab, setActiveTab] = useState<Tab>(defaultTab);
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);

  // Account settings state
  const [email, setEmail] = useState(user?.email || "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchOrders = async (): Promise<void> => {
      if (activeTab !== "orders") return;
      setOrdersLoading(true);
      try {
        const { data } = await api.get(ENDPOINTS.ORDERS_ME);
        setOrders(data.data as Order[]);
      } catch (err) {
        toast.error(formatError(err, "Failed to load orders"));
      } finally {
        setOrdersLoading(false);
      }
    };

    fetchOrders();
  }, [activeTab]);

  const handleCancelOrder = async (orderId: string): Promise<void> => {
    try {
      const { data } = await api.patch(ENDPOINTS.ORDERS_CANCEL(orderId));
      const cancelledOrder = data.data as Order;
      // Update the order in-place so the list re-renders without a full reload
      setOrders((prev) =>
        prev.map((o) => (o.id === cancelledOrder.id ? cancelledOrder : o)),
      );
      toast.success(MESSAGES.ORDER_CANCELLED);
    } catch (err: unknown) {
      toast.error(formatError(err) || MESSAGES.ORDER_CANCEL_FAILED);
    }
  };

  const handleSaveProfile = async (
    e: React.SubmitEvent<HTMLFormElement>,
  ): Promise<void> => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload: Record<string, string> = {};
      if (email !== user?.email) payload.email = email;
      if (newPassword) {
        payload.currentPassword = currentPassword;
        payload.newPassword = newPassword;
      }
      if (Object.keys(payload).length === 0) {
        toast("No changes to save", { icon: "ℹ️" });
        return;
      }
      const { data } = await api.patch("/users/me", payload);
      setUser(data.data as typeof user);
      toast.success("Profile updated successfully");
      setCurrentPassword("");
      setNewPassword("");
    } catch (err: unknown) {
      toast.error(formatError(err));
    } finally {
      setSaving(false);
    }
  };

  const tabClass = (tab: Tab): string =>
    `flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${
      activeTab === tab
        ? "bg-(--color-accent) text-white shadow-lg shadow-indigo-500/20"
        : "text-(--color-text-muted) hover:text-(--color-text) hover:bg-(--color-surface-2)"
    }`;

  return (
    <div className="min-h-screen pt-24 pb-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Profile header */}
        <div className="flex items-center gap-4 mb-8">
          <div className="w-16 h-16 rounded-2xl bg-linear-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-indigo-500/30">
            {user?.email[0].toUpperCase()}
          </div>
          <div>
            <h1 className="text-2xl font-bold">{user?.email}</h1>
            <p className="text-sm text-(--color-text-muted)">
              Member since {user?.createdAt ? formatDate(user.createdAt) : "—"}
            </p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 mb-6 p-1 bg-(--color-surface) border border-(--color-border) rounded-2xl w-fit">
          <button
            id="tab-account"
            onClick={() => setActiveTab("account")}
            className={tabClass("account")}
          >
            <User className="w-4 h-4" />
            Account Settings
          </button>
          <button
            id="tab-orders"
            onClick={() => setActiveTab("orders")}
            className={tabClass("orders")}
          >
            <ShoppingBag className="w-4 h-4" />
            Order History
          </button>
        </div>

        {/* Account Settings Tab */}
        {activeTab === "account" && (
          <form
            id="profile-form"
            onSubmit={handleSaveProfile}
            className="space-y-6"
          >
            <div className="p-6 bg-(--color-surface) border border-(--color-border) rounded-2xl space-y-5">
              <h2 className="font-bold flex items-center gap-2">
                <User className="w-4 h-4 text-(--color-accent)" />
                Account Details
              </h2>
              <div>
                <label
                  htmlFor="profile-email"
                  className="block text-sm text-(--color-text-muted) mb-1.5"
                >
                  Email Address
                </label>
                <input
                  id="profile-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-(--color-surface-2) border border-(--color-border) text-(--color-text) text-sm focus:border-(--color-accent) focus:ring-2 focus:ring-(--color-accent)/20 transition-all"
                />
              </div>
            </div>

            <div className="p-6 bg-(--color-surface) border border-(--color-border) rounded-2xl space-y-5">
              <h2 className="font-bold">Change Password</h2>
              <div>
                <label
                  htmlFor="profile-current-password"
                  className="block text-sm text-(--color-text-muted) mb-1.5"
                >
                  Current Password
                </label>
                <div className="relative">
                  <input
                    id="profile-current-password"
                    type={showCurrent ? "text" : "password"}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-4 py-3 pr-11 rounded-xl bg-(--color-surface-2) border border-(--color-border) text-(--color-text) placeholder-(--color-text-muted) text-sm focus:border-(--color-accent) focus:ring-2 focus:ring-(--color-accent)/20 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrent((s) => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-(--color-text-muted)"
                  >
                    {showCurrent ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
              <div>
                <label
                  htmlFor="profile-new-password"
                  className="block text-sm text-(--color-text-muted) mb-1.5"
                >
                  New Password
                </label>
                <div className="relative">
                  <input
                    id="profile-new-password"
                    type={showNew ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    minLength={8}
                    className="w-full px-4 py-3 pr-11 rounded-xl bg-(--color-surface-2) border border-(--color-border) text-(--color-text) placeholder-(--color-text-muted) text-sm focus:border-(--color-accent) focus:ring-2 focus:ring-(--color-accent)/20 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNew((s) => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-(--color-text-muted)"
                  >
                    {showNew ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            <button
              id="profile-save-btn"
              type="submit"
              disabled={saving}
              className="px-8 py-3 rounded-xl bg-(--color-accent) hover:bg-(--color-accent-hover) disabled:opacity-60 text-white font-semibold text-sm transition-all shadow-lg shadow-indigo-500/25"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </form>
        )}

        {/* Orders Tab */}
        {activeTab === "orders" && (
          <div className="space-y-4">
            {ordersLoading ? (
              Array.from({ length: 3 }, (_, i) => (
                <div
                  key={`skeleton-${i}`}
                  className="h-20 bg-(--color-surface) border border-(--color-border) rounded-2xl animate-pulse"
                />
              ))
            ) : orders.length === 0 ? (
              <div className="text-center py-16">
                <div className="text-6xl mb-4">📦</div>
                <h2 className="text-lg font-semibold text-(--color-text-muted)">
                  No orders yet
                </h2>
                <p className="text-sm text-(--color-text-muted) mt-2">
                  Your order history will appear here
                </p>
              </div>
            ) : (
              orders.map((order) => (
                <OrderCard
                  key={order.id}
                  order={order}
                  onCancel={handleCancelOrder}
                />
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
