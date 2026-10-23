/** Build the canonical evidence catalog once from aggregate datasets. Source IDs must stay stable so saved reports can be traced. */
import { retrieveFrom } from "./retrieval.mjs";
import planning from "./domain/planning-engine.cjs";
import economy from "./domain/economy-engine.cjs";
import comparisonEngine from "./domain/comparison-engine.cjs";
import commerceEngine from "./domain/commerce-engine.cjs";
import data from "./country-data.mjs";
export const states = data.states;
export const planningStates = states.map((s, i) => ({
  id: s.id,
  name: s.name,
  population: s.citizenCount,
  baselines: {
    food: s.food,
    ...Object.fromEntries(Object.entries(data.sectors).map(([k, d]) => [k, d.baseline[i]])),
  },
}));
export const comparisonData = comparisonEngine.rank(
  planningStates.map((s, i) => ({ ...s, type: states[i].type, zone: states[i].zone })),
);
const accounts = economy.stateAccounts(states);
export const commerceData = commerceEngine.build(states);
export const sources = [];
const add = (id, title, summary, values = {}, scope = "all", sector = "general") =>
  sources.push({ id, title, summary, values, scope, sector, period: "2026-Q3", synthetic: true });
const ownershipCounts = commerceData.summary.reduce(
  (a, s) => ({
    domestic: a.domestic + s.domestic,
    foreign: a.foreign + s.foreign,
    joint: a.joint + s.joint,
  }),
  { domestic: 0, foreign: 0, joint: 0 },
);
add(
  "BUSINESSES",
  "National business ownership register",
  `Aderin's synthetic register contains 24,600 firms: ${ownershipCounts.domestic} domestic-controlled, ${ownershipCounts.foreign} foreign-controlled, ${ownershipCounts.joint} jointly controlled. Control means >50%, <50%, or exactly 50% domestic ownership. Operating state and market reach are separate fields. This register does not cover informal businesses or the entire labour market.`,
  { ...ownershipCounts, total: 24600 },
  "all",
  "business",
);
for (const s of commerceData.summary) {
  const state = states.find((r) => r.id === s.stateId);
  add(
    `BUSINESS-${s.stateId}`,
    `${state.name}: business register`,
    `${state.name}: ${s.businesses} registered firms, including ${s.domestic} domestic-controlled, ${s.foreign} foreign-controlled and ${s.joint} joint-control firms. Registered firm employees: ${s.employees}; this is not the state's total employment.`,
    s,
    s.stateId,
    "business",
  );
}
const monetary = commerceData.financial;
add(
  "MONEY",
  "National money in circulation",
  `National synthetic stocks (A₦ millions): currency issued ${monetary.currencyIssued}; bank vault cash ${monetary.vaultCash}; public cash outside banks ${monetary.currencyOutsideBanks}; overnight deposits ${monetary.overnightDeposits}; short-term deposits ${monetary.shortTermDeposits}; included deposits ${monetary.totalDeposits}; demo narrow money ${monetary.narrowMoney}; demo extended money ${monetary.extendedMoney}; central-bank reserve balances ${monetary.reservesAtCentralBank}. Public cash plus vault cash equals issued currency; narrow money includes public cash and overnight deposits; extended money includes narrow money and short-term deposits. These are national stocks, not state cash estimates or annual income.`,
  monetary,
  "all",
  "money",
);
add(
  "BANKS",
  "National bank register",
  `Eight fictional banks: five domestic-controlled, two foreign-controlled, one jointly controlled. Total included deposits A₦ 280,000M; total loans A₦ 210,000M. Loans, reserves and bank assets must not be added to public money measures.`,
  {
    banks: commerceData.banks.map((b) => ({
      id: b.id,
      name: b.name,
      ownership: b.ownership,
      deposits: b.deposits,
      loans: b.loans,
      branches: b.branches,
    })),
  },
  "all",
  "banking",
);
add(
  "COUNTRY",
  "Aderin country register",
  "Fictional Republic of Aderin: 24.6 million residents, 36 states, one capital territory and six administrative zones. Capital: Ayara.",
  { population: 24600000, states: 36, territories: 1 },
);
add(
  "ECON-NATIONAL",
  "National economic accounts",
  "National synthetic accounts: GDP A₦ 1,800,000M; revenue A₦ 270,000M; spending A₦ 315,000M; deficit A₦ 45,000M; debt A₦ 810,000M. Annual unallocated planning envelope: A₦ 3,000M. GDP growth 3%, inflation 8%, unemployment 12%.",
  economy.baseline,
);
add(
  "METHOD",
  "Evidence and model limitations",
  "All data is synthetic. Service models use uncalibrated illustrative rules, not causal forecasts. Religion is not a scoring, eligibility or allocation input. No individual citizen records are sent to the model. Baseline gaps do not establish why a problem occurs. No international effectiveness evidence is provided.",
  { modelVersion: "aderin-long-term-rules-v1", fiscalVersion: "aderin-fiscal-rules-v1" },
);
add(
  "COMPARISON",
  "Overall state comparisons: best service scores and why",
  `Highest overall synthetic service scores: ${comparisonData
    .slice(0, 3)
    .map((s) => `${s.name}: ${s.overall.toFixed(1)}/100`)
    .join(
      "; ",
    )}. The score equally weights food affordability, education, transport, healthcare, electricity and water. Attendance/access scores are baseline/target × 100, capped at 100; food pressure/journey scores are target/baseline × 100, capped at 100. GDP, population size and religion are excluded. A high score describes indicator performance, not governance quality or a proven cause. Ties share ranks.`,
  {
    weights: comparisonEngine.defaults,
    ranking: comparisonData.map((s) => ({
      id: s.id,
      name: s.name,
      rank: s.rank,
      score: s.overall,
      components: s.components,
    })),
    method: comparisonEngine.version,
  },
  "all",
  "comparison",
);
for (const s of comparisonData)
  add(
    `COMPARE-${s.id}`,
    `${s.name}: overall service comparison`,
    `${s.name} ranks ${s.rank} of 37 jurisdictions with a service score of ${s.overall.toFixed(1)}/100 under equal weights. Strongest target-attainment components: ${Object.keys(
      s.components,
    )
      .sort((a, b) => s.components[b] - s.components[a])
      .slice(0, 3)
      .map((k) => `${k} ${s.components[k].toFixed(1)}/100`)
      .join(", ")}. This explains score arithmetic, not causes.`,
    { rank: s.rank, score: s.overall, components: s.components, baselines: s.baselines },
    s.id,
    "comparison",
  );
for (const [key, d] of Object.entries(planning.definitions)) {
  const avg = planningStates.reduce((a, s) => a + s.baselines[key] * s.population, 0) / 24600000;
  add(
    `NATIONAL-${key}`,
    `National ${d.name} baseline`,
    `${d.metric}: ${avg.toFixed(2)}${d.unit}; illustrative target ${d.target}${d.unit}. Population-weighted synthetic state baseline; different indicators cover different populations.`,
    { baseline: avg, target: d.target, unit: d.unit },
    "all",
    key,
  );
}
for (const [i, s] of states.entries()) {
  const a = accounts.states[i];
  add(
    `STATE-${s.id}`,
    `${s.name}: economic and population record`,
    `${s.name}, ${s.zone}; population ${s.citizenCount.toLocaleString("en-GB")}; GDP A₦ ${a.gdp.toFixed(1)}M; state spending A₦ ${a.spending.toFixed(1)}M; revenue A₦ ${a.revenue.toFixed(1)}M; unemployment ${a.unemployment.toFixed(1)}%.`,
    {
      population: s.citizenCount,
      gdpMillions: a.gdp,
      revenueMillions: a.revenue,
      spendingMillions: a.spending,
      povertyPercent: s.poverty,
    },
    s.id,
  );
  for (const [key, d] of Object.entries(planning.definitions)) {
    const baseline = planningStates[i].baselines[key],
      gap = Math.max(0, d.higher ? d.target - baseline : baseline - d.target);
    add(
      `${s.id}-${key}`,
      `${s.name}: ${d.name}`,
      `${d.metric} in ${s.name}: ${baseline}${d.unit}; planning target ${d.target}${d.unit}; gap ${gap.toFixed(1)} ${d.unit === "%" ? "percentage points" : "minutes"}. ${key === "food" ? "Food-pressure share is a synthetic household proxy, not measured hunger prevalence." : data.sectors[key].gap}`,
      {
        baseline,
        target: d.target,
        gap,
        unit: d.unit,
        source: key === "food" ? "Synthetic household baseline" : data.sectors[key].source,
        interventions:
          key === "food"
            ? ["Freight repairs", "Storage", "Household support"]
            : data.sectors[key].actions.map((a) => a[0]),
      },
      s.id,
      key,
    );
  }
}
economy.resources.forEach((r, i) =>
  add(
    `RESOURCE-${i + 1}`,
    r.name,
    `${r.name}: ${r.stock}; ${r.output}. Locations: ${r.zones.map((z) => data.zones[z].name).join(", ")}. Risk: ${r.risk}. These are zone-level records, not deposits in every state.`,
    r,
    "all",
    "resources",
  ),
);
for (const [key, d] of Object.entries(planning.definitions)) {
  const ranking = planningStates
    .map((s) => ({
      id: s.id,
      name: s.name,
      baseline: s.baselines[key],
      gap: Math.max(0, d.higher ? d.target - s.baselines[key] : s.baselines[key] - d.target),
    }))
    .sort((a, b) => b.gap - a.gap);
  add(
    `RANKING-${key}`,
    `${d.name}: all-state comparison and service gaps`,
    `${d.metric}: largest gaps to the illustrative target are ${ranking
      .slice(0, 5)
      .map((r) => `${r.name} (${r.baseline}${d.unit}, gap ${r.gap.toFixed(1)})`)
      .join("; ")}. The complete ranking is in the record values.`,
    { ranking, target: d.target, unit: d.unit },
    "all",
    key,
  );
}
export const retrieve = (question, scope = "all") => retrieveFrom(sources, states, question, scope);
export function computeProposal(proposal) {
  const result = planning.project(planningStates, proposal);
  result.fiscal = economy.fiscalPlan(result.annualCost, proposal.years);
  return result;
}
