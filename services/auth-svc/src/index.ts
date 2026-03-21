import { Hono } from 'hono';
import { cors } from 'hono/cors';

import type { Env, Variables } from './types';
import { authRoutes } from './routes/auth';
import { dbMiddleware } from './middleware/db';

const app = new Hono<{ Bindings: Env; Variables: Variables }>();

// Global middleware
app.use('*', cors());
app.use('*', dbMiddleware);

// Health check
app.get('/health', (c) => c.json({ status: 'ok', service: 'auth-svc' }));

// Routes
app.route('/auth', authRoutes);

export default app;
