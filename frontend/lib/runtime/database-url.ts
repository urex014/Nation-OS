/** Pooled address for ordinary reads and writes. Neon sets DATABASE_URL. */
export function databaseUrl(): string {
  return process.env.DATABASE_URL?.trim() || process.env.POSTGRES_URL?.trim() || "";
}

/** Direct address for creating tables. Falls back to the pooled address. */
export function directDatabaseUrl(): string {
  return (
    process.env.DATABASE_URL_UNPOOLED?.trim() ||
    process.env.POSTGRES_URL_NON_POOLING?.trim() ||
    databaseUrl()
  );
}
