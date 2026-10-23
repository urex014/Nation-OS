import assert from "node:assert/strict";
import { retrieve, states, planningStates, computeProposal } from "../lib/knowledge.mjs";
import { createAIService } from "../lib/ai-service.mjs";
import { createAnalystAPI } from "../lib/http-api.mjs";
const sources = retrieve("What evidence is available for schools in Kora State?", "AD-11");
assert(sources.some((s) => s.id === "AD-11-education"));
assert(sources.every((s) => s.scope === "all" || s.scope === "AD-11"));
assert(
  retrieve("Which states have the lowest school attendance?").some(
    (s) => s.id === "RANKING-education",
  ),
);
assert.equal(states.length, 37);
assert.equal(
  planningStates.reduce((n, s) => n + s.population, 0),
  24600000,
);
const noKey = createAIService({ apiKey: "" });
assert.equal(noKey.status().configured, false);
const evidence = await noKey.analyze({
  question: "What is the education baseline in Kora State?",
  scope: "AD-11",
  mode: "evidence",
});
assert.equal(evidence.mode, "evidence");
assert.equal(evidence.proposal, null);
assert(evidence.findings.every((f) => f.sourceIds.length));
const local = await noKey.analyze({
  question: "Draft a 10-year education plan in Kora State with an annual budget of 120 million",
  mode: "local",
});
assert.equal(local.mode, "local");
assert.equal(local.model, null);
assert.equal(local.proposal.scope, "AD-11");
assert.equal(local.proposal.years, 10);
assert.equal(local.modelResult.annualCost, 120);
assert.equal(local.modelResult.totalCost, 1200);
assert(local.findings.some((f) => f.sourceIds.includes("AD-11-education")));
const comparison = await noKey.analyze({
  question: "Which states have the lowest school attendance?",
  mode: "local",
});
assert(comparison.findings.some((f) => f.sourceIds.includes("RANKING-education")));
assert.equal(comparison.proposal, null);
const total = await noKey.analyze({
  question: "Draft a 5-year education plan for Kora State with a total budget of 100 million",
  mode: "local",
});
assert.equal(total.modelResult.totalCost, 100);
const unsupported = await noKey.analyze({
  question: "Who won the football tournament?",
  mode: "local",
});
assert.equal(unsupported.proposal, null);
assert(unsupported.findings[0].text.includes("cannot answer"));
const oversize = await noKey.analyze({
  question: "Draft an education plan for Kora State with 20 billion",
  mode: "local",
});
assert.equal(oversize.proposal, null);
const noNetwork = createAIService({
  apiKey: "",
  fetchImpl: () => {
    throw Error("Unexpected network call");
  },
});
assert.equal(
  (await noNetwork.analyze({ question: "Explain GDP in Kora State", mode: "local" })).mode,
  "local",
);
const money = await noKey.analyze({
  question: "How much money is in circulation in Kora State?",
  mode: "local",
});
assert(money.findings.some((f) => f.sourceIds.includes("MONEY")));
assert(money.gaps.some((g) => g.includes("national only")));
const firms = await noKey.analyze({
  question: "How many foreign businesses are in Kora State?",
  mode: "local",
});
assert(firms.findings.some((f) => f.sourceIds.includes("BUSINESS-AD-11")));
assert.equal(firms.proposal, null);
const best = await noKey.analyze({
  question: "Which state is doing best overall and why?",
  mode: "local",
});
assert(best.findings.some((f) => f.sourceIds.includes("COMPARISON")));
assert(best.gaps.some((g) => g.includes("does not establish why")));
const pair = await noKey.analyze({ question: "Compare Kora State and Azure State", mode: "local" });
assert(pair.findings.some((f) => f.sourceIds.includes("COMPARE-AD-11")));
assert(pair.findings.some((f) => f.sourceIds.includes("COMPARE-AD-61")));
assert(
  retrieve("How many banks and deposits are there?").some(
    (s) => s.id === "BANKS" || s.id === "MONEY",
  ),
);
await assert.rejects(() => noKey.analyze({ question: "schools", mode: "ai" }), /not configured/);
await assert.rejects(() => noKey.analyze({ question: "", mode: "evidence" }), /question/);
await assert.rejects(
  () => noKey.analyze({ question: "school", scope: "invalid", mode: "evidence" }),
  /Invalid scope/,
);
const proposal = {
  title: "Kora school access",
  reason: "Investigate attendance gaps before committing delivery budgets.",
  scope: "AD-11",
  years: 5,
  growth: 2,
  delivery: 80,
  maintenance: 20,
  budgets: { food: 0, education: 100, transport: 20, health: 0, energy: 0, water: 10 },
};
const question = "Draft a five-year education plan for Kora State";
const answer = {
  summary: "A draft for analyst review.",
  findings: [
    { text: "The synthetic baseline shows an attendance gap.", sourceIds: ["AD-11-education"] },
  ],
  gaps: ["No learning assessment data supplied."],
  assumptions: ["Delivery is an illustrative assumption."],
  proposal,
};
let providerCalls = 0;
const mockFetch = async (url, options) => {
  providerCalls++;
  assert.equal(url, "https://api.openai.com/v1/responses");
  const payload = JSON.parse(options.body);
  assert.equal(payload.store, false);
  assert.equal(payload.text.format.strict, true);
  assert(!options.body.includes("householdId"));
  assert(!options.body.includes("AD-C-"));
  return {
    ok: true,
    json: async () => ({
      status: "completed",
      model: "test-model",
      output: [
        { type: "message", content: [{ type: "output_text", text: JSON.stringify(answer) }] },
      ],
    }),
  };
};
const ai = createAIService({ apiKey: "unit-test-key", model: "test-model", fetchImpl: mockFetch });
const report = await ai.analyze({ question, scope: "AD-11" });
assert.equal(report.mode, "ai");
assert.equal(providerCalls, 1);
assert.equal(report.modelResult.totalCost, 650);
assert.equal(report.modelResult.years.at(-1).year, 2031);
assert(report.modelResult.fiscal);
assert.deepEqual(report.modelResult, computeProposal(proposal));
const bad = createAIService({
  apiKey: "test",
  fetchImpl: async () => ({
    ok: true,
    json: async () => ({
      status: "completed",
      output: [
        {
          content: [
            {
              type: "output_text",
              text: JSON.stringify({
                ...answer,
                findings: [{ text: "Unsupported claim", sourceIds: ["invented-source"] }],
              }),
            },
          ],
        },
      ],
    }),
  }),
});
await assert.rejects(() => bad.analyze({ question, scope: "AD-11" }), /validation/);
const refused = createAIService({
  apiKey: "test",
  fetchImpl: async () => ({
    ok: true,
    json: async () => ({ status: "completed", output: [{ content: [{ type: "refusal" }] }] }),
  }),
});
await assert.rejects(() => refused.analyze({ question }), /declined/);
const unavailable = createAIService({
  apiKey: "test",
  fetchImpl: async () => ({ ok: false, status: 401 }),
});
await assert.rejects(() => unavailable.analyze({ question }), /authentication/);
const api = createAnalystAPI(noKey),
  address = "http://127.0.0.1:4173";
const request = (body, headers = {}) =>
  new Request(address + "/api/ai/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
const status = await (await api.status(new Request(address + "/api/ai/status"))).json();
assert.equal(status.configured, false);
assert(!JSON.stringify(status).includes("unit-test-key"));
const search = await api.analyze(
  request({ question: "Kora schools", scope: "AD-11", mode: "evidence" }),
);
assert.equal(search.status, 200);
assert.equal((await search.json()).mode, "evidence");
const disabled = await api.analyze(request({ question: "Schools", mode: "ai" }));
assert.equal(disabled.status, 503);
const automated = await api.analyze(
  request({ question: "Draft a 5-year water plan in Kora State", mode: "local" }),
);
assert.equal(automated.status, 200);
assert.equal((await automated.json()).modelResult.years.at(-1).year, 2031);
assert.equal(
  (await api.analyze(request("{}", { Origin: "https://unrelated.example" }))).status,
  403,
);
assert.equal((await api.analyze(request("not json"))).status, 400);
assert.equal((await api.analyze(request({ question: "x".repeat(13000) }))).status, 413);
console.log(
  "Passed: retrieval, structured responses, citations, numerical handoff, local analysis and Next.js API request handling. Provider responses were mocked.",
);
