This guide provides detailed instructions on how to set up the infrastructure, obtain the necessary tokens, and configure GitHub Secrets for the manual and automated deployment of the Exam Assessment application.

## 1. Database Setup (Neon PostgreSQL)

The project uses [Neon](https://neon.tech/) as its PostgreSQL provider, specifically utilizing the serverless HTTP driver for Cloudflare Workers compatibility.

### Create a Database:
1. Sign up for a free account at [Neon.tech](https://neon.tech/).
2. Create a new project (e.g., `exam-assessment`).
3. In the **Connection Details** section on your dashboard, copy the **Connection string**.
   - It should look like: `postgresql://[user]:[password]@[host]/neondb?sslmode=require`
4. This becomes your **DATABASE_URL**.

### Initialize Schema:
The CI/CD pipeline is configured to automatically run migrations on every deployment. However, for the initial setup or local testing, you can push the schema manually:
```bash
pnpm --filter @assessment/db run db:push
```

## 2. Cloudflare Public API URL

Once the `api-gateway` worker is deployed, it provides the public API endpoint.

### How to get the URL:
1. Go to your [Cloudflare Dashboard](https://dash.cloudflare.com/).
2. Navigate to **Workers & Pages** > **api-gateway**.
3. Under **Build & deployment** (or on the main overview for the worker), you will find the **URL** (e.g., `https://api-gateway.your-subdomain.workers.dev`).
4. For production, the URL is: **`https://exam-api.tute.lk/api`**.
5. This becomes your **NEXT_PUBLIC_API_URL**.

## 3. Cloudflare Workers Setup (Services)

The backend services (`api-gateway`, `auth-svc`, `papers-svc`) are deployed as Cloudflare Workers using Wrangler.

### Get Cloudflare Account ID:
1. Log in to the [Cloudflare Dashboard](https://dash.cloudflare.com/).
2. Select your account.
3. Your **Account ID** is visible in the URL (e.g., `dash.cloudflare.com/<ACCOUNT_ID>/...`) or on the right sidebar of the "Overview" page.

### Get Cloudflare API Token:
1. Go to **My Profile** > **API Tokens**.
2. Click **Create Token**.
3. Use the **Edit Cloudflare Workers** template.
4. Ensure it has permissions for:
   - Account: Workers Scripts (Edit)
   - Account: Worker KV Storage (Edit)
   - User: Details (Read)
   - Zone: Workers Routes (Edit) (Required for Custom Domains)
   - Zone: DNS (Edit) (Required for Custom Domains)
   - Zone: Zone (Read) (Required for Custom Domains)
5. Copy the generated token.

## 4. Vercel Setup (Portal & Admin)

The frontend portal is a Next.js application designed to be deployed on Vercel.

### Get Vercel Token:
1. Log in to [Vercel](https://vercel.com/dashboard).
2. Go to **Settings** > **Tokens**.
3. Click **Create Token**.
4. Give it a name (e.g., `github-actions-deploy`) and set the scope.
5. Copy the token.

### Get Org ID and Project ID:
1. Ensure your projects (portal and admin) are linked or created on Vercel.
2. For each app, link it via Vercel CLI or find the IDs in the dashboard.
3. You will need two different **Project IDs**:
   - One for **apps/portal** → `VERCEL_PORTAL_PROJECT_ID`
   - One for **apps/admin** → `VERCEL_ADMIN_PROJECT_ID`
4. The **Org ID** (`VERCEL_ORG_ID`) is usually the same for both.
5. If using CLI, `vercel link` in each app directory will create a `.vercel/project.json` file where you can find these.

## 4. Turborepo Remote Caching (Optional but Recommended)

Turborepo can use remote caching to speed up CI/CD builds.

1. In your Vercel Dashboard, go to your team settings.
2. Your **TURBO_TEAM** is your Vercel team/user slug.
3. Your **TURBO_TOKEN** is the Vercel Token you created in the previous step.

## 5. GitHub Secrets Configuration

To enable the CI/CD pipeline, you must add the following secrets to your GitHub repository:

1. Go to your repository on GitHub.
2. Navigate to **Settings** > **Secrets and variables** > **Actions**.
3. Click **New repository secret** for each of the following:

| Secret Name | Description |
| :--- | :--- |
| `CLOUDFLARE_API_TOKEN` | Your Cloudflare API Token |
| `CLOUDFLARE_ACCOUNT_ID` | Your Cloudflare Account ID |
| `DATABASE_URL` | Your Neon PostgreSQL connection string |
| `NEXT_PUBLIC_API_URL` | URL of your `api-gateway` worker (ending in `/api`) |
| `VERCEL_TOKEN` | Your Vercel API Token |
| `VERCEL_ORG_ID` | Your Vercel Organization ID |
| `VERCEL_PORTAL_PROJECT_ID` | Project ID for the portal app |
| `VERCEL_ADMIN_PROJECT_ID` | Project ID for the admin app |
| `TURBO_TOKEN` | (Same as Vercel Token) |
| `TURBO_TEAM` | Your Vercel Team/User slug (as a **Variable**, not Secret) |

> [!NOTE]
> `TURBO_TEAM` can be added as a **GitHub Variable** instead of a Secret if you prefer, as it's not sensitive.

## 6. Local Development and Deployment

### Install CLI tools:
```bash
pnpm install -g wrangler vercel
```

### Manual Deployment:
- **Database**: `pnpm --filter @assessment/db run db:push` (Updates schema).
- **Workers**: `pnpm run deploy` from the root (targets all services).
- **Vercel Apps**: `cd apps/portal && vercel --prod` (and same for `apps/admin`).
