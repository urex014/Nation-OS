import { randomUUID } from "node:crypto";
import { DATABASE_REQUIRED, databaseUrl } from "../runtime/database-url.ts";
import { getPlanningContext, getSources } from "./repository.mjs";
import { projectPlan } from "./planning.mjs";
import { STATUSES } from "./constants.mjs";

async function remote() {
  if (!databaseUrl()) throw Object.assign(Error(DATABASE_REQUIRED), { status: 503 });
  return import("./records-pg.mjs");
}

function prepareRun(config) {
  const context = getPlanningContext(config?.scope);
  return { id: randomUUID(), result: projectPlan(config, context), sources: getSources() };
}

export async function calculateAndStore(config) {
  const run = prepareRun(config);
  if (run.result.blocked && !run.result.config.overrideProjectCap) {
    return { runId: null, result: run.result, sources: run.sources, blocked: true };
  }
  const pg = await remote();
  await pg.insertPlan(run);
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
  if (run.result.blocked && !run.result.config.overrideProjectCap) {
    throw Object.assign(Error(run.result.blocked), { status: 400 });
  }
  const pg = await remote();
  return pg.getDecision(await pg.saveDecision(input, run));
}

export async function getDecision(id) {
  const pg = await remote();
  return pg.getDecision(id);
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
  return pg.listDecisions(limit, offset);
}

export async function reviewDecision(id, input) {
  if (!STATUSES.includes(input.status) || !Number.isInteger(input.expectedRevision))
    throw Object.assign(Error("Send a valid status and expectedRevision."), { status: 400 });
  const pg = await remote();
  await pg.reviewDecision(id, input);
  return pg.getDecision(id);
}
