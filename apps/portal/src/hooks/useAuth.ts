'use client';

import { useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

import { useAuthStore } from '@/store/auth';
import { api } from '@/lib/api';

/**
 * Custom hook for authentication management.
 * Handles session check on mount and provides auth actions.
 */
export function useAuth() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading, setAuth, setLoading, logout: storeLogout } = useAuthStore();

  // Check session on mount by attempting token refresh
  useEffect(() => {
    const checkSession = async () => {
      try {
        const response = await api.post('/auth/refresh');
        const { accessToken } = response.data.data;

        // Decode user from token payload (base64)
        const payload = JSON.parse(atob(accessToken.split('.')[1]));
        setAuth(
          {
            id: payload.sub,
            name: payload.name ?? '',
            email: payload.email ?? '',
            role: payload.role,
            createdAt: new Date(),
          },
          accessToken,
        );
      } catch {
        setLoading(false);
      }
    };

    checkSession();
  }, [setAuth, setLoading]);

  const login = useCallback(
    async (email: string, password: string) => {
      const response = await api.post('/auth/login', { email, password });
      const { accessToken, user: userData } = response.data.data;
      setAuth(userData, accessToken);
      router.push('/papers');
    },
    [setAuth, router],
  );

  const register = useCallback(
    async (name: string, email: string, password: string) => {
      await api.post('/auth/register', { name, email, password });
      // Auto login after register
      await login(email, password);
    },
    [login],
  );

  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // Proceed with local logout even if API fails
    }
    storeLogout();
    router.push('/login');
  }, [storeLogout, router]);

  return {
    user,
    isAuthenticated,
    isLoading,
    login,
    register,
    logout,
  };
}
