'use client';

import { useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

import { useAdminAuthStore } from '@/store/auth';
import { api } from '@/lib/api';

/**
 * Custom hook for Admin authentication management.
 */
export function useAdminAuth() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading, setAuth, setLoading, logout: storeLogout } = useAdminAuthStore();

  // Check session on mount by attempting token refresh
  useEffect(() => {
    const checkSession = async () => {
      try {
        const response = await api.post('/auth/refresh');
        const { accessToken } = response.data.data;

        // Decode user from token payload (base64)
        const payload = JSON.parse(atob(accessToken.split('.')[1]));
        
        // Verify admin role
        if (payload.role !== 'admin') {
          throw new Error('Unauthorized role');
        }

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
      
      if (userData.role !== 'admin') {
        throw new Error('Access denied. Administrator privileges required.');
      }

      setAuth(userData, accessToken);
      router.push('/');
    },
    [setAuth, router],
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
    logout,
  };
}
