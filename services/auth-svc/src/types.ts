import type { Database } from '@assessment/db';

export interface Env {
  ENVIRONMENT?: string;
  DATABASE_URL: string;
  JWT_SECRET: string;
  JWT_ISSUER: string;
  ACCESS_TOKEN_EXPIRY: string;
  REFRESH_TOKEN_EXPIRY: string;
  KV: KVNamespace;
}

export interface Variables {
  db: Database;
  userId: string;
  userRole: string;
}
