import { createMiddleware } from 'hono/factory';

import type { Env } from '../types';

const PUBLIC_RATE_LIMIT = 60; // requests per minute
const AUTH_RATE_LIMIT = 120; // requests per minute for authenticated users
const WINDOW_SIZE = 60; // seconds

interface RateLimitEntry {
  count: number;
  windowStart: number;
}

/**
 * KV-based sliding window rate limiter.
 * 60 req/min for public, 120 req/min for authenticated users.
 */
export const rateLimiter = createMiddleware<{ Bindings: Env }>(async (c, next) => {
  const authHeader = c.req.header('Authorization');
  const isAuthenticated = authHeader?.startsWith('Bearer ');

  // Use IP + auth status for key
  const clientIp = c.req.header('CF-Connecting-IP') ?? c.req.header('X-Forwarded-For') ?? 'unknown';
  const rateLimitKey = `rate_limit:${clientIp}:${isAuthenticated ? 'auth' : 'public'}`;
  const limit = isAuthenticated ? AUTH_RATE_LIMIT : PUBLIC_RATE_LIMIT;

  const now = Math.floor(Date.now() / 1000);

  try {
    const existing = await c.env.KV.get<RateLimitEntry>(rateLimitKey, 'json');

    let entry: RateLimitEntry;

    if (!existing || now - existing.windowStart >= WINDOW_SIZE) {
      // New window
      entry = { count: 1, windowStart: now };
    } else {
      // Same window
      entry = { count: existing.count + 1, windowStart: existing.windowStart };
    }

    if (entry.count > limit) {
      const retryAfter = WINDOW_SIZE - (now - entry.windowStart);
      c.header('Retry-After', retryAfter.toString());
      c.header('X-RateLimit-Limit', limit.toString());
      c.header('X-RateLimit-Remaining', '0');

      return c.json(
        {
          success: false,
          error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: 'Too many requests. Please try again later.',
          },
        },
        429,
      );
    }

    // Store updated count
    await c.env.KV.put(rateLimitKey, JSON.stringify(entry), {
      expirationTtl: WINDOW_SIZE,
    });

    // Set rate limit headers
    c.header('X-RateLimit-Limit', limit.toString());
    c.header('X-RateLimit-Remaining', (limit - entry.count).toString());
  } catch {
    // If KV fails, allow the request (fail open)
  }

  await next();
});

/**
 * Exported for isolated testing.
 */
export function checkRateLimit(
  existing: RateLimitEntry | null,
  limit: number,
  now: number,
): { allowed: boolean; entry: RateLimitEntry; remaining: number } {
  let entry: RateLimitEntry;

  if (!existing || now - existing.windowStart >= WINDOW_SIZE) {
    entry = { count: 1, windowStart: now };
  } else {
    entry = { count: existing.count + 1, windowStart: existing.windowStart };
  }

  const allowed = entry.count <= limit;
  const remaining = Math.max(0, limit - entry.count);

  return { allowed, entry, remaining };
}
