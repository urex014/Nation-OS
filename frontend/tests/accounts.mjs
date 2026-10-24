import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

const directory = mkdtempSync(path.join(tmpdir(), "nationos-accounts-"));
process.env.NATIONOS_AUTH_DB_PATH = path.join(directory, "auth.sqlite");
process.env.NATIONOS_AUTH_STORE = "sqlite";
delete process.env.DATABASE_URL;
delete process.env.POSTGRES_URL;
delete process.env.VERCEL;
process.env.NATIONOS_BCRYPT_COST = "4";
process.env.NATIONOS_SESSION_SECRET = "test-only-nationos-session-secret-32chars";
process.env.NODE_ENV = "development";

const { accountStore, findAccount, accountMode, publicSignUpEnabled } =
  await import("../lib/auth/accounts.ts");
const { registerCitizen } = await import("../lib/auth/service.ts");
const { createPostgresAccounts } = await import("../lib/auth/postgres-accounts.ts");

function restore(saved) {
  for (const [key, value] of Object.entries(saved)) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
}

test("account methods are promises and a failed session removes the new row", async () => {
  const store = await accountStore();
  const email = "async.flow@nationos.demo";
  const pending = store.insertCitizen({
    id: "user-async-flow",
    email,
    name: "Async Flow",
    agency: "Lagos",
    password: "Citizen-Demo-2026!",
  });
  assert.equal(typeof pending.then, "function");
  const created = await pending;
  assert.equal(created.email, email);
  const lookup = store.findByEmail(email);
  assert.equal(typeof lookup.then, "function");
  assert.match((await lookup).passwordHash, /^\$2[ab]\$/);
  await store.deleteById(created.id);
  assert.equal(await store.findByEmail(email), null);

  const rollbackEmail = "rollback.citizen@nationos.demo";
  await assert.rejects(
    () =>
      registerCitizen(
        {
          name: "Rollback Citizen",
          agency: "Lagos",
          email: rollbackEmail,
          password: "Citizen-Demo-2026!",
        },
        {
          assertSecret() {},
          open() {
            throw new Error("sign failed");
          },
        },
      ),
    /sign failed/,
  );
  assert.equal(await findAccount(rollbackEmail), null);
});

test("sign-up checks the session secret before it saves anyone", async () => {
  const saved = {
    NODE_ENV: process.env.NODE_ENV,
    NATIONOS_SESSION_SECRET: process.env.NATIONOS_SESSION_SECRET,
  };
  process.env.NODE_ENV = "production";
  process.env.NATIONOS_SESSION_SECRET = "too-short";
  try {
    const email = "nosecret.citizen@nationos.demo";
    await assert.rejects(
      () =>
        registerCitizen({
          name: "No Secret",
          agency: "Lagos",
          email,
          password: "Citizen-Demo-2026!",
        }),
      /NATIONOS_SESSION_SECRET/,
    );
    assert.equal(await findAccount(email), null);
  } finally {
    restore(saved);
  }
});

test("a duplicate email in any case is one person", async () => {
  const people = [];
  const queries = [];
  const sql = async (strings, ...values) => {
    const text = strings.join(" ").replace(/\s+/g, " ").toLowerCase();
    queries.push(text);
    if (!text.includes("insert into users")) return [];
    const email = String(values[1]).toLowerCase();
    if (people.some((person) => person.email === email)) return [];
    const row = {
      id: values[0],
      email,
      name: values[2],
      agency: values[3],
      role: "citizen",
    };
    people.push(row);
    return [row];
  };
  const store = createPostgresAccounts(sql);
  const first = await store.insertCitizen({
    id: "user-case-a",
    email: "Case.User@nationos.demo",
    name: "Case User",
    agency: "Lagos",
    password: "Citizen-Demo-2026!",
  });
  assert.equal(first.email, "case.user@nationos.demo");
  const second = await store.insertCitizen({
    id: "user-case-b",
    email: "case.user@nationos.demo",
    name: "Case User",
    agency: "Lagos",
    password: "Citizen-Demo-2026!",
  });
  assert.equal(second, "exists");
  assert.equal(people.length, 1);
  assert.ok(
    queries.some(
      (query) => query.includes("on conflict do nothing") && query.includes("returning"),
    ),
  );
});

test("the shared schema is idempotent and names every runtime table", () => {
  const file = readFileSync("db/schema.sql", "utf8");
  assert.match(file, /create table if not exists users/i);
  assert.match(
    file,
    /create unique index if not exists users_email_lower_key on users \(lower\(email\)\)/i,
  );
  assert.match(file, /create table if not exists plan_runs/i);
  assert.match(file, /create table if not exists decisions/i);
  assert.match(file, /create table if not exists audit_events/i);
  assert.match(file, /create table if not exists ledger_decisions/i);
  assert.doesNotMatch(file, /drop table/i);
});

test("database URL selects postgres, and Vercel without one refuses sign-up", () => {
  const saved = {
    VERCEL: process.env.VERCEL,
    NATIONOS_AUTH_STORE: process.env.NATIONOS_AUTH_STORE,
    DATABASE_URL: process.env.DATABASE_URL,
    POSTGRES_URL: process.env.POSTGRES_URL,
  };
  try {
    delete process.env.NATIONOS_AUTH_STORE;
    delete process.env.POSTGRES_URL;
    delete process.env.VERCEL;
    process.env.DATABASE_URL = "postgres://example";
    assert.equal(accountMode(), "postgres");
    assert.equal(publicSignUpEnabled(), true);
    process.env.VERCEL = "1";
    assert.equal(accountMode(), "postgres");
    delete process.env.DATABASE_URL;
    assert.equal(accountMode(), "disabled");
    assert.equal(publicSignUpEnabled(), false);
    process.env.NATIONOS_AUTH_STORE = "memory";
    assert.equal(publicSignUpEnabled(), false);
    delete process.env.NATIONOS_AUTH_STORE;
    process.env.POSTGRES_URL = "postgres://other";
    assert.equal(accountMode(), "postgres");
  } finally {
    restore(saved);
  }
});

test("sign-in does not load the fiscal database or the model, and fields stay 16px", () => {
  const accounts = readFileSync("lib/auth/accounts.ts", "utf8");
  const service = readFileSync("lib/auth/service.ts", "utf8");
  const route = readFileSync("app/api/auth/sign-in/route.ts", "utf8");
  const panel = readFileSync("components/public/auth-panel.jsx", "utf8");
  const css = readFileSync("app/globals.css", "utf8");
  const layout = readFileSync("app/layout.jsx", "utf8");
  const source = [accounts, service, route].join("\n");
  assert.doesNotMatch(source, /from ["']ai["']/);
  assert.doesNotMatch(source, /@ai-sdk/);
  assert.doesNotMatch(source, /sqlite-file/);
  assert.doesNotMatch(source, /node:sqlite/);
  assert.doesNotMatch(accounts, /^import .*from ["']\.\/store["']/m);
  assert.match(panel, /AbortController/);
  assert.match(panel, /15000/);
  assert.match(panel, /router\.replace/);
  assert.doesNotMatch(panel, /router\.refresh/);
  assert.match(panel, /Signing in…/);
  assert.match(css, /font-size:\s*max\(16px,\s*1rem\)/);
  assert.match(layout, /initialScale:\s*1/);
  assert.doesNotMatch(layout, /maximumScale|userScalable/);
});

test.after(() => {
  rmSync(directory, { recursive: true, force: true });
});
