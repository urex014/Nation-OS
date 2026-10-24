import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

delete process.env.DATABASE_URL;
delete process.env.XAI_API_KEY;
delete process.env.AI_GATEWAY_API_KEY;
delete process.env.NATION_DB_PATH;
const directory = mkdtempSync(path.join(tmpdir(), "nationos-budget-"));
process.env.NATIONOS_DB_PATH = path.join(directory, "budget.sqlite");
const { prepareSourcedDatabase } = await import("../lib/nigeria/database.mjs");
prepareSourcedDatabase();

const { answerQuestion } = await import("../lib/nigeria/chat.mjs");
const { checkProjectRequest } = await import("../lib/nigeria/project-check.mjs");
const { listBudgets } = await import("../lib/nigeria/ledger-read.mjs");
const { fillPlan } = await import("../lib/nigeria/plan-defaults.mjs");
const { explainGuardrails } = await import("../lib/nigeria/alternatives.mjs");
const { allocateBudget } = await import("../lib/nigeria/planning.mjs");
const { groundReply } = await import("../lib/ai/ground.mjs");
const { createTools } = await import("../lib/ai/tools.mjs");
const { answerChat } = await import("../lib/ai/answer.mjs");
const { advise } = await import("../lib/ai/advise.mjs");

const textOf = (answer) => answer.paragraphs.join(" ");
const DEMO = "Our agency budget is ₦400m. We want to allocate ₦50m to a new road project.";

test("ledger tools expose the cited 2026 budget, FAAC and snapshot", async () => {
  const rows = listBudgets();
  const signed = rows.find((row) => row.kind === "signed");
  const third = rows.find((row) => row.kind === "third-reading");
  const capital = rows.find((row) => row.kind === "capital");
  assert.equal(signed.naira, 68320000000000);
  assert.equal(signed.display, "₦68.32tn");
  assert.equal(signed.source.publisher, "BusinessDay");
  assert.equal(signed.source.dateLabel, "17 Apr 2026");
  assert.ok(third.naira > 0 && third.naira !== signed.naira);
  assert.ok(third.capitalNaira && third.statutoryNaira && third.recurrentNaira && third.debtNaira);
  assert.match(capital.display, /32\.2tn/);
  const tools = createTools("government");
  const loaded = await tools.getBudget.execute({ year: 2026, level: "federal" });
  assert.ok(loaded.budgets.some((row) => row.kind === "signed"));
  const faac = await tools.getFaac.execute({});
  assert.equal(faac.headlineTrillion, 8.43);
  assert.ok(faac.rows.length > 0);
  assert.match(faac.source.publisher, /Agora/);
  const snap = await tools.getFiscalSnapshot.execute({ year: 2026 });
  assert.ok(snap.projects.length > 0);
  assert.ok(snap.indicators.length > 0);
  assert.equal(snap.signedNaira, 68320000000000);
  const citizen = createTools("citizen");
  assert.equal(typeof citizen.getBudget.execute, "function");
  assert.equal(citizen.checkProject, undefined);
  assert.equal(citizen.runSimulation, undefined);
});

test("a project with no budget names the 2026 federal assumption", () => {
  const answer = answerQuestion({ message: "₦50m for a project", role: "government" });
  const text = textOf(answer);
  assert.match(text, /68\.32tn/);
  assert.match(text, /BusinessDay/);
  assert.match(text, /17 Apr 2026/);
  assert.match(text, /0\.000073%/);
  assert.match(text, /Tell me your agency's budget/);
  assert.match(text, /smaller/);
  assert.doesNotMatch(text, /Which budget is this coming from/);
  assert.equal(answer.work[0].inputs[0].label, "Assumed budget");
  assert.equal(answer.work[0].inputs[0].assumed, true);
  assert.equal(answer.context.budgetSource, "assumed");
  assert.equal(answer.alternatives.length, 0);
  const road = answerQuestion({
    message: "We want to allocate ₦50m to a new road project.",
    role: "government",
  });
  assert.match(textOf(road), /32\.2tn/);
  assert.match(textOf(road), /capital/);
  assert.match(textOf(road), /bigger/);
});

test("a typed agency budget is checked, and a follow-up keeps it", async () => {
  const answer = answerQuestion({ message: DEMO, role: "government" });
  const text = textOf(answer);
  assert.match(text, /₦50m is 12\.5% of ₦400m/);
  assert.match(text, /leaves ₦350m/);
  assert.match(text, /You entered/);
  assert.doesNotMatch(text, /68\.32|54\.99|Which budget/);
  assert.equal(answer.alternatives.length, 4);
  assert.equal(answer.alternatives.find((item) => item.best).id, "phase");
  assert.ok(answer.links.some((link) => link.label === "Open in What-if tests"));
  const follow = answerQuestion({
    message: "what about ₦30m instead?",
    role: "government",
    context: answer.context,
  });
  assert.match(textOf(follow), /₦30m is 7\.5% of ₦400m/);
  assert.doesNotMatch(textOf(follow), /68\.32/);
  const fromHistory = checkProjectRequest({
    message: "what about ₦30m instead?",
    role: "government",
    history: [{ role: "user", text: DEMO }],
  });
  assert.match(textOf(fromHistory), /₦30m is 7\.5% of ₦400m/);
  const assumed = answerQuestion({ message: "₦50m for a project", role: "government" });
  const replaced = answerQuestion({
    message: "Our budget is ₦400m",
    role: "government",
    context: assumed.context,
  });
  assert.match(textOf(replaced), /12\.5%/);
  assert.doesNotMatch(textOf(replaced), /68\.32/);
  let called = false;
  const live = await answerChat({ message: DEMO }, {
    role: "government",
    forceAi: true,
    generate: async () => {
      called = true;
      return "no";
    },
  });
  assert.equal(called, false);
  assert.match(textOf(live), /12\.5%/);
  const untouched = checkProjectRequest({
    message: "₦50m for a project",
    role: "government",
    page: { path: "/budget", annualBudgetNaira: 100000000000, useBudget: false },
  });
  assert.match(textOf(untouched), /68\.32tn/);
  const linked = checkProjectRequest({
    message: "₦50m for a project",
    role: "government",
    page: { path: "/budget", annualBudgetNaira: 400000000, useBudget: true },
  });
  assert.match(textOf(linked), /₦400m/);
  assert.doesNotMatch(textOf(linked), /68\.32/);
});

test("guardrails return four alternatives and a missing sector list is replaced", () => {
  const warn = checkProjectRequest({
    message: "Our budget is ₦1bn. Allocate ₦180m to one project.",
    role: "government",
  });
  assert.match(textOf(warn), /18%/);
  assert.equal(warn.alternatives.length, 4);
  assert.deepEqual(warn.alternatives.find((item) => item.id === "phase").years, [100000000, 80000000]);
  assert.equal(warn.alternatives.find((item) => item.id === "cap").gapNaira, 80000000);
  assert.equal(warn.alternatives.find((item) => item.best).id, "phase");
  const blocked = checkProjectRequest({
    message: "Our budget is ₦1bn. Allocate ₦500m to one project.",
    role: "government",
  });
  assert.match(textOf(blocked), /50%/);
  assert.match(textOf(blocked), /blocked/);
  assert.equal(blocked.alternatives.length, 4);
  const review = explainGuardrails(
    {
      annualBudgetNaira: 5_000_000_000_000,
      envelopeNaira: 5_000_000_000_000,
      allocations: allocateBudget(5_000_000_000_000).allocations,
      borrowingNaira: 0,
    },
    { igrNaira: 1_000_000_000_000, faacNaira: null },
  );
  assert.match(review.warnings.join(" "), /more than the funds/);
  assert.equal(review.alternatives.length, 4);
  const filled = fillPlan({
    annualBudgetNaira: 1_000_000_000,
    allocations: { education: 100 },
    inflation: 0,
    years: 5,
    startYear: 2026,
    delivery: 80,
    maintenance: 10,
    budgetGrowth: 0,
    revenueGrowth: 0,
  });
  assert.match(filled.assumptions.join(" "), /missing/);
  assert.notEqual(filled.input.allocations.education, 100);
  assert.equal(Object.keys(filled.input.allocations).length, 6);
});

test("rule-based percent, allocation, projection, tax and citizen limits", () => {
  const percent = answerQuestion({ message: "We need 10% of the 2025 annual budget", role: "government" });
  assert.match(textOf(percent), /₦5\.499tn/);
  assert.match(textOf(percent), /₦5,499,000,000,000/);
  const split = answerQuestion({ message: "allocate ₦500bn across sectors balanced", role: "government" });
  assert.match(textOf(split), /₦500bn/);
  assert.match(textOf(split), /Education/);
  assert.equal(split.links[0].label, "Plan a budget");
  const projected = answerQuestion({
    message: "Project the 2025 federal budget over 5 years",
    role: "government",
  });
  assert.match(textOf(projected), /Over 5 years/);
  assert.match(textOf(projected), /Inflation is/);
  const tax = answerQuestion({ message: "What if Lagos tax collections were 10% lower", role: "government" });
  assert.match(textOf(tax), /Lagos/);
  assert.match(textOf(tax), /10% lower/);
  assert.match(tax.work[0].formula, /published tax kobo/);
  const citizen = answerQuestion({ message: "allocate ₦500bn across sectors", role: "citizen" });
  assert.match(textOf(citizen), /cannot/);
  const project = answerQuestion({ message: "₦50m for a project", role: "citizen" });
  assert.match(textOf(project), /government seat/);
});

test("the number check is unit-aware and keeps years and typed figures", async () => {
  const wrong = groundReply("The budget is 54.99bn.", [{ display: "₦54.99tn", naira: 54990000000000 }]);
  assert.equal(wrong.flagged, true);
  assert.equal(wrong.text.includes("54.99"), false);
  assert.match(wrong.text, /not in the tool results/);
  assert.equal(groundReply("The budget is ₦54.99tn.", [{ display: "₦54.99tn" }]).flagged, false);
  assert.equal(groundReply("The budget is ₦5.499tn.", [{ naira: 5499000000000 }]).flagged, false);
  assert.equal(groundReply("The budget is ₦5,499,000,000,000.", [{ display: "₦5.499tn" }]).flagged, false);
  assert.equal(groundReply("That is fifty million.", [{ naira: 50000000 }]).flagged, false);
  assert.equal(groundReply("That is ₦50m.", [], "fifty million").flagged, false);
  assert.equal(groundReply("You typed 400.", [], "Our budget is 400").flagged, false);
  const year = groundReply("The rank is 1. The year is 2024.", [{ rank: 1 }]);
  assert.match(year.text, /rank is 1/);
  assert.equal(year.text.includes("2024"), false);
  assert.equal(groundReply("The year is 2024.", [{ rank: 1 }], "Please use 2024").flagged, false);
  assert.equal(groundReply("The year is 2025.", [{ year: 2025 }]).flagged, false);
  assert.equal(groundReply("The year is 2025.", [{ rank: 2025 }]).flagged, true);
  assert.equal(groundReply("That is 100 kobo.", [{ naira: 1 }]).flagged, false);
  const seen = {};
  await advise({
    message: "What changed?",
    role: "citizen",
    history: [
      { role: "user", text: "Lagos revenue was discussed" },
      { role: "advisor", text: "Lagos leads.", work: [{ formula: "published total" }] },
    ],
    page: { path: "/budget", annualBudgetNaira: 100000000000, useBudget: false },
    generate: async (input) => {
      seen.prompt = input.message;
      seen.history = input.history;
      seen.page = input.page;
      return "No new figure.";
    },
  });
  assert.match(seen.prompt, /Recent conversation/);
  assert.match(seen.prompt, /Lagos revenue was discussed/);
  assert.equal(seen.history.length, 2);
  assert.equal(seen.page.useBudget, false);
  assert.match(seen.prompt, /Page settings/);
});
