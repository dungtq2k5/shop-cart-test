import { create } from 'zustand';
import api from '../lib/api';
import type { CartItem, AddToCartRequest } from '../types';

interface CartState {
  cartItems: CartItem[];
  subtotalCents: number;
  isLoading: boolean;
  fetchCart: () => Promise<void>;
  addToCart: (data: AddToCartRequest) => Promise<void>;
  updateQuantity: (cartItemId: string, quantity: number) => Promise<void>;
  removeFromCart: (cartItemId: string) => Promise<void>;
  clearCart: () => void;
}

function calcSubtotal(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + item.subtotalCents, 0);
}

// Debounce helper for quantity updates
let debounceTimer: ReturnType<typeof setTimeout> | null = null;

export const useCartStore = create<CartState>((set, get) => ({
  cartItems: [],
  subtotalCents: 0,
  isLoading: false,

  fetchCart: async () => {
    set({ isLoading: true });
    try {
      const { data } = await api.get('/cart');
      const items: CartItem[] = data.data;
      set({ cartItems: items, subtotalCents: calcSubtotal(items) });
    } finally {
      set({ isLoading: false });
    }
  },

  addToCart: async (payload) => {
    const { data } = await api.post('/cart', payload);
    const newItem: CartItem = data.data;
    set((state) => {
      const existing = state.cartItems.find((i) => i.id === newItem.id);
      const updatedItems = existing
        ? state.cartItems.map((i) => (i.id === newItem.id ? newItem : i))
        : [...state.cartItems, newItem];
      return { cartItems: updatedItems, subtotalCents: calcSubtotal(updatedItems) };
    });
  },

  updateQuantity: async (cartItemId, quantity) => {
    // Optimistic UI update first
    set((state) => {
      const updatedItems = state.cartItems.map((item) =>
        item.id === cartItemId
          ? { ...item, quantity, subtotalCents: item.product.priceCents * quantity }
          : item,
      );
      return { cartItems: updatedItems, subtotalCents: calcSubtotal(updatedItems) };
    });

    // Debounced API call
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(async () => {
      try {
        await api.put(`/cart/${cartItemId}`, { quantity });
      } catch {
        // Re-fetch on failure to restore server state
        get().fetchCart();
      }
    }, 500);
  },

  removeFromCart: async (cartItemId) => {
    await api.delete(`/cart/${cartItemId}`);
    set((state) => {
      const updatedItems = state.cartItems.filter((i) => i.id !== cartItemId);
      return { cartItems: updatedItems, subtotalCents: calcSubtotal(updatedItems) };
    });
  },

  clearCart: () => set({ cartItems: [], subtotalCents: 0 }),
}));
