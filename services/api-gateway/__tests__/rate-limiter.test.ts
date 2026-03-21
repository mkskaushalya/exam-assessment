import { describe, it, expect } from 'vitest';

import { checkRateLimit } from '../src/middleware/rate-limiter';

describe('Rate Limiter (Isolated Logic)', () => {
  const PUBLIC_LIMIT = 60;
  const AUTH_LIMIT = 120;

  it('should allow first request in a new window', () => {
    const now = 1000;
    const result = checkRateLimit(null, PUBLIC_LIMIT, now);

    expect(result.allowed).toBe(true);
    expect(result.entry.count).toBe(1);
    expect(result.entry.windowStart).toBe(now);
    expect(result.remaining).toBe(59);
  });

  it('should allow requests within limit', () => {
    const now = 1000;
    const existing = { count: 30, windowStart: now };

    const result = checkRateLimit(existing, PUBLIC_LIMIT, now);
    expect(result.allowed).toBe(true);
    expect(result.entry.count).toBe(31);
    expect(result.remaining).toBe(29);
  });

  it('should deny requests exceeding public limit (60 req/min)', () => {
    const now = 1000;
    const existing = { count: 60, windowStart: now };

    const result = checkRateLimit(existing, PUBLIC_LIMIT, now);
    expect(result.allowed).toBe(false);
    expect(result.entry.count).toBe(61);
    expect(result.remaining).toBe(0);
  });

  it('should deny requests exceeding auth limit (120 req/min)', () => {
    const now = 1000;
    const existing = { count: 120, windowStart: now };

    const result = checkRateLimit(existing, AUTH_LIMIT, now);
    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it('should reset window after expiry (60 seconds)', () => {
    const oldWindowStart = 1000;
    const now = oldWindowStart + 61; // 61 seconds later
    const existing = { count: 100, windowStart: oldWindowStart };

    const result = checkRateLimit(existing, PUBLIC_LIMIT, now);
    expect(result.allowed).toBe(true);
    expect(result.entry.count).toBe(1); // Reset
    expect(result.entry.windowStart).toBe(now);
    expect(result.remaining).toBe(59);
  });

  it('should allow up to the exact limit', () => {
    const now = 1000;
    const existing = { count: 59, windowStart: now };

    const result = checkRateLimit(existing, PUBLIC_LIMIT, now);
    expect(result.allowed).toBe(true);
    expect(result.entry.count).toBe(60);
    expect(result.remaining).toBe(0);
  });

  it('should handle authenticated users with higher limit', () => {
    const now = 1000;
    const existing = { count: 100, windowStart: now };

    // Should still be allowed under auth limit (120)
    const result = checkRateLimit(existing, AUTH_LIMIT, now);
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(19);
  });
});
