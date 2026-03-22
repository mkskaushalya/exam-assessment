# Project Setup & Deployment Guide

This guide provides detailed instructions on how to set up the infrastructure, obtain the necessary tokens, and configure GitHub Secrets for the manual and automated deployment of the Exam Assessment application.

## 1. Cloudflare Workers Setup (Services)

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
5. Copy the generated token.

## 2. Vercel Setup (Portal)

The frontend portal is a Next.js application designed to be deployed on Vercel.

### Get Vercel Token:
1. Log in to [Vercel](https://vercel.com/dashboard).
2. Go to **Settings** > **Tokens**.
3. Click **Create Token**.
4. Give it a name (e.g., `github-actions-deploy`) and set the scope.
5. Copy the token.

### Get Org ID and Project ID:
1. Ensure your project is linked or created on Vercel.
2. If using the Vercel CLI locally, run `vercel link`. This will create a `.vercel/project.json` file.
3. Open `.vercel/project.json`:
   - `orgId` → **VERCEL_ORG_ID**
   - `projectId` → **VERCEL_PROJECT_ID**
4. Alternatively, you can find the **Org ID** in your team settings URL and the **Project ID** in the project's general settings on the Vercel dashboard.

## 3. Turborepo Remote Caching (Optional but Recommended)

Turborepo can use remote caching to speed up CI/CD builds.

1. In your Vercel Dashboard, go to your team settings.
2. Your **TURBO_TEAM** is your Vercel team/user slug.
3. Your **TURBO_TOKEN** is the Vercel Token you created in the previous step.

## 4. GitHub Secrets Configuration

To enable the CI/CD pipeline, you must add the following secrets to your GitHub repository:

1. Go to your repository on GitHub.
2. Navigate to **Settings** > **Secrets and variables** > **Actions**.
3. Click **New repository secret** for each of the following:

| Secret Name | Description |
| :--- | :--- |
| `CLOUDFLARE_API_TOKEN` | Your Cloudflare API Token |
| `CLOUDFLARE_ACCOUNT_ID` | Your Cloudflare Account ID |
| `VERCEL_TOKEN` | Your Vercel API Token |
| `VERCEL_ORG_ID` | Your Vercel Organization ID |
| `VERCEL_PROJECT_ID` | Your Vercel Project ID |
| `TURBO_TOKEN` | (Same as Vercel Token) |
| `TURBO_TEAM` | Your Vercel Team/User slug (as a **Variable**, not Secret) |

> [!NOTE]
> `TURBO_TEAM` can be added as a **GitHub Variable** instead of a Secret if you prefer, as it's not sensitive.

## 5. Local Development and Deployment

### Install CLI tools:
```bash
pnpm install -g wrangler vercel
```

### Manual Deployment:
- **Workers**: `pnpm run deploy` from the root (targets all services).
- **Portal**: `cd apps/portal && vercel --prod`.
