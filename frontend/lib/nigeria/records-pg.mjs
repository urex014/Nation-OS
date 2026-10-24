import { randomUUID } from "node:crypto";
import { ensureRuntimeSchema, getSql } from "../runtime/postgres.ts";

function now() {
  return new Date().toISOString();
}

function plainDecision(row) {
  return {
    id: row.id,
    title: row.title,
    reason: row.reason,
    status: row.status,
    revision: Number(row.revision),
    createdAt: row.created_at,
  };
}

export async function insertPlan(run) {
  await ensureRuntimeSchema();
  const sql = getSql();
  await sql`
    insert into plan_runs (id, config_json, result_json, source_snapshot_json, created_at)
    values (
      ${run.id},
      ${JSON.stringify(run.result.config)},
      ${JSON.stringify(run.result)},
      ${JSON.stringify(run.sources)},
      ${now()}
    )
  `;
}

export async function saveDecision(input, run) {
  await ensureRuntimeSchema();
  const sql = getSql();
  const id = randomUUID();
  const stamp = now();
  await sql.begin(async (tx) => {
    await tx`
      insert into plan_runs (id, config_json, result_json, source_snapshot_json, created_at)
      values (
        ${run.id},
        ${JSON.stringify(run.result.config)},
        ${JSON.stringify(run.result)},
        ${JSON.stringify(run.sources)},
        ${stamp}
      )
    `;
    await tx`
      insert into decisions (id, title, reason, run_id, status, revision, created_at, updated_at)
      values (${id}, ${input.title.trim()}, ${input.reason.trim()}, ${run.id}, 'Draft', 1, ${stamp}, ${stamp})
    `;
    await tx`
      insert into audit_events (decision_id, action, details_json, created_at)
      values (
        ${id},
        ${"Created draft"},
        ${JSON.stringify({ version: run.result.version, scope: run.result.config.scope })},
        ${stamp}
      )
    `;
  });
  return id;
}

export async function getDecision(id) {
  await ensureRuntimeSchema();
  const sql = getSql();
  const rows = await sql`
    select d.id, d.title, d.reason, d.status, d.revision, d.created_at, d.updated_at,
           r.result_json, r.source_snapshot_json
    from decisions d
    join plan_runs r on r.id = d.run_id
    where d.id = ${id}
  `;
  const row = rows[0];
  if (!row) throw Object.assign(Error("Decision record not found."), { status: 404 });
  const audit = await sql`
    select action, details_json, created_at
    from audit_events
    where decision_id = ${id}
    order by id
  `;
  return {
    id: row.id,
    title: row.title,
    reason: row.reason,
    status: row.status,
    revision: Number(row.revision),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    result: JSON.parse(row.result_json),
    sources: JSON.parse(row.source_snapshot_json),
    audit: audit.map((event) => ({
      action: event.action,
      details: JSON.parse(event.details_json),
      createdAt: event.created_at,
    })),
  };
}

export async function listDecisions(limit, offset) {
  await ensureRuntimeSchema();
  const sql = getSql();
  const totals = await sql`select count(*)::int as total from decisions`;
  const total = Number(totals[0]?.total ?? 0);
  const records = (
    await sql`
      select id, title, reason, status, revision, created_at
      from decisions
      order by created_at desc, id desc
      limit ${limit} offset ${offset}
    `
  ).map(plainDecision);
  return { records, total, limit, offset, hasMore: offset + records.length < total };
}

export async function reviewDecision(id, input) {
  await ensureRuntimeSchema();
  const sql = getSql();
  const stamp = now();
  await sql.begin(async (tx) => {
    const current = await tx`select status, revision from decisions where id = ${id}`;
    if (!current[0]) throw Object.assign(Error("Decision record not found."), { status: 404 });
    if (Number(current[0].revision) !== input.expectedRevision) {
      throw Object.assign(Error("This record changed. Reload it before reviewing."), {
        status: 409,
      });
    }
    const updated = await tx`
      update decisions
      set status = ${input.status}, revision = revision + 1, updated_at = ${stamp}
      where id = ${id} and revision = ${input.expectedRevision}
      returning id
    `;
    if (!updated[0]) {
      throw Object.assign(Error("This record changed. Reload it before reviewing."), {
        status: 409,
      });
    }
    await tx`
      insert into audit_events (decision_id, action, details_json, created_at)
      values (
        ${id},
        ${"Status reviewed"},
        ${JSON.stringify({
          from: current[0].status,
          to: input.status,
          previousRevision: Number(current[0].revision),
        })},
        ${stamp}
      )
    `;
  });
}
