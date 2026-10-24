import assert from "node:assert/strict";
import { test } from "node:test";
import { DatabaseSync } from "node:sqlite";
import { readOverviewFrom } from "../../lib/db/overview";
import { applySchema } from "../../lib/db/schema";
import { seed } from "../../lib/db/seed/run";

test("the seeded ledger has 37 jurisdictions and no invented line items", () => {
  const db = new DatabaseSync(":memory:");
  applySchema(db);
  seed(db);
  const overview = readOverviewFrom(db, 2026, "all");
  assert.ok(overview);
  assert.equal(overview.jurisdictions.length, 37);
  assert.equal(overview.jurisdictions.filter((row) => row.provenance === "published").length, 36);
  assert.equal(overview.jurisdictions.find((row) => row.id === "NG-FC")?.provenance, "outside");
  assert.equal(overview.priorities.length, 0);
  assert.equal(overview.revenueTrajectory.quarters.length, 0);
  assert.ok(overview.indicators.every((item) => item.source.length > 0));
  assert.match(overview.metrics.approvedExpenditure, /₦68\.3tn/);
  const lines = db.prepare("SELECT COUNT(*) AS total FROM line_items").get() as { total: number };
  assert.equal(lines.total, 0);
  const projects = db.prepare("SELECT COUNT(*) AS total FROM projects").get() as { total: number };
  assert.equal(projects.total, 8);
  db.close();
});
