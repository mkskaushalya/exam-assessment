import { createMiddleware } from 'hono/factory';

import type { Env, Variables } from '../types';

interface JwtPayload {
  sub: string;
  role: string;
  exp: number;
}

/**
 * JWT Authentication middleware for papers service.
 */
export const jwtAuth = createMiddleware<{ Bindings: Env; Variables: Variables }>(
  async (c, next) => {
    const authHeader = c.req.header('Authorization');

    if (!authHeader?.startsWith('Bearer ')) {
      return c.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Missing authorization' } }, 401);
    }

    const token = authHeader.slice(7);

    try {
      const payload = await verifyJwt(token, c.env.JWT_SECRET);
      if (payload.exp < Math.floor(Date.now() / 1000)) {
        return c.json({ success: false, error: { code: 'TOKEN_EXPIRED', message: 'Token expired' } }, 401);
      }

      c.set('userId', payload.sub);
      c.set('userRole', payload.role);
      await next();
    } catch {
      return c.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Invalid token' } }, 401);
    }
  },
);

/**
 * Optional auth — sets user info if token present, but doesn't block.
 */
export const optionalAuth = createMiddleware<{ Bindings: Env; Variables: Variables }>(
  async (c, next) => {
    const authHeader = c.req.header('Authorization');

    if (authHeader?.startsWith('Bearer ')) {
      try {
        const payload = await verifyJwt(authHeader.slice(7), c.env.JWT_SECRET);
        if (payload.exp >= Math.floor(Date.now() / 1000)) {
          c.set('userId', payload.sub);
          c.set('userRole', payload.role);
        }
      } catch {
        // Ignore invalid tokens for optional auth
      }
    }

    await next();
  },
);

async function verifyJwt(token: string, secret: string): Promise<JwtPayload> {
  const parts = token.split('.');
  if (parts.length !== 3) throw new Error('Invalid token');

  const [encodedHeader, encodedPayload, encodedSignature] = parts as [string, string, string];
  const signingInput = `${encodedHeader}.${encodedPayload}`;

  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['verify'],
  );

  const signatureBuffer = base64UrlDecodeBuffer(encodedSignature);
  const valid = await crypto.subtle.verify(
    'HMAC',
    key,
    signatureBuffer,
    new TextEncoder().encode(signingInput),
  );

  if (!valid) throw new Error('Invalid signature');

  return JSON.parse(atob(encodedPayload.replace(/-/g, '+').replace(/_/g, '/'))) as JwtPayload;
}

function base64UrlDecodeBuffer(str: string): ArrayBuffer {
  const base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}
