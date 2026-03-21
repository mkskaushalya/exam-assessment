export interface Env {
  ENVIRONMENT: string;
  KV: KVNamespace;
  JWT_SECRET: string;
  // Service bindings
  AUTH_SVC: Fetcher;
  PAPERS_SVC: Fetcher;
}
