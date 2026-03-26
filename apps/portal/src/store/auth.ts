import type { User } from '@assessment/types';
import { create } from 'zustand';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  // Actions
  setAuth: (user: User, accessToken: string) => void;
  setAccessToken: (accessToken: string) => void;
  setLoading: (loading: boolean) => void;
  sessionChecked: boolean;
  setSessionChecked: (checked: boolean) => void;
  logout: () => void;
}

/**
 * Zustand auth store.
 * Access token is kept in memory only (not persisted) for security.
 */
export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  isAuthenticated: false,
  isLoading: true,

  setAuth: (user, accessToken) =>
    set({
      user,
      accessToken,
      isAuthenticated: true,
      isLoading: false,
      sessionChecked: true,
    }),

  setAccessToken: (accessToken) =>
    set({ accessToken }),

  setLoading: (isLoading) =>
    set({ isLoading }),

  sessionChecked: false,
  setSessionChecked: (sessionChecked) => set({ sessionChecked }),

  logout: () =>
    set({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      isLoading: false,
      sessionChecked: true,
    }),
}));
