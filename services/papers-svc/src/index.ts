import { Hono } from 'hono';
import { cors } from 'hono/cors';

import type { Env, Variables } from './types';
import { paperRoutes } from './routes/papers';
import { examRoutes } from './routes/exams';
import { dbMiddleware } from './middleware/db';

const app = new Hono<{ Bindings: Env; Variables: Variables }>();

// Global middleware
app.use('*', cors());
app.use('*', dbMiddleware);

// Health check
app.get('/health', (c) => c.json({ status: 'ok', service: 'papers-svc' }));

// Routes
app.route('/papers', paperRoutes);
app.route('/exam', examRoutes);

export default app;
