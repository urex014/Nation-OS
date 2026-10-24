import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

const localUrl =
  process.env.NATIONOS_TEST_DATABASE_URL || "postgres://nationos:nationos@127.0.0.1:5432/nationos";
const directory = mkdtempSync(path.join(tmpdir(), "nationos-pg-"));
const saved = {
  DATABASE_URL: process.env.DATABASE_URL,
  POSTGRES_URL: process.env.POSTGRES_URL,
  NATIONOS_AUTH_STORE: process.env.NATIONOS_AUTH_STORE,
  NATIONOS_DB_PATH: process.env.NATIONOS_DB_PATH,
  NATION_DB_PATH: process.env.NATION_DB_PATH,
  NATIONOS_BCRYPT_COST: process.env.NATIONOS_BCRYPT_COST,
  NATIONOS_SESSION_SECRET: process.env.NATIONOS_SESSION_SECRET,
  NODE_ENV: process.env.NODE_ENV,
  VERCEL: process.env.VERCEL,
};

process.env.DATABASE_URL = localUrl;
delete process.env.POSTGRES_URL;
delete process.env.NATIONOS_AUTH_STORE;
delete process.env.VERCEL;
process.env.NATIONOS_DB_PATH = path.join(directory, "nigeria.sqlite");
process.env.NATION_DB_PATH = path.join(directory, "ledger.sqlite");
process.env.NATIONOS_BCRYPT_COST = "4";
process.env.NATIONOS_SESSION_SECRET = "test-only-nationos-session-secret-32chars";
process.env.NODE_ENV = "development";

const stamp = `${Date.now()}-${process.pid}`;
const email = `Shared.Person.${stamp}@nationos.demo`;

test("a write in this process is read by another process", { timeout: 120000 }, async () => {
  const { ensureRuntimeSchema, closeSql, getSql } = await import("../lib/runtime/postgres.ts");
  let decision;
  let ledger;
  try {
    await ensureRuntimeSchema();
    await ensureRuntimeSchema();
    const { registerCitizen } = await import("../lib/auth/service.ts");
    const { createDecision } = await import("../lib/nigeria/decisions.mjs");
    const { saveDecision } = await import("../lib/db/decisions.ts");
    const plans = await import("../lib/nigeria/planning.mjs");
    const created = await registerCitizen({
      name: "Shared Person",
      agency: "Lagos",
      email,
      password: "Citizen-Demo-2026!",
    });
    assert.equal(created.user.email, email.toLowerCase());
    const again = await registerCitizen({
      name: "Shared Person",
      agency: "Lagos",
      email: email.toLowerCase(),
      password: "Citizen-Demo-2026!",
    });
    assert.equal(again, "exists");
    decision = await createDecision({
      title: "Share the education note",
      reason: "Citizens on every copy should see this.",
      config: {
        scope: "NG-LA",
        years: 5,
        startYear: 2027,
        annualBudgetNaira: 1000000000,
        inflation: 0,
        budgetGrowth: 0,
        revenueGrowth: 0,
        delivery: 100,
        maintenance: 0,
        allocations: plans.allocateBudget(1000000000).allocations,
      },
    });
    ledger = await saveDecision(
      {
        question: "How should education be split?",
        budget: 1000,
        horizon: 5,
        strategy: "balance",
      },
      {
        budgets: { education: 180 },
        investigationStages: [],
        tradeoffs: ["Education takes a fixed share."],
        risks: [],
      },
    );
    const run = spawnSync(
      process.execPath,
      [
        "node_modules/tsx/dist/cli.mjs",
        "-e",
        `void (async () => {
         const { closeSql } = await import("./lib/runtime/postgres.ts");
         let code = 0;
         try {
           const { findAccount } = await import("./lib/auth/accounts.ts");
           const { listDecisions } = await import("./lib/nigeria/decisions.mjs");
           const { listDecisions: listLedger } = await import("./lib/db/decisions.ts");
           const account = await findAccount(process.env.EMAIL);
           if (!account || account.name !== "Shared Person") code = 2;
           else {
             const notes = await listDecisions(50, 0);
             if (!notes.records.some((row) => row.id === process.env.DECISION_ID)) code = 3;
             else {
               const ledgerRows = await listLedger();
               if (!ledgerRows.some((row) => row.id === process.env.LEDGER_ID)) code = 4;
             }
           }
         } finally {
           await closeSql();
         }
         process.exit(code);
       })().catch((error) => {
         console.error(error);
         process.exit(1);
       });`,
      ],
      {
        encoding: "utf8",
        env: {
          ...process.env,
          DATABASE_URL: localUrl,
          POSTGRES_URL: "",
          NATIONOS_AUTH_STORE: "",
          EMAIL: email.toLowerCase(),
          DECISION_ID: decision.id,
          LEDGER_ID: ledger.id,
        },
      },
    );
    assert.equal(run.status, 0, run.stderr || run.stdout);
    const sql = getSql();
    const runs = await sql`select run_id from decisions where id = ${decision.id}`;
    await sql`delete from audit_events where decision_id = ${decision.id}`;
    await sql`delete from decisions where id = ${decision.id}`;
    if (runs[0]?.run_id) await sql`delete from plan_runs where id = ${runs[0].run_id}`;
    await sql`delete from ledger_decisions where id = ${ledger.id}`;
    await sql`delete from users where email = ${email.toLowerCase()}`;
  } finally {
    await closeSql();
  }
});

test.after(() => {
  for (const [key, value] of Object.entries(saved)) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
  rmSync(directory, { recursive: true, force: true });
});
