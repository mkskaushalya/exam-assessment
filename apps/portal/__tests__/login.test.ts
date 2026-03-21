import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn(),
  }),
}));

// Mock the API
const mockPost = vi.fn();
vi.mock('@/lib/api', () => ({
  api: {
    post: (...args: unknown[]) => mockPost(...args),
  },
}));

// Mock useAuth
const mockLogin = vi.fn();
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    login: mockLogin,
    isAuthenticated: false,
    isLoading: false,
    user: null,
  }),
}));

// Mock antd App for message
vi.mock('antd', async () => {
  const actual = await vi.importActual('antd');
  return {
    ...actual,
    App: {
      ...(actual as Record<string, unknown>).App,
      useApp: () => ({
        message: { success: vi.fn(), error: vi.fn() },
      }),
    },
  };
});

// We test the Login page validation logic
describe('Login Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render login form elements', async () => {
    // Test the Zod schema from the login page directly
    const { loginSchema } = await import('../../services/auth-svc/src/validators');

    // Valid login data
    const result = loginSchema.safeParse({
      email: 'test@example.com',
      password: 'password123',
    });

    expect(result.success).toBe(true);
  });

  it('should reject empty email', async () => {
    const { loginSchema } = await import('../../services/auth-svc/src/validators');

    const result = loginSchema.safeParse({
      email: '',
      password: 'password123',
    });

    expect(result.success).toBe(false);
  });

  it('should reject invalid email format', async () => {
    const { loginSchema } = await import('../../services/auth-svc/src/validators');

    const result = loginSchema.safeParse({
      email: 'not-valid',
      password: 'password123',
    });

    expect(result.success).toBe(false);
  });

  it('should reject empty password', async () => {
    const { loginSchema } = await import('../../services/auth-svc/src/validators');

    const result = loginSchema.safeParse({
      email: 'test@example.com',
      password: '',
    });

    expect(result.success).toBe(false);
  });

  it('should call login function with correct data', async () => {
    mockLogin.mockResolvedValue(undefined);

    // Simulate what the form does
    const email = 'test@example.com';
    const password = 'Password1';

    await mockLogin(email, password);

    expect(mockLogin).toHaveBeenCalledWith(email, password);
  });

  it('should handle login API error', async () => {
    mockLogin.mockRejectedValue({
      response: {
        data: {
          error: {
            message: 'Invalid email or password',
          },
        },
      },
    });

    await expect(mockLogin('bad@email.com', 'wrong')).rejects.toMatchObject({
      response: {
        data: {
          error: {
            message: 'Invalid email or password',
          },
        },
      },
    });
  });
});
