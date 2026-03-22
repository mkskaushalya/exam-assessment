import { createMiddleware } from 'hono/factory';

import type { Env, Variables } from '../types';

interface JwtPayload {
  sub: string;
  role: string;
  iss: string;
  exp: number;
  iat: number;
}

/**
 * JWT Authentication middleware.
 * Verifies the access token from the Authorization header.
 */
export const jwtAuth = createMiddleware<{ Bindings: Env; Variables: Variables }>(
  async (c, next) => {
    const authHeader = c.req.header('Authorization');

    if (!authHeader?.startsWith('Bearer ')) {
      return c.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Missing or invalid Authorization header' } }, 401);
    }

    const token = authHeader.slice(7);

    try {
      const payload = await verifyJwt(token, c.env.JWT_SECRET);

      if (payload.exp < Math.floor(Date.now() / 1000)) {
        return c.json({ success: false, error: { code: 'TOKEN_EXPIRED', message: 'Access token has expired' } }, 401);
      }

      c.set('userId', payload.sub);
      c.set('userRole', payload.role);
      await next();
    } catch {
      return c.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Invalid access token' } }, 401);
    }
  },
);

/**
 * Admin authorization middleware.
 */
export const adminAuth = createMiddleware<{ Bindings: Env; Variables: Variables }>(
  async (c, next) => {
    const role = c.get('userRole');
    if (role !== 'admin') {
      return c.json({ success: false, error: { code: 'FORBIDDEN', message: 'Admin access required' } }, 403);
    }
    await next();
  },
);

/**
 * Sign a JWT using Web Crypto API (compatible with Cloudflare Workers).
 */
export async function signJwt(
  payload: Omit<JwtPayload, 'iat'>,
  secret: string,
): Promise<string> {
  const header = { alg: 'HS256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const fullPayload = { ...payload, iat: now };

  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(fullPayload));
  const signingInput = `${encodedHeader}.${encodedPayload}`;

  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );

  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(signingInput));
  const encodedSignature = base64UrlEncodeBuffer(signature);

  return `${signingInput}.${encodedSignature}`;
}

/**
 * Verify and decode a JWT.
 */
export async function verifyJwt(token: string, secret: string): Promise<JwtPayload> {
  const parts = token.split('.');
  if (parts.length !== 3) throw new Error('Invalid token format');

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

function base64UrlEncode(str: string): string {
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64UrlEncodeBuffer(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
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
