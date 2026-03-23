'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useCallback } from 'react';

import { api } from '@/lib/api';
import { useAdminAuthStore } from '@/store/auth';

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
        const response = await api.post<{ success: boolean; data: { accessToken: string } }>('/auth/refresh');
        const { accessToken } = response.data.data;

        // Decode user from token payload (base64)
        interface TokenPayload {
          sub: string;
          name?: string;
          email?: string;
          role: string;
        }
        const tokenParts = accessToken.split('.');
        const b64Payload = tokenParts[1];
        if (!b64Payload) throw new Error('Invalid token');
        const payload = JSON.parse(atob(b64Payload)) as TokenPayload;
        
        // Verify admin role
        if (payload.role !== 'admin') {
          throw new Error('Unauthorized role');
        }

        setAuth(
          {
            id: payload.sub,
            name: payload.name ?? '',
            email: payload.email ?? '',
            role: payload.role as 'student' | 'admin',
            createdAt: new Date(),
          },
          accessToken,
        );
      } catch {
        setLoading(false);
      }
    };

    void checkSession();
  }, [setAuth, setLoading]);

  const login = useCallback(
    async (email: string, password: string) => {
      interface LoginResponse {
        success: boolean;
        data: {
          accessToken: string;
          user: {
            id: string;
            name: string;
            email: string;
            role: 'student' | 'admin';
            createdAt: Date;
          };
        };
      }
      const response = await api.post<LoginResponse>('/auth/login', { email, password });
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
