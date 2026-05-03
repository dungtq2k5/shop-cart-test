import { create } from "zustand";
import api from "../lib/api";
import type { User, RegisterRequest, LoginRequest } from "../types";
import { ENDPOINTS, AUTH_UNAUTHORIZED_EVENT } from "../config/constants";

type AuthState = {
  user: User | null;
  isAuth: boolean;
  isCheckingAuth: boolean;
  login: (data: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  setUser: (user: User | null) => void;
};

export const useAuthStore = create<AuthState>((set) => {
  // Listen for 401s emitted by the API interceptor
  if (globalThis.window) {
    globalThis.window.addEventListener(AUTH_UNAUTHORIZED_EVENT, () => {
      set({ user: null, isAuth: false });
    });
  }

  return {
    user: null,
    isAuth: false,
    isCheckingAuth: true,

    setUser: (user): void => set({ user, isAuth: !!user }),

    checkAuth: async (): Promise<void> => {
      set({ isCheckingAuth: true });
      try {
        const { data } = await api.get(ENDPOINTS.AUTH_CHECK);
        set({ user: data.data, isAuth: true });
      } catch {
        set({ user: null, isAuth: false });
      } finally {
        set({ isCheckingAuth: false });
      }
    },

    login: async (credentials): Promise<void> => {
      const { data } = await api.post(ENDPOINTS.AUTH_LOGIN, credentials);
      set({ user: data.data, isAuth: true });
    },

    register: async (credentials): Promise<void> => {
      const { data } = await api.post(ENDPOINTS.AUTH_REGISTER, credentials);
      set({ user: data.data, isAuth: true });
    },

    logout: async (): Promise<void> => {
      await api.post(ENDPOINTS.AUTH_LOGOUT);
      set({ user: null, isAuth: false });
    },
  };
});
