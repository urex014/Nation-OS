/** Supported-intent analysis only: facts come from the catalog, while plan outputs come from deterministic code. This is not an LLM. */
import { sectorWords, targetsFor } from "./analysis-intents.mjs";
import {
  states,
  planningStates,
  sources,
  computeProposal,
  commerceData,
  comparisonData,
} from "./knowledge.mjs";
import planning from "./domain/planning-engine.cjs";
import economy from "./domain/economy-engine.cjs";
const { definitions } = planning,
  { baseline, stateAccounts } = economy;
const accounts = stateAccounts(states);
const source = (id) => sources.find((s) => s.id === id);
const fmt = (n, d = 1) => Number(n).toLocaleString("en-GB", { maximumFractionDigits: d });
export function localAnalyze({ question, scope = "all" }) {
  const text = question.toLowerCase();
  const targets = targetsFor(question, scope, states),
    sectorKeys = Object.keys(sectorWords).filter((k) => sectorWords[k].test(text)),
    findings = [],
    used = new Map(),
    gaps = [],
    assumptions = [
      "All figures describe fictional Aderin; they are not evidence about a real country.",
    ];
  const add = (content, ids) => {
    ids.forEach((id) => {
      const s = source(id);
      if (s) used.set(id, s);
    });
    findings.push({ text: content, sourceIds: ids });
  };
  const requestPlan =
      /\b(plan|proposal|propose|recommend|invest|allocate|intervention|strategy|improve|solve)\b/i.test(
        text,
      ),
    economic =
      /\b(gdp|economy|economic|budget|revenue|debt|inflation|unemployment|trade|exports?|imports?)\b/i.test(
        text,
      ),
    resource = /\b(resources?|oil|gas|minerals?|forests?|limestone|iron)\b/i.test(text),
    comparison =
      /\b(compare|comparison|which|lowest|highest|worst|best|largest|biggest|rank)\b/i.test(text);
  const financial =
    /\b(business|businesses|bussiness|companies|firms?|banks?|banking|money|currency|cash|deposits?|circulation)\b/i.test(
      text,
    );
  const overallComparison =
    comparison && sectorKeys.length === 0 && !economic && !financial && !resource;
  if (overallComparison) {
    if (targets.length)
      targets
        .slice(0, 3)
        .forEach((s) => add(source(`COMPARE-${s.id}`).summary, [`COMPARE-${s.id}`]));
    else add(source("COMPARISON").summary, ["COMPARISON"]);
    gaps.push(
      "A higher service score does not establish why a state performs better. Verify geography, rural access, income, historical investment and service quality before transferring a peer policy.",
    );
  }
  if (/\b(business|businesses|bussiness|companies|firms?)\b/i.test(text)) {
    if (targets.length)
      targets
        .slice(0, 3)
        .forEach((s) => add(source(`BUSINESS-${s.id}`).summary, [`BUSINESS-${s.id}`]));
    else add(source("BUSINESSES").summary, ["BUSINESSES"]);
    gaps.push(
      "Business control is distinct from operating location. Registered turnover and employment are not national GDP or labour-market totals.",
    );
  }
  if (/\b(banks?|banking)\b/i.test(text)) add(source("BANKS").summary, ["BANKS"]);
  if (/\b(money|currency|cash|deposits?|circulation)\b/i.test(text)) {
    const f = commerceData.financial;
    add(
      `Public cash outside banks is A₦ ${fmt(f.currencyOutsideBanks)}M. Bank vault cash is A₦ ${fmt(f.vaultCash)}M; together they equal A₦ ${fmt(f.currencyIssued)}M currency issued. Included deposits total A₦ ${fmt(f.totalDeposits)}M. Demo narrow money is A₦ ${fmt(f.narrowMoney)}M and extended money is A₦ ${fmt(f.extendedMoney)}M; the latter already includes the former. These are national stocks, not annual GDP or government revenue.`,
      ["MONEY"],
    );
    if (targets.length)
      gaps.push(
        "No state-level currency circulation estimates are provided; monetary stocks are national only.",
      );
  }
  if (economic) {
    if (targets.length) {
      for (const s of targets.slice(0, 3)) {
        const a = accounts.states.find((r) => r.id === s.id);
        add(
          `${s.name}: GDP A₦ ${fmt(a.gdp)}M; revenue A₦ ${fmt(a.revenue)}M; annual spending A₦ ${fmt(a.spending)}M; deficit A₦ ${fmt(a.deficit)}M. This is a state account, not the national budget.`,
          [`STATE-${s.id}`],
        );
      }
    } else
      add(
        `National GDP is A₦ ${fmt(baseline.gdp)}M. Annual revenue is A₦ ${fmt(baseline.revenue)}M and spending is A₦ ${fmt(baseline.spending)}M, leaving a deficit of A₦ ${fmt(baseline.spending - baseline.revenue)}M. A₦ ${fmt(baseline.planningEnvelope)}M is reserved for new plans within that spending total.`,
        ["ECON-NATIONAL"],
      );
    gaps.push(
      "These synthetic accounts do not establish whether borrowing or a particular investment is fiscally sustainable.",
    );
  }
  if (resource) {
    const rows = sources.filter(
      (s) =>
        s.id.startsWith("RESOURCE-") &&
        (!targets.length || s.values.zones.some((z) => targets.some((t) => t.parentZone === z))),
    );
    for (const r of rows.slice(0, 4)) add(r.summary, [r.id]);
    gaps.push(
      "Resource records describe zones; they do not establish deposits, ownership or spendable revenue in an individual state.",
    );
  }
  const chosen = sectorKeys.length
    ? sectorKeys
    : !economic &&
        !resource &&
        !financial &&
        (/\b(priorit|service|decision|needs?|gap|develop|country|states?)\w*\b/i.test(text) ||
          requestPlan)
      ? Object.keys(definitions)
      : [];
  const candidates = (
    targets.length
      ? planningStates.filter((s) => targets.some((t) => t.id === s.id))
      : planningStates
  )
    .flatMap((s) =>
      chosen.map((k) => {
        const d = definitions[k],
          value = s.baselines[k],
          gap = Math.max(0, d.higher ? d.target - value : value - d.target);
        return {
          s,
          k,
          value,
          gap,
          score: (gap / (k === "transport" ? 90 : 100)) * Math.sqrt(s.population / 1e6),
        };
      }),
    )
    .sort((a, b) => b.score - a.score);
  if (chosen.length && !overallComparison) {
    if (comparison && !targets.length) {
      for (const k of chosen.slice(0, 3)) {
        const d = definitions[k],
          ranking = planningStates
            .map((s) => ({
              s,
              value: s.baselines[k],
              gap: Math.max(0, d.higher ? d.target - s.baselines[k] : s.baselines[k] - d.target),
            }))
            .sort((a, b) => b.gap - a.gap);
        add(
          `${d.name}: the largest target gaps are ${ranking
            .slice(0, 3)
            .map(
              (r) =>
                `${r.s.name}: ${r.value}${d.unit}, gap ${fmt(r.gap)} ${d.unit === "%" ? "percentage points" : "minutes"}`,
            )
            .join("; ")}. This ranks distance from the target, not intervention effectiveness.`,
          [`RANKING-${k}`],
        );
      }
    } else if (targets.length) {
      for (const c of candidates.slice(0, 5)) {
        const d = definitions[c.k];
        add(
          `${c.s.name}: ${d.metric.toLowerCase()} is ${c.value}${d.unit}, compared with a target of ${d.target}${d.unit}. The gap is ${fmt(c.gap)} ${d.unit === "%" ? "percentage points" : "minutes"}. ${c.gap > 0 ? "This flags a service need; it does not establish its cause." : "This target is met in the synthetic baseline; service quality still needs review."}`,
          [`${c.s.id}-${c.k}`],
        );
      }
    } else {
      for (const k of chosen.slice(0, 4)) {
        const d = definitions[k],
          r = source(`NATIONAL-${k}`);
        add(
          `Across Aderin, ${d.metric.toLowerCase()} is ${fmt(r.values.baseline)}${d.unit}; the illustrative target is ${d.target}${d.unit}. State averages can hide differences between communities.`,
          [r.id],
        );
      }
    }
    gaps.push(
      ...chosen
        .slice(0, 3)
        .map((k) =>
          k === "education"
            ? "Attendance does not measure learning. Teacher vacancies, classroom capacity and household barriers need investigation."
            : k === "transport"
              ? "Journey averages do not describe route reliability, fares or disability access."
              : k === "food"
                ? "Food pressure does not identify the cause of prices; crop, freight and household evidence is needed."
                : k === "health"
                  ? "Geographic care access does not establish staffing, medicine availability or treatment quality."
                  : k === "energy"
                    ? "Electricity access does not establish uptime, tariff affordability or grid capacity."
                    : "Water-point coverage does not establish water safety, continuity or collection time.",
        ),
    );
  }
  let proposal = null,
    modelResult = null;
  if (/\b(religion|christian|muslim|ethnic|ethnicity)\b/i.test(text))
    gaps.push(
      "Religion and ethnicity are not used to rank proposals or allocate benefits. This draft uses aggregate service needs and includes all residents in its selected scope.",
    );
  if (requestPlan && candidates.length) {
    const years = /\b(10|ten)[ -]?years?\b/i.test(text) ? 10 : 5,
      targetScope = targets.length === 1 ? targets[0].id : "all",
      keys = sectorKeys.length ? sectorKeys : [...new Set(candidates.slice(0, 3).map((c) => c.k))];
    const amountMatch =
      question.match(
        /(?:\b(?:budget|spend|invest|allocate)(?:\s+(?:of|is|up to|around|about|a|an))*\s*(?:A₦|ADN|₦)?\s*)([\d,]+(?:\.\d+)?)\s*(billion|million|b|m)?\b/i,
      ) || question.match(/\b([\d,]+(?:\.\d+)?)\s*(billion|million)\b/i);
    let annual = amountMatch
      ? Number(amountMatch[1].replaceAll(",", "")) *
        (/^(b|billion)$/i.test(amountMatch[2] || "") ? 1000 : 1)
      : targetScope === "all"
        ? 900
        : 100;
    const totalBudget = /\b(total|entire|whole)[ -]?(plan |programme )?budget\b/i.test(text);
    if (totalBudget && amountMatch) annual /= years;
    if (!Number.isFinite(annual) || annual <= 0 || annual > keys.length * 2000)
      gaps.push(
        "A draft was not created: the requested budget is outside the supported range of A₦ 0–2,000M annually per sector. Specify a smaller package.",
      );
    else {
      const budgets = Object.fromEntries(Object.keys(definitions).map((k) => [k, 0])),
        cents = Math.round(annual * 100),
        each = Math.floor(cents / keys.length);
      keys.forEach((k, i) => (budgets[k] = (each + (i < cents % keys.length ? 1 : 0)) / 100));
      const scopeLabel = targetScope === "all" ? "Aderin" : targets[0].name;
      proposal = {
        title:
          `${years}-year ${keys.map((k) => definitions[k].name.toLowerCase()).join(" and ")} plan for ${scopeLabel}`.slice(
            0,
            160,
          ),
        reason: `Draft based on synthetic target gaps in ${scopeLabel}. Annual budget A₦ ${fmt(annual, 2)}M is ${amountMatch ? "taken from the requested amount" : "an illustrative starting assumption"}. Validate local causes and delivery costs before approval.`,
        scope: targetScope,
        years,
        growth: 2,
        delivery: 80,
        maintenance: 20,
        budgets,
      };
      modelResult = computeProposal(proposal);
      add(
        `A ${years}-year draft uses A₦ ${fmt(modelResult.annualCost, 2)}M annually, or A₦ ${fmt(modelResult.totalCost, 2)}M over the full horizon. Its inputs are suggestions; the attached service and fiscal results are computed by the numerical models.`,
        ["METHOD"],
      );
      assumptions.push(
        `Draft defaults: 2% annual population growth, 80% delivery, 20% of the budget reserved for upkeep. ${amountMatch ? (totalBudget ? "The stated total budget was divided across the requested years." : "The stated amount was interpreted as an annual budget in millions of Aderin naira.") : "No amount was specified; the budget is a starting assumption."} Allocations across requested sectors are equal starting shares, not an optimized solution.`,
      );
    }
  }
  if (!findings.length) {
    add(
      "This local analyst supports country/state service indicators, comparisons, economic accounts, resources and five- or ten-year plan drafts. It cannot answer this question from the available records.",
      ["METHOD"],
    );
    gaps.push(
      "Try naming a sector and state, or use the optional live AI connection for broader wording. No unsupported answer was generated.",
    );
  }
  used.set("METHOD", source("METHOD"));
  return {
    question,
    scope,
    created: new Date().toISOString(),
    mode: "local",
    provider: "Local rules",
    model: null,
    engine: "aderin-local-analyst-v1",
    retrieval: "Intent matching and deterministic analysis of canonical aggregate data",
    summary: proposal
      ? "Draft prepared from the data. Review the cited evidence and model assumptions before making a decision."
      : "Automated analysis of the available synthetic records.",
    findings,
    gaps: [...new Set(gaps)],
    assumptions,
    proposal,
    modelResult,
    sources: [...used.values()],
  };
}
