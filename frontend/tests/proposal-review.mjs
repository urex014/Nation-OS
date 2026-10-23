/** Review must recompute outputs, keep input unchanged and never turn a critique into an approved proposal. */
import assert from "node:assert/strict";
import { createAIService } from "../lib/ai-service.mjs";
import { createAnalystAPI } from "../lib/http-api.mjs";
import { computeProposal } from "../lib/knowledge.mjs";

const proposal = {
  years: 10,
  scope: "all",
  growth: 2,
  delivery: 80,
  maintenance: 20,
  budgets: { food: 0, education: 120, transport: 0, health: 0, energy: 0, water: 0 },
};
const original = structuredClone(proposal);
const service = createAIService({ apiKey: "" });
const report = await service.analyze({ question: "Review this plan", mode: "review", proposal });
assert.deepEqual(proposal, original);
assert.equal(report.proposal, null);
assert.equal(report.modelResult, null);
assert.equal(report.review.cases.length, 4);
assert.equal(report.review.monitoring.length, 1);
assert.deepEqual(report.review.cases[0].end, computeProposal(proposal).years.at(-1).national);
assert(report.review.cases[1].end.education.with <= report.review.cases[0].end.education.with);
assert(
  report.findings.every((finding) =>
    finding.sourceIds.every((id) => report.sources.some((source) => source.id === id)),
  ),
);
const expensive = await service.analyze({
  question: "Review",
  mode: "review",
  proposal: {
    ...proposal,
    budgets: Object.fromEntries(Object.keys(proposal.budgets).map((key) => [key, 1000])),
  },
});
assert(expensive.review.flags.some((flag) => flag.includes("borrowing")));
const empty = await service.analyze({
  question: "Review",
  mode: "review",
  proposal: { ...proposal, budgets: { ...proposal.budgets, education: 0 } },
});
assert.equal(empty.review.monitoring.length, 0);
assert(empty.review.flags.some((flag) => flag.includes("No investment")));
const api = createAnalystAPI(service);
for (const invalid of [
  null,
  { ...proposal, years: 7 },
  { ...proposal, scope: "fake" },
  { ...proposal, budgets: { ...proposal.budgets, extra: -1000 } },
]) {
  const response = await api.analyze(
    new Request("http://localhost/api/ai/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question: "Review", mode: "review", proposal: invalid }),
    }),
  );
  assert.equal(response.status, 400);
}
console.log(
  "Passed: proposal review, deterministic stress runs, source integrity, fiscal flags, empty plans and invalid API inputs.",
);
