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

/** Shown with HTTP 503 when a runtime write has nowhere durable to go. */
export const DATABASE_REQUIRED =
  "Set DATABASE_URL or POSTGRES_URL before saving. Accounts, plans, and decisions aren't kept on this computer.";

export function requireDatabaseUrl(): string {
  const url = databaseUrl();
  if (!url) throw Object.assign(new Error(DATABASE_REQUIRED), { status: 503 });
  return url;
}
