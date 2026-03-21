import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the database and utilities
const mockDb = {
  select: vi.fn().mockReturnThis(),
  from: vi.fn().mockReturnThis(),
  where: vi.fn().mockReturnThis(),
  limit: vi.fn().mockResolvedValue([]),
  insert: vi.fn().mockReturnThis(),
  values: vi.fn().mockResolvedValue(undefined),
};

const mockHashPassword = vi.fn().mockResolvedValue('salt:hash');
const mockVerifyPassword = vi.fn().mockResolvedValue(true);
const mockGenerateId = vi.fn().mockReturnValue('test-uuid-123');

vi.mock('@assessment/db', () => ({
  createDb: () => mockDb,
  users: { id: 'id', email: 'email' },
}));

vi.mock('@assessment/utils', () => ({
  hashPassword: (...args: unknown[]) => mockHashPassword(...args),
  verifyPassword: (...args: unknown[]) => mockVerifyPassword(...args),
  generateId: () => mockGenerateId(),
  createSuccessResponse: (data: unknown) => ({ success: true, data }),
  createErrorResponse: (code: string, msg: string, details?: unknown) => ({
    success: false,
    error: { code, message: msg, details },
  }),
  ErrorCode: {
    VALIDATION_ERROR: 'VALIDATION_ERROR',
    EMAIL_ALREADY_EXISTS: 'EMAIL_ALREADY_EXISTS',
    INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  },
}));

describe('Auth Service - Registration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should validate registration input with Zod', async () => {
    // Import schema directly for unit testing
    const { registerSchema } = await import('../src/validators');

    const validInput = {
      name: 'John Doe',
      email: 'john@example.com',
      password: 'Password1',
    };

    const result = registerSchema.safeParse(validInput);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.email).toBe('john@example.com');
      expect(result.data.name).toBe('John Doe');
    }
  });

  it('should reject registration with invalid email', async () => {
    const { registerSchema } = await import('../src/validators');

    const invalidInput = {
      name: 'John Doe',
      email: 'not-an-email',
      password: 'Password1',
    };

    const result = registerSchema.safeParse(invalidInput);
    expect(result.success).toBe(false);
  });

  it('should reject registration with short password', async () => {
    const { registerSchema } = await import('../src/validators');

    const invalidInput = {
      name: 'John Doe',
      email: 'john@example.com',
      password: 'Ab1',
    };

    const result = registerSchema.safeParse(invalidInput);
    expect(result.success).toBe(false);
  });

  it('should reject registration without uppercase letter in password', async () => {
    const { registerSchema } = await import('../src/validators');

    const invalidInput = {
      name: 'John Doe',
      email: 'john@example.com',
      password: 'password1',
    };

    const result = registerSchema.safeParse(invalidInput);
    expect(result.success).toBe(false);
  });

  it('should reject registration without number in password', async () => {
    const { registerSchema } = await import('../src/validators');

    const invalidInput = {
      name: 'John Doe',
      email: 'john@example.com',
      password: 'Passwordd',
    };

    const result = registerSchema.safeParse(invalidInput);
    expect(result.success).toBe(false);
  });

  it('should reject registration with name too short', async () => {
    const { registerSchema } = await import('../src/validators');

    const invalidInput = {
      name: 'J',
      email: 'john@example.com',
      password: 'Password1',
    };

    const result = registerSchema.safeParse(invalidInput);
    expect(result.success).toBe(false);
  });

  it('should trim and lowercase email', async () => {
    const { registerSchema } = await import('../src/validators');

    const input = {
      name: 'John Doe',
      email: '  John@Example.COM  ',
      password: 'Password1',
    };

    const result = registerSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.email).toBe('john@example.com');
    }
  });

  it('should validate login input', async () => {
    const { loginSchema } = await import('../src/validators');

    const validInput = {
      email: 'john@example.com',
      password: 'anything',
    };

    const result = loginSchema.safeParse(validInput);
    expect(result.success).toBe(true);
  });

  it('should reject login with empty password', async () => {
    const { loginSchema } = await import('../src/validators');

    const invalidInput = {
      email: 'john@example.com',
      password: '',
    };

    const result = loginSchema.safeParse(invalidInput);
    expect(result.success).toBe(false);
  });
});
