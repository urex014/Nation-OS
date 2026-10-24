import { mkdirSync } from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import { writableDatabasePath } from "../runtime/sqlite-file.mjs";
import type { AccountStore } from "./account-store";
import { hashPassword } from "./passwords";
import type { PublicUser, Role } from "./types";

type UserRow = PublicUser & { password_hash: string };

const cache = globalThis as unknown as { nationAuth?: DatabaseSync };

export function authDatabasePath(): string {
  return path.resolve(process.env.NATIONOS_AUTH_DB_PATH || "data/auth.sqlite");
}

export function authDb(): DatabaseSync {
  if (!cache.nationAuth) {
    const filename = writableDatabasePath(authDatabasePath());
    mkdirSync(path.dirname(filename), { recursive: true });
    const db = new DatabaseSync(filename);
    db.exec("pragma journal_mode=WAL; pragma foreign_keys=ON; pragma busy_timeout=5000;");
    cache.nationAuth = db;
  }
  ensureSchema(cache.nationAuth);
  return cache.nationAuth;
}

function ensureSchema(db: DatabaseSync): void {
  const existing = db
    .prepare("select sql from sqlite_master where type = 'table' and name = 'users'")
    .get() as { sql: string } | undefined;
  if (existing && !existing.sql.includes("'government'")) {
    db.exec("drop table if exists sessions; drop table if exists users;");
  }
  db.exec(`
    create table if not exists users (
      id text primary key,
      email text not null unique,
      name text not null,
      agency text not null,
      role text not null check (role in ('government','citizen')),
      password_hash text not null,
      created_at text not null default (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
    );
  `);
}

function publish(row: UserRow): PublicUser {
  return { id: row.id, email: row.email, name: row.name, agency: row.agency, role: row.role };
}

export const sqliteAccounts: AccountStore = {
  async findByEmail(email: string) {
    const row = authDb()
      .prepare("select * from users where email = ?")
      .get(email.toLowerCase()) as UserRow | undefined;
    if (!row) return null;
    return { ...publish(row), passwordHash: row.password_hash, role: row.role as Role };
  },
  async insertCitizen(input) {
    const email = input.email.toLowerCase();
    const passwordHash = await hashPassword(input.password);
    try {
      authDb()
        .prepare(
          "insert into users (id, email, name, agency, role, password_hash) values (?, ?, ?, ?, 'citizen', ?)",
        )
        .run(input.id, email, input.name, input.agency, passwordHash);
    } catch (error) {
      if (String(error).includes("UNIQUE")) return "exists";
      throw error;
    }
    return { id: input.id, email, name: input.name, agency: input.agency, role: "citizen" };
  },
  async deleteById(id: string) {
    authDb().prepare("delete from users where id = ?").run(id);
  },
};
