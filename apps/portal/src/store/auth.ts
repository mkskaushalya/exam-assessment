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
    }),

  setAccessToken: (accessToken) =>
    set({ accessToken }),

  setLoading: (isLoading) =>
    set({ isLoading }),

  logout: () =>
    set({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      isLoading: false,
    }),
}));
