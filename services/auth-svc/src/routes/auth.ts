import { Hono } from 'hono';
import { getCookie, setCookie, deleteCookie } from 'hono/cookie';
import { eq } from 'drizzle-orm';
import { users } from '@assessment/db';
import { hashPassword, verifyPassword, generateId, createSuccessResponse, createErrorResponse, ErrorCode } from '@assessment/utils';

import type { Env, Variables } from '../types';
import { registerSchema, loginSchema } from '../validators';
import { signJwt } from '../middleware/jwt';
import { jwtAuth } from '../middleware/jwt';

export const authRoutes = new Hono<{ Bindings: Env; Variables: Variables }>();

/**
 * POST /auth/register
 * Register a new user account.
 */
authRoutes.post('/register', async (c) => {
  const body = await c.req.json();
  const parsed = registerSchema.safeParse(body);

  if (!parsed.success) {
    return c.json(
      createErrorResponse(ErrorCode.VALIDATION_ERROR, 'Validation failed', parsed.error.flatten()),
      400,
    );
  }

  const { name, email, password } = parsed.data;
  const db = c.get('db');

  // Check if email already exists
  const existing = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);

  if (existing.length > 0) {
    return c.json(createErrorResponse(ErrorCode.EMAIL_ALREADY_EXISTS, 'Email already registered'), 409);
  }

  const passwordHash = await hashPassword(password);
  const id = generateId();

  await db.insert(users).values({
    id,
    name,
    email,
    passwordHash,
    role: 'student',
  });

  return c.json(
    createSuccessResponse({
      user: { id, name, email, role: 'student' },
    }),
    201,
  );
});

/**
 * POST /auth/login
 * Authenticate user and issue JWT tokens.
 */
authRoutes.post('/login', async (c) => {
  const body = await c.req.json();
  const parsed = loginSchema.safeParse(body);

  if (!parsed.success) {
    return c.json(
      createErrorResponse(ErrorCode.VALIDATION_ERROR, 'Validation failed', parsed.error.flatten()),
      400,
    );
  }

  const { email, password } = parsed.data;
  const db = c.get('db');

  const userResults = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  const user = userResults[0];

  if (!user) {
    return c.json(createErrorResponse(ErrorCode.INVALID_CREDENTIALS, 'Invalid email or password'), 401);
  }

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) {
    return c.json(createErrorResponse(ErrorCode.INVALID_CREDENTIALS, 'Invalid email or password'), 401);
  }

  const accessTokenExpiry = parseInt(c.env.ACCESS_TOKEN_EXPIRY || '900', 10);
  const refreshTokenExpiry = parseInt(c.env.REFRESH_TOKEN_EXPIRY || '604800', 10);

  // Sign access token
  const accessToken = await signJwt(
    {
      sub: user.id,
      role: user.role,
      iss: c.env.JWT_ISSUER,
      exp: Math.floor(Date.now() / 1000) + accessTokenExpiry,
    },
    c.env.JWT_SECRET,
  );

  // Create refresh token and store in KV
  const refreshToken = generateId();
  await c.env.KV.put(`refresh:${refreshToken}`, user.id, {
    expirationTtl: refreshTokenExpiry,
  });

  const isProd = c.env.ENVIRONMENT === 'production';

  // Set refresh token as httpOnly cookie
  setCookie(c, 'refresh_token', refreshToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'Strict' : 'Lax',
    path: '/',
    maxAge: refreshTokenExpiry,
  });

  return c.json(
    createSuccessResponse({
      accessToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    }),
  );
});

/**
 * POST /auth/refresh
 * Rotate refresh token and issue new access token.
 */
authRoutes.post('/refresh', async (c) => {
  const refreshToken = getCookie(c, 'refresh_token');

  if (!refreshToken) {
    return c.json(createErrorResponse(ErrorCode.INVALID_REFRESH_TOKEN, 'No refresh token provided'), 401);
  }

  // Look up refresh token in KV
  const userId = await c.env.KV.get(`refresh:${refreshToken}`);
  if (!userId) {
    return c.json(createErrorResponse(ErrorCode.INVALID_REFRESH_TOKEN, 'Invalid or expired refresh token'), 401);
  }

  // Delete old token (rotation)
  await c.env.KV.delete(`refresh:${refreshToken}`);

  // Get user
  const db = c.get('db');
  const userResults = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  const user = userResults[0];

  if (!user) {
    return c.json(createErrorResponse(ErrorCode.NOT_FOUND, 'User not found'), 404);
  }

  const accessTokenExpiry = parseInt(c.env.ACCESS_TOKEN_EXPIRY || '900', 10);
  const refreshTokenExpiry = parseInt(c.env.REFRESH_TOKEN_EXPIRY || '604800', 10);

  // Issue new access token
  const accessToken = await signJwt(
    {
      sub: user.id,
      role: user.role,
      iss: c.env.JWT_ISSUER,
      exp: Math.floor(Date.now() / 1000) + accessTokenExpiry,
    },
    c.env.JWT_SECRET,
  );

  const isProd = c.env.ENVIRONMENT === 'production';

  // Issue new refresh token
  const newRefreshToken = generateId();
  await c.env.KV.put(`refresh:${newRefreshToken}`, user.id, {
    expirationTtl: refreshTokenExpiry,
  });

  setCookie(c, 'refresh_token', newRefreshToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'Strict' : 'Lax',
    path: '/',
    maxAge: refreshTokenExpiry,
  });

  return c.json(createSuccessResponse({ accessToken }));
});

/**
 * POST /auth/logout
 * Invalidate refresh token.
 */
authRoutes.post('/logout', jwtAuth, async (c) => {
  const refreshToken = c.req.header('Cookie')
    ?.split(';')
    .find((cookie) => cookie.trim().startsWith('refresh_token='))
    ?.split('=')[1]
    ?.trim();

  if (refreshToken) {
    await c.env.KV.delete(`refresh:${refreshToken}`);
  }

  deleteCookie(c, 'refresh_token', { path: '/' });

  return c.json(createSuccessResponse({ message: 'Logged out successfully' }));
});
