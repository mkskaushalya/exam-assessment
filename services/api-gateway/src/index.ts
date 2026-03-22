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

// CORS
app.use(
  '*',
  cors({
    origin: (origin, c) => {
      if (c.env.ENVIRONMENT === 'production') {
        return ['https://portal.assessment.dev', 'https://admin.assessment.dev'].includes(origin) ? origin : null;
      }
      // In development, allow any origin
      return origin || 'http://localhost:3000';
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

// ─── Route Forwarding ────────────────────────────────────────────────────────

/**
 * Proxy a request to a downstream service via HTTP fetch.
 * In production, use Service Bindings instead for zero-latency routing.
 */
async function proxyRequest(
  c: { req: { method: string; url: string; raw: Request }; env: Env },
  prefixFrom: string,
  prefixTo: string,
  serviceUrl: string,
): Promise<Response> {
  const url = new URL(c.req.url);
  const path = url.pathname.replace(prefixFrom, prefixTo);
  const targetUrl = `${serviceUrl}${path}${url.search}`;

  const headers = new Headers(c.req.raw.headers);
  // Remove host and transfer-related headers so fetch generates them correctly 
  // for the fully buffered string we are passing.
  headers.delete('host');
  headers.delete('content-length');
  headers.delete('transfer-encoding');
  headers.delete('content-encoding');

  // Read body into memory to avoid stream truncation issues in local dev
  let proxyBody: string | ArrayBuffer | undefined = undefined;
  if (c.req.method !== 'GET' && c.req.method !== 'HEAD') {
    const contentType = c.req.raw.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const jsonStr = await c.req.raw.text();
      proxyBody = jsonStr; 
    } else {
      proxyBody = await c.req.raw.arrayBuffer();
    }
  }

  console.log(`[API Gateway] Proxying to ${targetUrl} with body:`, proxyBody);

  const response = await fetch(targetUrl, {
    method: c.req.method,
    headers,
    body: proxyBody,
  });

  // Return the downstream response — Hono's CORS middleware will
  // automatically append CORS headers to whatever we return from the handler.
  return new Response(response.body, {
    status: response.status,
    headers: response.headers,
  });
}

app.all('/api/auth/*', async (c) => {
  return proxyRequest(c, '/api/auth', '/auth', c.env.AUTH_SVC_URL);
});

app.all('/api/users/*', async (c) => {
  return proxyRequest(c, '/api/users', '/users', c.env.AUTH_SVC_URL);
});

app.all('/api/papers/*', async (c) => {
  return proxyRequest(c, '/api/papers', '/papers', c.env.PAPERS_SVC_URL);
});

app.all('/api/exam/*', async (c) => {
  return proxyRequest(c, '/api/exam', '/exam', c.env.PAPERS_SVC_URL);
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
