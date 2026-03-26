export function decodeBase64Url(str: string): string {
  // Replace base64url characters with standard base64
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  
  // Add padding if missing
  const pad = base64.length % 4;
  if (pad) {
    if (pad === 1) {
      throw new Error('Invalid base64 string');
    }
    base64 += '='.repeat((4 - pad) % 4);
  }
  
  // Safe decoding for both Browser and Node environment
  const g = globalThis as any;
  if (typeof g.atob === 'function') {
    return g.atob(base64);
  }
  
  if (typeof g.Buffer !== 'undefined') {
    return g.Buffer.from(base64, 'base64').toString('binary');
  }
  
  throw new Error('No base64 decoding function found');
}

/**
 * Decodes a JWT payload without verifying the signature.
 */
export function decodeJwtPayload<T>(token: string): T {
  const parts = token.split('.');
  if (parts.length < 2) {
    throw new Error('Invalid JWT format');
  }
  
  const payload = parts[1];
  if (!payload) {
    throw new Error('Missing JWT payload');
  }

  try {
    return JSON.parse(decodeBase64Url(payload)) as T;
  } catch (e) {
    throw new Error('Failed to decode JWT payload: ' + (e instanceof Error ? e.message : String(e)));
  }
}
