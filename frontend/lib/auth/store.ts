import { mkdirSync } from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import { writableDatabasePath } from "../runtime/sqlite-file.mjs";
import { DEMO_USERS } from "./demo-users";
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
    create table if not exists sessions (
      id text primary key,
      user_id text not null references users(id) on delete cascade,
      expires_at integer not null
    );
  `);
  ensureDemoUsers(db);
}

function ensureDemoUsers(db: DatabaseSync): void {
  const count = db.prepare("select count(*) as n from users").get() as { n: number };
  if (count.n > 0) return;
  const insert = db.prepare(
    "insert into users (id, email, name, agency, role, password_hash) values (?, ?, ?, ?, ?, ?)",
  );
  for (const user of DEMO_USERS) {
    insert.run(user.id, user.email, user.name, user.agency, user.role, hashPassword(user.password));
  }
}

function publish(row: UserRow): PublicUser {
  return { id: row.id, email: row.email, name: row.name, agency: row.agency, role: row.role };
}

export function findByEmail(email: string): (PublicUser & { passwordHash: string }) | null {
  const row = authDb().prepare("select * from users where email = ?").get(email) as
    UserRow | undefined;
  if (!row) return null;
  return { ...publish(row), passwordHash: row.password_hash };
}

export function listPublicUsers(): PublicUser[] {
  const rows = authDb()
    .prepare("select id, email, name, agency, role from users order by name, email")
    .all() as PublicUser[];
  return rows.map((row) => ({ ...row }));
}

export function insertCitizen(input: {
  id: string;
  email: string;
  name: string;
  agency: string;
  password: string;
}): PublicUser | "exists" {
  try {
    authDb()
      .prepare(
        "insert into users (id, email, name, agency, role, password_hash) values (?, ?, ?, ?, 'citizen', ?)",
      )
      .run(input.id, input.email, input.name, input.agency, hashPassword(input.password));
  } catch (error) {
    if (String(error).includes("UNIQUE")) return "exists";
    throw error;
  }
  return {
    id: input.id,
    email: input.email,
    name: input.name,
    agency: input.agency,
    role: "citizen",
  };
}

export function createSessionRow(id: string, userId: string, expiresAt: number): void {
  authDb()
    .prepare("insert into sessions (id, user_id, expires_at) values (?, ?, ?)")
    .run(id, userId, expiresAt);
}

export function deleteSessionRow(id: string): void {
  authDb().prepare("delete from sessions where id = ?").run(id);
}

export function userForSession(sessionId: string): PublicUser | null {
  const row = authDb()
    .prepare(
      `select u.id as id, u.email as email, u.name as name, u.agency as agency, u.role as role
       from sessions s join users u on u.id = s.user_id
       where s.id = ? and s.expires_at > ?`,
    )
    .get(sessionId, Math.floor(Date.now() / 1000)) as PublicUser | undefined;
  if (!row) return null;
  return { ...row, role: row.role as Role };
}
