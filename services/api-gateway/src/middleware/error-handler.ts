import type { Context } from 'hono';

import type { Env } from '../types';

/**
 * Centralized error handler with unique Request IDs.
 */
export const errorHandler = (err: Error, c: Context<{ Bindings: Env }>) => {
  const requestId = c.res.headers.get('X-Request-Id') ?? 'unknown';

  console.error(`[${requestId}] Unhandled error:`, err.message, err.stack);

  return c.json(
    {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
        requestId,
      },
    },
    500,
  );
};
