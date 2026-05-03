import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { useLocation } from 'react-router-dom';
import { User, ShoppingBag, Eye, EyeOff, ChevronDown, ChevronUp, Package } from 'lucide-react';
import { useAuthStore } from '../stores/useAuthStore';
import { formatCurrency, formatDate, getStatusClasses } from '../utils';
import api from '../lib/api';
import type { Order } from '../types';
import toast from 'react-hot-toast';

type Tab = 'account' | 'orders';

function OrderCard({ order }: { order: Order }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl overflow-hidden">
      {/* Order Header */}
      <button
        id={`order-toggle-${order.id}`}
        onClick={() => setExpanded((e) => !e)}
        className="w-full flex items-center justify-between p-4 hover:bg-[var(--color-surface-2)] transition-colors"
      >
        <div className="flex items-center gap-4 text-left">
          <div className="w-10 h-10 rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-border)] flex items-center justify-center">
            <Package className="w-5 h-5 text-[var(--color-accent)]" />
          </div>
          <div>
            <p className="text-xs text-[var(--color-text-muted)]">Order #{order.id.slice(0, 8)}...</p>
            <p className="text-xs text-[var(--color-text-muted)] mt-0.5">{formatDate(order.createdAt)}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className={`text-xs px-2 py-1 rounded-full font-medium ${getStatusClasses(order.status)}`}>
            {order.status}
          </span>
          <span className="font-bold text-sm text-[var(--color-accent-light)]">
            {formatCurrency(order.totalAmountCents)}
          </span>
          {expanded ? (
            <ChevronUp className="w-4 h-4 text-[var(--color-text-muted)]" />
          ) : (
            <ChevronDown className="w-4 h-4 text-[var(--color-text-muted)]" />
          )}
        </div>
      </button>

      {/* Order Details */}
      {expanded && (
        <div className="border-t border-[var(--color-border)] p-4 space-y-4">
          {/* Items */}
          <div className="space-y-2">
            {order.items.map((item) => (
              <div key={item.id} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[var(--color-surface-2)] flex items-center justify-center text-sm">
                  🛍️
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{item.product.name}</p>
                  <p className="text-xs text-[var(--color-text-muted)]">
                    {formatCurrency(item.unitPriceCents)} × {item.quantity}
                  </p>
                </div>
                <span className="text-sm font-bold text-[var(--color-accent-light)]">
                  {formatCurrency(item.lineTotalCents)}
                </span>
              </div>
            ))}
          </div>

          {/* Financial summary */}
          <div className="rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-border)] p-3 space-y-2">
            {order.couponCode && (
              <div className="flex justify-between text-sm text-emerald-400">
                <span>Coupon ({order.couponCode})</span>
                <span>−{formatCurrency(order.discountAmountCents)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-sm">
              <span>Total Paid</span>
              <span className="gradient-text">{formatCurrency(order.totalAmountCents)}</span>
            </div>
          </div>

          {/* Address */}
          <div className="text-xs text-[var(--color-text-muted)]">
            <span className="font-medium text-[var(--color-text)]">Delivery: </span>
            {order.deliveryAddress}
          </div>
        </div>
      )}
    </div>
  );
}

export default function ProfilePage() {
  const { user, setUser } = useAuthStore();
  const location = useLocation();
  const defaultTab: Tab = (location.state as any)?.tab === 'orders' ? 'orders' : 'account';
  const [activeTab, setActiveTab] = useState<Tab>(defaultTab);
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);

  // Account settings state
  const [email, setEmail] = useState(user?.email || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (activeTab === 'orders') fetchOrders();
  }, [activeTab]);

  const fetchOrders = async () => {
    setOrdersLoading(true);
    try {
      const { data } = await api.get('/orders/me');
      setOrders(data.data);
    } catch {
      toast.error('Failed to load orders');
    } finally {
      setOrdersLoading(false);
    }
  };

  const handleSaveProfile = async (e: FormEvent) => {
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
        toast('No changes to save', { icon: 'ℹ️' });
        return;
      }
      const { data } = await api.put('/users/me', payload);
      setUser(data.data);
      toast.success('Profile updated successfully');
      setCurrentPassword('');
      setNewPassword('');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const tabClass = (tab: Tab) =>
    `flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${
      activeTab === tab
        ? 'bg-[var(--color-accent)] text-white shadow-lg shadow-indigo-500/20'
        : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-2)]'
    }`;

  return (
    <div className="min-h-screen pt-24 pb-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Profile header */}
        <div className="flex items-center gap-4 mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-indigo-500/30">
            {user?.email[0].toUpperCase()}
          </div>
          <div>
            <h1 className="text-2xl font-bold">{user?.email}</h1>
            <p className="text-sm text-[var(--color-text-muted)]">
              Member since {user?.createdAt ? formatDate(user.createdAt) : '—'}
            </p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 mb-6 p-1 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl w-fit">
          <button id="tab-account" onClick={() => setActiveTab('account')} className={tabClass('account')}>
            <User className="w-4 h-4" />
            Account Settings
          </button>
          <button id="tab-orders" onClick={() => setActiveTab('orders')} className={tabClass('orders')}>
            <ShoppingBag className="w-4 h-4" />
            Order History
          </button>
        </div>

        {/* Account Settings Tab */}
        {activeTab === 'account' && (
          <form id="profile-form" onSubmit={handleSaveProfile} className="space-y-6">
            <div className="p-6 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl space-y-5">
              <h2 className="font-bold flex items-center gap-2">
                <User className="w-4 h-4 text-[var(--color-accent)]" />
                Account Details
              </h2>
              <div>
                <label htmlFor="profile-email" className="block text-sm text-[var(--color-text-muted)] mb-1.5">
                  Email Address
                </label>
                <input
                  id="profile-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-border)] text-[var(--color-text)] text-sm focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent)]/20 transition-all"
                />
              </div>
            </div>

            <div className="p-6 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl space-y-5">
              <h2 className="font-bold">Change Password</h2>
              <div>
                <label htmlFor="profile-current-password" className="block text-sm text-[var(--color-text-muted)] mb-1.5">
                  Current Password
                </label>
                <div className="relative">
                  <input
                    id="profile-current-password"
                    type={showCurrent ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-4 py-3 pr-11 rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-border)] text-[var(--color-text)] placeholder-[var(--color-text-muted)] text-sm focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent)]/20 transition-all"
                  />
                  <button type="button" onClick={() => setShowCurrent((s) => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]">
                    {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label htmlFor="profile-new-password" className="block text-sm text-[var(--color-text-muted)] mb-1.5">
                  New Password
                </label>
                <div className="relative">
                  <input
                    id="profile-new-password"
                    type={showNew ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    minLength={8}
                    className="w-full px-4 py-3 pr-11 rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-border)] text-[var(--color-text)] placeholder-[var(--color-text-muted)] text-sm focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent)]/20 transition-all"
                  />
                  <button type="button" onClick={() => setShowNew((s) => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]">
                    {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            <button
              id="profile-save-btn"
              type="submit"
              disabled={saving}
              className="px-8 py-3 rounded-xl bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] disabled:opacity-60 text-white font-semibold text-sm transition-all shadow-lg shadow-indigo-500/25"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        )}

        {/* Orders Tab */}
        {activeTab === 'orders' && (
          <div className="space-y-4">
            {ordersLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-20 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl animate-pulse" />
              ))
            ) : orders.length === 0 ? (
              <div className="text-center py-16">
                <div className="text-6xl mb-4">📦</div>
                <h2 className="text-lg font-semibold text-[var(--color-text-muted)]">No orders yet</h2>
                <p className="text-sm text-[var(--color-text-muted)] mt-2">Your order history will appear here</p>
              </div>
            ) : (
              orders.map((order) => <OrderCard key={order.id} order={order} />)
            )}
          </div>
        )}
      </div>
    </div>
  );
}
