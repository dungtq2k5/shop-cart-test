import { create } from "zustand";
import api from "../lib/api";
import type { CartItem, AddToCartRequest } from "../types";
import { ENDPOINTS, CART_DEBOUNCE_MS } from "../config/constants";
import {
  calculateCartTotal,
  calculateLineSubtotal,
} from "../utils/cartValidation";

type CartState = {
  cartItems: CartItem[];
  subtotalCents: number;
  isLoading: boolean;
  fetchCart: () => Promise<void>;
  addToCart: (data: AddToCartRequest) => Promise<void>;
  updateQuantity: (cartItemId: string, quantity: number) => Promise<void>;
  removeFromCart: (cartItemId: string) => Promise<void>;
  clearCart: () => void;
};

function calcSubtotal(items: CartItem[]): number {
  return calculateCartTotal(
    items.map((item) => ({
      priceCents: item.product.priceCents,
      quantity: item.quantity,
    })),
  );
}

// Debounce helper for quantity updates
let debounceTimer: ReturnType<typeof setTimeout> | null = null;

export const useCartStore = create<CartState>((set, get) => ({
  cartItems: [],
  subtotalCents: 0,
  isLoading: false,

  fetchCart: async (): Promise<void> => {
    set({ isLoading: true });
    try {
      const { data } = await api.get(ENDPOINTS.CART);
      const items: CartItem[] = data.data;
      set({ cartItems: items, subtotalCents: calcSubtotal(items) });
    } finally {
      set({ isLoading: false });
    }
  },

  addToCart: async (payload: AddToCartRequest): Promise<void> => {
    const { data } = await api.post(ENDPOINTS.CART, payload);
    const newItem: CartItem = data.data;
    set((state) => {
      const existing = state.cartItems.find((i) => i.id === newItem.id);
      const updatedItems = existing
        ? state.cartItems.map((i) => (i.id === newItem.id ? newItem : i))
        : [...state.cartItems, newItem];
      return {
        cartItems: updatedItems,
        subtotalCents: calcSubtotal(updatedItems),
      };
    });
  },

  updateQuantity: async (
    cartItemId: string,
    quantity: number,
  ): Promise<void> => {
    // Optimistic UI update first
    set((state) => {
      const updatedItems = state.cartItems.map((item) =>
        item.id === cartItemId
          ? {
              ...item,
              quantity,
              subtotalCents: calculateLineSubtotal(
                item.product.priceCents,
                quantity,
              ),
            }
          : item,
      );
      return {
        cartItems: updatedItems,
        subtotalCents: calcSubtotal(updatedItems),
      };
    });

    // Debounced API call
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(async () => {
      try {
        await api.patch(`${ENDPOINTS.CART}/${cartItemId}`, { quantity });
      } catch {
        // Re-fetch on failure to restore server state
        get().fetchCart();
      }
    }, CART_DEBOUNCE_MS);
  },

  removeFromCart: async (cartItemId: string): Promise<void> => {
    await api.delete(`${ENDPOINTS.CART}/${cartItemId}`);
    set((state) => {
      const updatedItems = state.cartItems.filter((i) => i.id !== cartItemId);
      return {
        cartItems: updatedItems,
        subtotalCents: calcSubtotal(updatedItems),
      };
    });
  },

  clearCart: (): void => set({ cartItems: [], subtotalCents: 0 }),
}));
