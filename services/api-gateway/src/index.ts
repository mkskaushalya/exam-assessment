import { Hono } from 'hono';
import { cors } from 'hono/cors';

import type { Env } from './types';
import { rateLimiter } from './middleware/rate-limiter';
import { requestId } from './middleware/request-id';
import { errorHandler } from './middleware/error-handler';

const app = new Hono<{ Bindings: Env }>();

// ─── Global Middleware ───────────────────────────────────────────────────────

// Request ID
app.use('*', requestId);

// Error handler
app.onError(errorHandler);

// CORS — environment aware
app.use(
  '*',
  cors({
    origin: (origin, c) => {
      const env = c.env.ENVIRONMENT;
      const allowedOrigins =
        env === 'production'
          ? ['https://portal.assessment.dev', 'https://admin.assessment.dev']
          : ['http://localhost:3000', 'http://localhost:3001'];
      return allowedOrigins.includes(origin) ? origin : '';
    },
    allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization', 'X-Request-Id'],
    exposeHeaders: ['X-Request-Id'],
    credentials: true,
    maxAge: 86400,
  }),
);

// Rate limiting
app.use('*', rateLimiter);

// ─── Health Check ────────────────────────────────────────────────────────────

app.get('/health', (c) =>
  c.json({
    status: 'ok',
    service: 'api-gateway',
    timestamp: new Date().toISOString(),
  }),
);

// ─── Route Forwarding via Service Bindings ───────────────────────────────────

app.all('/api/auth/*', async (c) => {
  const url = new URL(c.req.url);
  const path = url.pathname.replace('/api/auth', '/auth');
  const targetUrl = new URL(path + url.search, 'https://auth-svc.internal');

  const response = await c.env.AUTH_SVC.fetch(
    new Request(targetUrl.toString(), {
      method: c.req.method,
      headers: c.req.raw.headers,
      body: c.req.method !== 'GET' ? c.req.raw.body : undefined,
    }),
  );

  return new Response(response.body, {
    status: response.status,
    headers: response.headers,
  });
});

app.all('/api/papers/*', async (c) => {
  const url = new URL(c.req.url);
  const path = url.pathname.replace('/api/papers', '/papers');
  const targetUrl = new URL(path + url.search, 'https://papers-svc.internal');

  const response = await c.env.PAPERS_SVC.fetch(
    new Request(targetUrl.toString(), {
      method: c.req.method,
      headers: c.req.raw.headers,
      body: c.req.method !== 'GET' ? c.req.raw.body : undefined,
    }),
  );

  return new Response(response.body, {
    status: response.status,
    headers: response.headers,
  });
});

app.all('/api/exam/*', async (c) => {
  const url = new URL(c.req.url);
  const path = url.pathname.replace('/api/exam', '/exam');
  const targetUrl = new URL(path + url.search, 'https://papers-svc.internal');

  const response = await c.env.PAPERS_SVC.fetch(
    new Request(targetUrl.toString(), {
      method: c.req.method,
      headers: c.req.raw.headers,
      body: c.req.method !== 'GET' ? c.req.raw.body : undefined,
    }),
  );

  return new Response(response.body, {
    status: response.status,
    headers: response.headers,
  });
});

// ─── 404 ─────────────────────────────────────────────────────────────────────

app.notFound((c) =>
  c.json(
    {
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: `Route ${c.req.method} ${c.req.path} not found`,
      },
    },
    404,
  ),
);

export default app;
