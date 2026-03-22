import { Hono } from 'hono';

import type { Env, Variables } from './types';
import { authRoutes } from './routes/auth';
import { userRoutes } from './routes/users';
import { dbMiddleware } from './middleware/db';

const app = new Hono<{ Bindings: Env; Variables: Variables }>();

// Global middleware
app.use('*', dbMiddleware);

app.onError((err, c) => {
  console.error('[auth-svc Error]', err);
  return c.json({ error: err.message, stack: err.stack }, 500);
});

// Health check
app.get('/health', (c) => c.json({ status: 'ok', service: 'auth-svc' }));

// Routes
app.route('/auth', authRoutes);
app.route('/users', userRoutes);

export default app;
