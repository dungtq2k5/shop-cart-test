import { create } from 'zustand';
import api from '../lib/api';
import type { User, RegisterRequest, LoginRequest } from '../types';

interface AuthState {
  user: User | null;
  isAuth: boolean;
  isCheckingAuth: boolean;
  login: (data: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  setUser: (user: User | null) => void;
}

export const useAuthStore = create<AuthState>((set) => {
  // Listen for 401s emitted by the API interceptor
  if (typeof window !== 'undefined') {
    window.addEventListener('auth:unauthorized', () => {
      set({ user: null, isAuth: false });
    });
  }

  return {
    user: null,
    isAuth: false,
    isCheckingAuth: true,

    setUser: (user) => set({ user, isAuth: !!user }),

    checkAuth: async () => {
      set({ isCheckingAuth: true });
      try {
        const { data } = await api.get('/auth/check');
        set({ user: data.data, isAuth: true });
      } catch {
        set({ user: null, isAuth: false });
      } finally {
        set({ isCheckingAuth: false });
      }
    },

    login: async (credentials) => {
      const { data } = await api.post('/auth/login', credentials);
      set({ user: data.data, isAuth: true });
    },

    register: async (credentials) => {
      const { data } = await api.post('/auth/register', credentials);
      set({ user: data.data, isAuth: true });
    },

    logout: async () => {
      await api.post('/auth/logout');
      set({ user: null, isAuth: false });
    },
  };
});
