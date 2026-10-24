import test from "node:test";
import assert from "node:assert/strict";
import { parseNairaToKobo, koboToNaira, formatNaira, formatNairaCompact } from "../lib/intelligence/money";
import { evaluateProjectRisk, computeUrgencyScore } from "../lib/intelligence/risk";
import { matchProjects, checkDiscrepancies } from "../lib/intelligence/matcher";
import { runBudgetAllocation } from "../lib/intelligence/engine";
import { analyzeDecisionQuery } from "../lib/intelligence/ai-grounding";
import { listProjects, getDecisionsOverview, getProjectById, getDataHealthSummary } from "../lib/intelligence/queries";
import type { GovernmentProject } from "../lib/intelligence/types";

test("monetary parser and formatter performs exact BigInt kobo arithmetic", () => {
  const kobo1 = parseNairaToKobo("550,287,577.87");
  assert.equal(kobo1, BigInt(55028757787));
  assert.equal(formatNaira(kobo1), "₦550,287,577.87");

  const kobo2 = parseNairaToKobo("100bn");
  assert.equal(kobo2, BigInt(10000000000000));
  assert.equal(formatNairaCompact(kobo2), "₦100.00bn");

  assert.equal(parseNairaToKobo(null), BigInt(0));
  assert.equal(koboToNaira(BigInt(10000)), 100);
});

test("project risk engine infers explainable risk indicators without false abandonment", () => {
  const ongoingHealthy = evaluateProjectRisk({
    status: "Ongoing",
    progressPercent: 75,
    contractSumKobo: BigInt(1000000000),
    expendedKobo: BigInt(700000000),
    expectedCompletionDate: "2028-12-31",
  });
  assert.equal(ongoingHealthy.riskLevel, "Low");
  assert.equal(ongoingHealthy.riskIndicators.length, 0);

  const delayed = evaluateProjectRisk({
    status: "Ongoing",
    progressPercent: 40,
    contractSumKobo: BigInt(1000000000),
    expendedKobo: BigInt(400000000),
    expectedCompletionDate: "2023-01-01",
  });
  assert.equal(delayed.riskLevel, "Medium");
  assert.equal(delayed.riskIndicators[0].code, "SCHEDULE_DELAY");

  const fundingDiscrepancy = evaluateProjectRisk({
    status: "Ongoing",
    progressPercent: 10,
    contractSumKobo: BigInt(1000000000),
    expendedKobo: BigInt(800000000),
  });
  assert.equal(fundingDiscrepancy.riskLevel, "High");
  assert.equal(fundingDiscrepancy.riskIndicators[0].code, "FUNDING_GAP");

  const stalled = evaluateProjectRisk({
    status: "Stalled",
    progressPercent: 30,
    contractSumKobo: BigInt(1000000000),
    expendedKobo: BigInt(300000000),
  });
  assert.equal(stalled.riskLevel, "High");
  assert.equal(stalled.riskIndicators[0].code, "STALLED_PROGRESS");
});

test("project matcher uses deterministic matching and catches source discrepancies", () => {
  const existing: GovernmentProject[] = [
    {
      id: "gp-pjt-1",
      canonicalId: "LAGOS-PMR-PJT-100",
      name: "Rehabilitation of Broad Street",
      description: "Drainage works",
      state: "Lagos",
      lga: "Lagos Island",
      agency: "Ministry of Works",
      sector: "Infrastructure & Works",
      status: "Ongoing",
      progressPercent: 60,
      contractSumKobo: BigInt(50000000000),
      expendedKobo: BigInt(30000000000),
      startDate: "2023-01-01",
      expectedCompletionDate: null,
      actualCompletionDate: null,
      riskLevel: "Low",
      riskIndicators: [],
      sourceCount: 1,
      lastVerifiedAt: "2026-01-01",
      createdAt: "2026-01-01",
      updatedAt: "2026-01-01",
    },
  ];

  const match1 = matchProjects(
    { canonicalId: "LAGOS-PMR-PJT-100", name: "Any title", lga: "Ikeja", agency: "Other" },
    existing,
  );
  assert.equal(match1.matchType, "exact_id");
  assert.equal(match1.matchedProject?.id, "gp-pjt-1");

  const match2 = matchProjects(
    { canonicalId: "OTHER-ID", name: "Rehabilitation of Broad Street", lga: "Lagos Island", agency: "Ministry of Works" },
    existing,
  );
  assert.equal(match2.matchType, "normalized_attribute");

  const discrepancy = checkDiscrepancies(existing[0], {
    publisher: "BudgIT Tracka",
    status: "Stalled",
    progress: 20,
  });
  assert.ok(discrepancy);
  assert.equal(discrepancy.conflicting, true);
});

test("budget allocation engine never exceeds available envelope and obeys policy weights", () => {
  const dummyProjects: GovernmentProject[] = [
    {
      id: "p1",
      canonicalId: "TEST-1",
      name: "General Hospital Ward Upgrade",
      description: "Health sector expansion",
      state: "Lagos",
      lga: "Ikorodu",
      agency: "Ministry of Health",
      sector: "Healthcare",
      status: "Ongoing",
      progressPercent: 70,
      contractSumKobo: BigInt(200000000000), // ₦2bn
      expendedKobo: BigInt(140000000000),
      startDate: null,
      expectedCompletionDate: null,
      actualCompletionDate: null,
      riskLevel: "Low",
      riskIndicators: [],
      sourceCount: 1,
      lastVerifiedAt: "2026-01-01",
      createdAt: "2026-01-01",
      updatedAt: "2026-01-01",
    },
    {
      id: "p2",
      canonicalId: "TEST-2",
      name: "Primary School Renovation",
      description: "Classrooms",
      state: "Lagos",
      lga: "Badagry",
      agency: "Ministry of Education",
      sector: "Education",
      status: "Stalled",
      progressPercent: 30,
      contractSumKobo: BigInt(100000000000), // ₦1bn
      expendedKobo: BigInt(30000000000),
      startDate: null,
      expectedCompletionDate: null,
      actualCompletionDate: null,
      riskLevel: "High",
      riskIndicators: [],
      sourceCount: 1,
      lastVerifiedAt: "2026-01-01",
      createdAt: "2026-01-01",
      updatedAt: "2026-01-01",
    },
  ];

  const proposedBudget = BigInt(100000000000); // ₦1bn envelope
  const allocation = runBudgetAllocation(dummyProjects, {
    proposedBudgetKobo: proposedBudget,
    priorityWeights: { completeExisting: 50, essentialServices: 30, geographicEquity: 10, economicGrowth: 10 },
  });

  assert.ok(allocation.totalAllocatedKobo <= proposedBudget);
  assert.equal(allocation.totalAllocatedKobo + allocation.unallocatedKobo, proposedBudget);
  assert.ok(allocation.recommendedProjects.length > 0);
});

test("database repository queries return real indexed projects and overview", async () => {
  const overview = await getDecisionsOverview();
  assert.ok(typeof overview.totalProjects === "number");
  assert.ok(overview.totalProjects > 0);

  const { projects, total } = await listProjects({ limit: 10 });
  assert.ok(total > 0);
  assert.ok(projects.length > 0);

  const first = projects[0];
  const detail = await getProjectById(first.id);
  assert.ok(detail);
  assert.equal(detail.project.id, first.id);
  assert.ok(detail.sources.length >= 1);

  const health = await getDataHealthSummary();
  assert.ok(Array.isArray(health.sources));
});

test("grounded decision query returns answers with citations and facts", async () => {
  const res = await analyzeDecisionQuery({
    question: "Which unfinished projects in Lagos should receive funding first?",
  });
  assert.ok(res.answer.length > 0);
  assert.ok(res.citations.length > 0);
  assert.ok(res.verifiedFacts.length > 0);
  assert.ok(res.recommendations.length > 0);
});
