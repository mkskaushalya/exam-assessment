/**
 * Generate a cryptographically random ID.
 * Uses crypto.randomUUID() which is available in Cloudflare Workers and modern Node.js.
 */
export function generateId(): string {
  return crypto.randomUUID();
}
