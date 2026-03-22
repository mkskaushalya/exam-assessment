export interface Env {
  ENVIRONMENT: string;
  KV: KVNamespace;
  JWT_SECRET: string;
  // HTTP proxy URLs for local development
  AUTH_SVC_URL: string;
  PAPERS_SVC_URL: string;
  // Service bindings for production
  AUTH_SVC: Fetcher;
  PAPERS_SVC: Fetcher;
}
