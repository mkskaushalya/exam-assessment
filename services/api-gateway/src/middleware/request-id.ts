import { createMiddleware } from 'hono/factory';

import type { Env } from '../types';

/**
 * Attach a unique X-Request-Id header to every request/response.
 */
export const requestId = createMiddleware<{ Bindings: Env }>(async (c, next) => {
  const id = c.req.header('X-Request-Id') ?? crypto.randomUUID();
  c.header('X-Request-Id', id);

  await next();
});
