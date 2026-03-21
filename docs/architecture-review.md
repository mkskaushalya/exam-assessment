# Architecture Review

## Q1: Scaling the Exam Timer — KV Eventual Consistency Risks

### Problem
Cloudflare KV uses **eventual consistency**, meaning writes may take up to 60 seconds to propagate globally. This poses risks for exam timers where timing precision is critical:

- A student could submit an answer to one PoP, and the timer check on another PoP might read stale data.
- In edge cases, a session could appear "active" on one edge node while already expired on another.

### Mitigation Strategies

1. **Server-Authoritative Timestamps**: Store `startedAt` and `expiresAt` in both KV and PostgreSQL. Use timestamps rather than decrementing counters — the expiry is deterministic regardless of read consistency.

2. **Double-Check on Submit**: When a student submits, verify the expiry against the database (strongly consistent) rather than relying solely on KV.

3. **KV as Cache, DB as Source of Truth**: Use KV for fast reads during the exam (timer display, answer autosave), but always validate critical operations (submission, scoring) against PostgreSQL.

4. **Durable Objects Alternative**: For stricter consistency, Cloudflare Durable Objects provide strong consistency with a single-threaded model per object. Each exam session could be a Durable Object with authoritative timer state. Trade-off: higher latency for global users.

5. **Client Clock Sync**: Send `expiresAt` to the client on session creation. The client countdown is display-only; the server always enforces the real deadline.

---

## Q2: Service Bindings vs HTTP — Advantages & Limitations

### Service Bindings (Current Architecture)

**Advantages:**
- **Zero network overhead**: Communication happens within Cloudflare's infrastructure, no TCP/TLS handshake.
- **No egress costs**: Internal calls don't count as external requests.
- **Lower latency**: Sub-millisecond inter-service communication.
- **Type safety**: Bindings are declared in `wrangler.toml`, making dependencies explicit.
- **No CORS needed**: Internal calls skip CORS entirely.

**Limitations:**
- **Cloudflare-only**: Tightly couples the architecture to Cloudflare's platform.
- **Same-account restriction**: Services must be in the same Cloudflare account.
- **Limited observability**: Harder to add inter-service logging/tracing vs HTTP middleware.
- **No circuit breaking**: No built-in circuit breaker pattern; if a service is down, calls fail immediately.
- **Development experience**: Local dev requires `wrangler dev` with service bindings emulation, which can be complex.

### HTTP-Based Communication

**Advantages:**
- Platform-agnostic; services can be deployed anywhere.
- Rich middleware ecosystem (retries, circuit breakers, tracing).
- Easier local development with any HTTP-compatible mock server.

**Limitations:**
- Network overhead (DNS, TLS, latency).
- Egress costs for inter-service calls.
- Requires CORS configuration for cross-origin calls.

### Recommendation
Use Service Bindings for production (performance) with an HTTP fallback layer for local development. Abstract the communication behind an interface so the transport can be swapped.

---

## Q3: Security Headers Implementation via Hono Middleware

### Implementation

```typescript
import { createMiddleware } from 'hono/factory';

export const securityHeaders = createMiddleware(async (c, next) => {
  await next();

  // Prevent MIME type sniffing
  c.header('X-Content-Type-Options', 'nosniff');

  // Prevent clickjacking
  c.header('X-Frame-Options', 'DENY');

  // XSS protection (legacy browsers)
  c.header('X-XSS-Protection', '1; mode=block');

  // Referrer policy
  c.header('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Content Security Policy
  c.header(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' https://fonts.gstatic.com; connect-src 'self' https://api.assessment.dev"
  );

  // Strict Transport Security (HTTPS only)
  c.header('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');

  // Permissions Policy
  c.header('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
});
```

### Key Headers Explained

| Header | Purpose |
|--------|---------|
| `X-Content-Type-Options: nosniff` | Prevents MIME-sniffing attacks |
| `X-Frame-Options: DENY` | Prevents clickjacking via iframes |
| `Strict-Transport-Security` | Forces HTTPS for 1 year |
| `Content-Security-Policy` | Restricts resource loading origins |
| `Referrer-Policy` | Controls referrer header leakage |
| `Permissions-Policy` | Disables unused browser APIs |

### Placement
Apply at the **API Gateway level** so all downstream services benefit. This middleware runs after the response is generated (`await next()`) to set response headers.
