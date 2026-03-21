import { createMiddleware } from 'hono/factory';
import { createDb } from '@assessment/db';

import type { Env, Variables } from '../types';

/**
 * Middleware to initialize database connection from environment.
 */
export const dbMiddleware = createMiddleware<{ Bindings: Env; Variables: Variables }>(
  async (c, next) => {
    const db = createDb(c.env.DATABASE_URL);
    c.set('db', db);
    await next();
  },
);
