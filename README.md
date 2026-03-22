# Exam Practice Platform

A modern, full-stack **Exam Practice Platform** built as a monorepo with industry-standard tooling. Students can browse practice papers, purchase access, take timed exams, and view performance analytics.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Next.js 15 (App Router), TypeScript, Ant Design 5, Zustand, TanStack Query, React Hook Form + Zod, Recharts, SCSS Modules |
| **Backend** | Cloudflare Workers + Hono framework (TypeScript) |
| **Database** | PostgreSQL via Neon (serverless) — Drizzle ORM |
| **Cache/Sessions** | Cloudflare KV |
| **Auth** | JWT access tokens (in-memory) + httpOnly refresh cookies |
| **Monorepo** | Turborepo + pnpm workspaces |
| **CI/CD** | GitHub Actions — affected-only deploys via Turborepo |
| **Testing** | Vitest + React Testing Library |

## Project Structure

```
exam-assessment/
├── apps/
│   ├── portal/         # Next.js 15 — Student Exam Portal (port 3000)
│   └── admin/          # Next.js 15 — Admin Panel (port 3001)
├── services/
│   ├── api-gateway/    # Cloudflare Worker — API Gateway (CORS, rate limiting)
│   ├── auth-svc/       # Cloudflare Worker — Auth Service (JWT, registration)
│   └── papers-svc/     # Cloudflare Worker — Papers & Exam Service
├── packages/
│   ├── db/             # Drizzle ORM schemas + migrations
│   ├── types/          # Shared TypeScript interfaces
│   ├── utils/          # Shared utilities (scoring, crypto, errors)
│   ├── eslint-config/  # Shared ESLint configuration
│   └── tsconfig/       # Shared TypeScript configurations
├── docs/
│   └── architecture-review.md  # Architecture decisions (Q1-Q3)
├── .github/
│   └── workflows/ci.yml        # CI/CD pipeline
├── turbo.json          # Turborepo pipeline config
├── pnpm-workspace.yaml # pnpm workspace config
└── tsconfig.base.json  # Root TypeScript strict config
```

## Prerequisites

- **Node.js** ≥ 20.x
- **pnpm** ≥ 9.x (`npm install -g pnpm`)
- **Git** ≥ 2.x
- **Neon** account (for PostgreSQL) — [neon.tech](https://neon.tech)
- **Cloudflare** account (for Workers & KV) — [cloudflare.com](https://cloudflare.com)

## Setup & Installation

### 1. Clone the Repository

```bash
git clone <repository-url>
cd exam-assessment
```

### 2. Install Dependencies

```bash
pnpm install
```

### 3. Configure Environment Variables

Create `.env` files for each service that needs database access:

**`packages/db/.env`**
```env
DATABASE_URL=postgresql://user:password@your-neon-host.neon.tech/dbname?sslmode=require
```

**`services/auth-svc/.dev.vars`**
```env
DATABASE_URL=postgresql://user:password@your-neon-host.neon.tech/dbname?sslmode=require
JWT_SECRET=your-secret-key-min-32-chars-long
```

**`services/papers-svc/.dev.vars`**
```env
DATABASE_URL=postgresql://user:password@your-neon-host.neon.tech/dbname?sslmode=require
JWT_SECRET=your-secret-key-min-32-chars-long
```

**`apps/portal/.env.local`**
```env
NEXT_PUBLIC_API_URL=http://localhost:8787/api
```

### 4. Set Up the Database

```bash
# Generate migration files from Drizzle schemas
pnpm db:generate

# Apply migrations to your Neon database
pnpm db:migrate

# (Optional) Open Drizzle Studio for a visual DB interface
pnpm db:studio
```

### 5. Configure Cloudflare (for Workers)

Update the KV namespace IDs in each service's `wrangler.toml`:

```bash
## Create KV namespaces
# Auth service
cd services/auth-svc && npx wrangler kv namespace create AUTH_KV

# Papers service
cd ../papers-svc && npx wrangler kv namespace create PAPERS_KV

# API Gateway
cd ../api-gateway && npx wrangler kv namespace create GATEWAY_KV

```

Copy the generated IDs into the respective `wrangler.toml` files.

## Development

### Start All Services

```bash
# Start everything in parallel (Next.js apps + Workers)
pnpm dev
```

Or start individual services:

```bash
# Portal only (http://localhost:3000)
pnpm --filter @assessment/portal dev

# Admin only (http://localhost:3001)
pnpm --filter @assessment/admin dev

# Auth service
pnpm --filter @assessment/auth-svc dev

# Papers service
pnpm --filter @assessment/papers-svc dev

# API Gateway
pnpm --filter @assessment/api-gateway dev
```

### Useful Commands

```bash
# Build all packages
pnpm build

# Run all tests
pnpm test

# Lint all packages
pnpm lint

# Format code
pnpm format

# Check formatting
pnpm format:check

# Clean all build artifacts
pnpm clean
```

## Testing

Tests are written using **Vitest** and **React Testing Library**.

```bash
# Run all tests
pnpm test

# Run tests for specific package
pnpm --filter @assessment/utils test
pnpm --filter @assessment/auth-svc test
pnpm --filter @assessment/api-gateway test
pnpm --filter @assessment/portal test
```

### Test Coverage

| Suite | Location | Tests |
|-------|----------|-------|
| Auth Service | `services/auth-svc/__tests__/` | Registration validation (9 scenarios) |
| Scoring Logic | `packages/utils/__tests__/` | Score calculation (10 scenarios) |
| Auth Store | `apps/portal/__tests__/` | Zustand state management (5 tests) |
| Login Component | `apps/portal/__tests__/` | Form validation & API integration (6 tests) |
| Rate Limiter | `services/api-gateway/__tests__/` | Sliding window logic (7 tests) |

## API Endpoints

### Auth Service (`/api/auth`)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/auth/register` | Register new user | No |
| POST | `/auth/login` | Login & get JWT | No |
| POST | `/auth/refresh` | Rotate refresh token | Cookie |
| POST | `/auth/logout` | Invalidate tokens | Yes |

### Papers Service (`/api/papers`)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/papers` | List papers (filter/paginate) | Optional |
| GET | `/papers/:id` | Paper detail + questions | Optional |
| POST | `/papers/:id/issues` | Report issue | Yes |

### Exam Service (`/api/exam`)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/exam/sessions` | Start exam session | Yes |
| POST | `/exam/sessions/:id/answer` | Autosave answer | Yes |
| POST | `/exam/sessions/:id/submit` | Submit & score exam | Yes |

## Database Schema

7 tables managed by Drizzle ORM:

- **users** — id, name, email (unique), password_hash, role, created_at
- **papers** — id, title, description, subject, language, exam_board, type, year, price_lkr
- **questions** — id, paper_id (FK), question_text, explanation_text, points, complexity, order_index
- **question_options** — id, question_id (FK), option_text, is_correct, order_index
- **purchases** — id, user_id (FK), paper_id (FK), amount_paid_lkr, payment_method, payment_ref (UNIQUE on user_id+paper_id)
- **exam_sessions** — id, user_id (FK), paper_id (FK), started_at, expires_at, submitted_at, score_pct, status
- **session_answers** — id, session_id (FK), question_id (FK), selected_option_id, is_correct, answered_at (UNIQUE on session_id+question_id)

## Security

- **Password Hashing**: PBKDF2 with SHA-256 (100,000 iterations) via Web Crypto API
- **JWT**: HMAC-SHA256 signed, short-lived access tokens (15 min) stored in memory
- **Refresh Tokens**: Stored in httpOnly, Secure, SameSite=Strict cookies + KV with rotation
- **Rate Limiting**: KV-based sliding window (60 req/min public, 120 req/min authenticated)
- **Input Validation**: Zod schemas on all endpoints
- **CORS**: Environment-aware origin whitelisting
- **Access Control**: Purchase verification before exam access

## Architecture

For detailed architecture decisions, see [`docs/architecture-review.md`](docs/architecture-review.md), covering:

1. **Q1**: Scaling exam timers with KV eventual consistency
2. **Q2**: Service Bindings vs HTTP trade-offs
3. **Q3**: Security headers via Hono middleware

## CI/CD

GitHub Actions pipeline (`.github/workflows/ci.yml`):

1. **Lint & Test** — Turborepo affected-only
2. **Build** — Turborepo affected-only
3. **Deploy Workers** — Matrix deploy (api-gateway, auth-svc, papers-svc) via Wrangler
4. **Deploy Portal** — Build and deploy frontend

## Package Naming Convention

All workspace packages use the `@assessment/*` naming convention:

- `@assessment/portal` — Student portal
- `@assessment/admin` — Admin panel
- `@assessment/api-gateway` — API gateway
- `@assessment/auth-svc` — Auth service
- `@assessment/papers-svc` — Papers & exam service
- `@assessment/db` — Database schemas
- `@assessment/types` — Shared types
- `@assessment/utils` — Shared utilities
- `@assessment/eslint-config` — ESLint config
- `@assessment/tsconfig` — TypeScript configs

## License

This project is part of a software engineering assessment.
