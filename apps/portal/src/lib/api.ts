import axios from 'axios';

import { useAuthStore } from '@/store/auth';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8787/api';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

// ─── Request Interceptor: Attach access token ────────────────────────────────

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  // Ensure /api prefix is handled correctly across local and production environments
  if (config.url?.startsWith('/')) {
    const hasApiInBase = config.baseURL?.endsWith('/api') || config.baseURL?.endsWith('/api/');
    if (hasApiInBase) {
      // If baseURL has /api, strip leading slash from url to append correctly
      config.url = config.url.substring(1);
    } else if (!config.url.startsWith('/api')) {
      // If baseURL lacks /api and url lacks /api, prepend it
      config.url = `/api${config.url}`;
    }
  }

  return config;
});

// ─── Response Interceptor: Handle 401 and token refresh ──────────────────────

let isRefreshing = false;
let failedQueue: { resolve: (value: string | null) => void; reject: (error: unknown) => void }[] = [];

function processQueue(error: unknown, token: string | null = null) {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else {
      resolve(token);
    }
  });
  failedQueue = [];
}

api.interceptors.response.use(
  (response) => response,
  async (error: { config: any; response?: { status: number } }) => {
    const originalRequest = error.config as { _retry?: boolean; headers: Record<string, string> };

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise<string | null>((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token ?? ''}`;
          return api(originalRequest as any);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const response = await api.post<{ success: boolean; data: { accessToken: string } }>('/auth/refresh');
        const { accessToken } = response.data.data;
        useAuthStore.getState().setAccessToken(accessToken);
        processQueue(null, accessToken);

        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest as any);
      } catch (refreshError: unknown) {
        processQueue(refreshError, null);
        useAuthStore.getState().logout();
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
        return Promise.reject(refreshError instanceof Error ? refreshError : new Error('Token refresh failed'));
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error instanceof Error ? error : new Error('An unexpected error occurred'));
  },
);
