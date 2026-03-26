'use client';

import { decodeJwtPayload } from '@assessment/utils';
import { useRouter } from 'next/navigation';
import { useEffect, useCallback } from 'react';

import { api } from '@/lib/api';
import { useAdminAuthStore } from '@/store/auth';

/**
 * Custom hook for Admin authentication management.
 */
export function useAdminAuth() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading, sessionChecked, setAuth, setLoading, setSessionChecked, logout: storeLogout } = useAdminAuthStore();
  const pathname = typeof window !== 'undefined' ? window.location.pathname : '';

  // Check session on mount by attempting token refresh
  useEffect(() => {
    // If we're already authenticated OR we've already checked the session, stop.
    if (isAuthenticated || sessionChecked) {
      setLoading(false);
      return;
    }

    // Don't auto-check session on the login page to avoid redundant calls 
    // when we know we probably don't have a session.
    if (pathname === '/login') {
      setLoading(false);
      setSessionChecked(true);
      return;
    }

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
        const payload = decodeJwtPayload<TokenPayload>(accessToken);
        
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
        // If it's 401, it means no valid refresh token, so just stop loading
        setLoading(false);
      } finally {
        setSessionChecked(true);
      }
    };

    void checkSession();
  }, [setAuth, setLoading, setSessionChecked, isAuthenticated, sessionChecked, pathname]);

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
