import type { Database } from '@assessment/db';

export interface Env {
  DATABASE_URL: string;
  JWT_SECRET: string;
  KV: KVNamespace;
}

export interface Variables {
  db: Database;
  userId: string;
  userRole: string;
}
