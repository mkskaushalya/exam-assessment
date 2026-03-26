'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useCallback } from 'react';

import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth';

/**
 * Custom hook for authentication management.
 * Handles session check on mount and provides auth actions.
 */
export function useAuth() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading, sessionChecked, setAuth, setLoading, setSessionChecked, logout: storeLogout } = useAuthStore();
  const pathname = typeof window !== 'undefined' ? window.location.pathname : '';

  // Check session on mount by attempting token refresh
  useEffect(() => {
    // If we're already authenticated OR we've already checked the session, stop.
    if (isAuthenticated || sessionChecked) {
      setLoading(false);
      return;
    }

    // Don't auto-check session on login/register pages to avoid unnecessary 401s
    if (pathname === '/login' || pathname === '/register') {
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
          role: 'student' | 'admin';
        }
        const tokenParts = accessToken.split('.');
        if (tokenParts.length < 2) throw new Error('Invalid token format');
        
        const b64Payload = tokenParts[1];
        if (!b64Payload) throw new Error('Invalid token payload');
        const payload = JSON.parse(atob(b64Payload)) as TokenPayload;
        
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
