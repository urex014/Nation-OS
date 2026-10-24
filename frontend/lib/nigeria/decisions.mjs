import { randomUUID } from "node:crypto";
import { databaseUrl } from "../runtime/database-url.ts";
import { getDatabase } from "./database.mjs";
import { getPlanningContext, getSources } from "./repository.mjs";
import { projectPlan } from "./planning.mjs";
import { STATUSES } from "./constants.mjs";

async function remote() {
  if (!databaseUrl()) return null;
  return import("./records-pg.mjs");
}

function prepareRun(config) {
  const context = getPlanningContext(config?.scope);
  return { id: randomUUID(), result: projectPlan(config, context), sources: getSources() };
}
function insertRun(db, run) {
  db.prepare(
    "insert into plan_runs(id,config_json,result_json,source_snapshot_json) values (?,?,?,?)",
  ).run(
    run.id,
    JSON.stringify(run.result.config),
    JSON.stringify(run.result),
    JSON.stringify(run.sources),
  );
}
export async function calculateAndStore(config) {
  const run = prepareRun(config);
  const pg = await remote();
  if (pg) await pg.insertPlan(run);
  else insertRun(getDatabase(), run);
  return { runId: run.id, result: run.result, sources: run.sources };
}
export async function createDecision(input) {
  if (typeof input.title !== "string" || !input.title.trim() || input.title.length > 160)
    throw Object.assign(Error("Enter a title of 1–160 characters."), { status: 400 });
  if (typeof input.reason !== "string" || !input.reason.trim() || input.reason.length > 4000)
    throw Object.assign(Error("Record the reasoning before saving (up to 4,000 characters)."), {
      status: 400,
    });
  // A submitted run/output is never trusted. The server recomputes the authoritative snapshot.
  const run = prepareRun(input.config);
  const pg = await remote();
  if (pg) return pg.getDecision(await pg.saveDecision(input, run));
  const db = getDatabase();
  const id = randomUUID();
  db.exec("begin immediate");
  try {
    insertRun(db, run);
    db.prepare("insert into decisions(id,title,reason,run_id) values (?,?,?,?)").run(
      id,
      input.title.trim(),
      input.reason.trim(),
      run.id,
    );
    db.prepare("insert into audit_events(decision_id,action,details_json) values (?,?,?)").run(
      id,
      "Created draft",
      JSON.stringify({ version: run.result.version, scope: run.result.config.scope }),
    );
    db.exec("commit");
  } catch (error) {
    db.exec("rollback");
    throw error;
  }
  return getDecision(id);
}
export async function getDecision(id) {
  const pg = await remote();
  if (pg) return pg.getDecision(id);
  const row = getDatabase()
    .prepare(
      `select d.*,r.result_json,r.source_snapshot_json from decisions d
    join plan_runs r on r.id=d.run_id where d.id=?`,
    )
    .get(id);
  if (!row) throw Object.assign(Error("Decision record not found."), { status: 404 });
  return {
    id: row.id,
    title: row.title,
    reason: row.reason,
    status: row.status,
    revision: row.revision,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    result: JSON.parse(row.result_json),
    sources: JSON.parse(row.source_snapshot_json),
    audit: getDatabase()
      .prepare(
        "select action,details_json,created_at from audit_events where decision_id=? order by id",
      )
      .all(id)
      .map((event) => ({
        action: event.action,
        details: JSON.parse(event.details_json),
        createdAt: event.created_at,
      })),
  };
}
export async function listDecisions(limit = 20, offset = 0) {
  if (
    !Number.isInteger(limit) ||
    limit < 1 ||
    limit > 100 ||
    !Number.isInteger(offset) ||
    offset < 0
  )
    throw Object.assign(Error("Invalid pagination."), { status: 400 });
  const pg = await remote();
  if (pg) return pg.listDecisions(limit, offset);
  const db = getDatabase();
  const total = db.prepare("select count(*) as total from decisions").get().total;
  const records = db
    .prepare(
      "select id,title,reason,status,revision,created_at as createdAt from decisions order by created_at desc,id desc limit ? offset ?",
    )
    .all(limit, offset)
    .map((row) => ({ ...row }));
  return { records, total, limit, offset, hasMore: offset + records.length < total };
}
export async function reviewDecision(id, input) {
  if (!STATUSES.includes(input.status) || !Number.isInteger(input.expectedRevision))
    throw Object.assign(Error("Send a valid status and expectedRevision."), { status: 400 });
  const pg = await remote();
  if (pg) {
    await pg.reviewDecision(id, input);
    return pg.getDecision(id);
  }
  const db = getDatabase();
  db.exec("begin immediate");
  try {
    const current = db.prepare("select status,revision from decisions where id=?").get(id);
    if (!current) throw Object.assign(Error("Decision record not found."), { status: 404 });
    if (current.revision !== input.expectedRevision)
      throw Object.assign(Error("This record changed. Reload it before reviewing."), {
        status: 409,
      });
    db.prepare(
      "update decisions set status=?,revision=revision+1,updated_at=strftime('%Y-%m-%dT%H:%M:%fZ','now') where id=? and revision=?",
    ).run(input.status, id, input.expectedRevision);
    db.prepare("insert into audit_events(decision_id,action,details_json) values (?,?,?)").run(
      id,
      "Status reviewed",
      JSON.stringify({
        from: current.status,
        to: input.status,
        previousRevision: current.revision,
      }),
    );
    db.exec("commit");
  } catch (error) {
    db.exec("rollback");
    throw error;
  }
  return getDecision(id);
}
