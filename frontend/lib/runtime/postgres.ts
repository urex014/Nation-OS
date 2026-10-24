import { readFileSync } from "node:fs";
import path from "node:path";
import postgres, { type Sql } from "postgres";
import { databaseUrl, directDatabaseUrl } from "./database-url";

let cached: { url: string; sql: Sql } | null = null;
let direct: { url: string; sql: Sql } | null = null;
let ready: Promise<void> | null = null;
let readyUrl = "";

function open(url: string): Sql {
  const local = /127\.0\.0\.1|localhost/.test(url);
  return postgres(url, {
    max: 1,
    prepare: false,
    idle_timeout: 5,
    connect_timeout: 15,
    ssl: local ? false : "require",
    onnotice() {},
  });
}

export function getSql(): Sql {
  const url = databaseUrl();
  if (!url) throw new Error("Set DATABASE_URL or POSTGRES_URL.");
  if (!cached || cached.url !== url) {
    if (cached) void cached.sql.end({ timeout: 1 });
    cached = { url, sql: open(url) };
    if (url === directDatabaseUrl()) {
      ready = null;
      readyUrl = "";
    }
  }
  return cached.sql;
}

function schemaSql(): Sql {
  const url = directDatabaseUrl();
  if (!url) throw new Error("Set DATABASE_URL or POSTGRES_URL.");
  if (url === databaseUrl()) return getSql();
  if (!direct || direct.url !== url) {
    if (direct) void direct.sql.end({ timeout: 1 });
    direct = { url, sql: open(url) };
    ready = null;
    readyUrl = "";
  }
  return direct.sql;
}

export function schemaStatements(): string[] {
  const sql = readFileSync(path.resolve("db/schema.sql"), "utf8");
  return sql
    .split("\n")
    .filter((line) => !line.trim().startsWith("--"))
    .join("\n")
    .split(";")
    .map((part) => part.trim())
    .filter(Boolean);
}

async function apply(sql: Sql): Promise<void> {
  for (const statement of schemaStatements()) await sql.unsafe(statement);
}

/** Creates the shared tables. A second call does nothing if they are already there. */
export async function ensureRuntimeSchema(): Promise<void> {
  const url = directDatabaseUrl();
  if (!url) return;
  const sql = schemaSql();
  if (!ready || readyUrl !== url) {
    readyUrl = url;
    ready = apply(sql).catch((error: unknown) => {
      ready = null;
      readyUrl = "";
      throw error;
    });
  }
  await ready;
}

export async function applyRuntimeSchema(): Promise<boolean> {
  if (!databaseUrl()) return false;
  await ensureRuntimeSchema();
  return true;
}

export async function closeSql(): Promise<void> {
  const clients = [cached, direct].filter((client): client is { url: string; sql: Sql } =>
    Boolean(client),
  );
  cached = null;
  direct = null;
  ready = null;
  readyUrl = "";
  await Promise.all(clients.map((client) => client.sql.end({ timeout: 1 })));
}
