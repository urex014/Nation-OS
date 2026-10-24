import { getDatabase } from "./database.mjs";
import {
  getIndicators,
  getJurisdictions,
  getRevenue,
  getRevenueHistory,
  getPlanningContext,
  getSources,
  requireScope,
} from "./repository.mjs";
import { projectPlan } from "./planning.mjs";
import { naira, number, indicatorValue } from "./format.mjs";
import { topics } from "./chat-topics.mjs";
import { budgetFallback } from "./chat-budget.mjs";

const fail = (message) => {
  throw Object.assign(Error(message), { status: 400 });
};
const normal = (text) =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

/** Deterministic data assistant: retrieve observations, calculate comparisons, expose gaps.
 * Context contains only validated topic/scope/year; no user text becomes SQL or instructions.
 */
export function answerQuestion(input) {
  if (typeof input.message !== "string" || !input.message.trim() || input.message.length > 2000)
    fail("Ask a question between 1 and 2,000 characters.");
  const q = normal(input.message),
    jurisdictions = getJurisdictions();
  const named = jurisdictions.filter(
    (s) =>
      new RegExp(`\\b${normal(s.name)}\\b`).test(q) ||
      (s.id === "NG-FC" && /\b(abuja|fct|federal capital territory)\b/.test(q)),
  );
  const previous = input.context || {};
  if (typeof previous !== "object" || Array.isArray(previous))
    fail("Invalid conversation context.");
  if (previous.scope != null) requireScope(previous.scope);
  if (
    previous.topic != null &&
    !["revenue", "plan", ...topics.map(([code]) => code)].includes(previous.topic)
  )
    fail("Invalid conversation topic.");
  const followup =
    /\b(what about|how about|and in|and for|it|that|then|same|why|changed|change|trend|since)\b/.test(
      q,
    ) || /^and\b/.test(q);
  const national = /\b(nigeria|national|country|all states|all jurisdictions)\b/.test(q);
  const scope = named[0]?.id || (national ? "all" : followup ? previous.scope || "all" : "all");
  const years = [...q.matchAll(/\b(20\d{2})\b/g)].map((m) => Number(m[1]));
  const year = years.at(-1) ?? (followup ? previous.year : null) ?? null;
  if (year !== null && (!Number.isInteger(year) || year < 2000 || year > 2100))
    fail("Invalid reporting year.");
  const matchedTopic = topics.find(([, pattern]) => pattern.test(q))?.[0];
  const revenueIntent =
    /\b(igr|revenue|tax|taxes|collect|collects|collections|richest|best|compare|ranking|rank|top|lowest|least|bottom)\b/.test(
      q,
    );
  const budgetIntent = /\b(budget|appropriation)\b/.test(q);
  const topic =
    matchedTopic || (revenueIntent ? "revenue" : !budgetIntent && followup ? previous.topic : null);
  const context = { scope, year, topic: topic || null };
  const special = budgetFallback(input.message, input.role === "government" ? "government" : "citizen", {
    context: previous,
    history: input.history,
    page: input.page,
  });
  function respond(paragraphs, sourceIds = [], extra = {}) {
    return {
      mode: "local-data",
      paragraphs,
      context,
      sources: getSources().filter((s) => sourceIds.includes(s.id)),
      ...extra,
    };
  }
  if (special) {
    return respond(special.paragraphs, special.sourceIds || [], {
      work: special.work || [],
      links: special.links || [],
      warnings: special.warnings || [],
      alternatives: special.alternatives || [],
      bestReason: special.bestReason || null,
      result: special.result,
      table: special.table,
      context: { ...context, ...(special.context || {}) },
    });
  }
  const horizonQuestion =
    /\b(next|coming|future|look|outlook)\b/.test(q) && /\b(5|10|five|ten) years?\b/.test(q);
  if (
    /\b(citizen|citizens|religion|banks|bank|businesses|money in circulation|transport|food prices|agriculture)\b/.test(
      q,
    ) &&
    !/\b(model|simulate|calculate|project)\b/.test(q) &&
    !horizonQuestion
  )
    return respond([
      "That dataset is not currently imported. I can use national indicators, state IGR and the approved federal budget, but I cannot invent person-level, business, banking, transport or food-price records. Sector investment assumptions remain available in the decision builder below.",
    ]);
  if (
    horizonQuestion ||
    (/\b(model|simulate|calculate|project)\b/.test(q) &&
      /\b(plan|investment|budget|draft)\b/.test(q))
  ) {
    if (!input.config)
      return respond([
        "Open the investment assumptions below, choose a budget and allocations, then ask me to model your current plan.",
      ]);
    // The chat never changes a budget based on an ambiguous natural-language instruction.
    const config = { ...input.config, scope: named[0]?.id || input.config.scope };
    const horizon = /\b(10|ten)\b/.test(q) ? 10 : /\b(5|five)\b/.test(q) ? 5 : config.years;
    const result = projectPlan({ ...config, years: horizon }, getPlanningContext(config.scope));
    return respond(
      [
        `Using your current assumptions for ${result.context.name}, the ${horizon}-year nominal investment is ${naira(result.totals.nominalNaira)}; its first-year purchasing-power equivalent is ${naira(result.totals.constantPriceNaira)}.`,
        "This is conditional budget arithmetic, not a prediction of jobs, GDP or service improvements. Edit the assumptions below to change the calculation. Use the planner to save a decision with your reasoning.",
      ],
      [result.context.sourceId],
      { result, context: { ...context, scope: config.scope, topic: "plan" } },
    );
  }
  if (topic && topic !== "revenue" && topic !== "plan") {
    const indicator = getIndicators().find((i) => i.code === topic);
    if (!indicator) fail("Unknown indicator topic.");
    if (scope !== "all" || /\b(states|which state)\b/.test(q))
      return respond(
        [
          `That ${indicator.label.toLowerCase()} figure is for Nigeria as a whole. I cannot report it for ${jurisdictions.find((s) => s.id === scope)?.name || "individual states"}, and I won't copy the national number onto a state.`,
          "Ask for Nigeria's figure, or ask about this state's IGR, which is available for every jurisdiction.",
        ],
        [indicator.sourceId],
      );
    const observed = year === null ? indicator : indicator.series.find((r) => r.year === year);
    if (!observed || observed.value == null)
      return respond(
        [
          `No ${indicator.label.toLowerCase()} observation is available for ${year ?? "the requested period"}. The latest available year is ${indicator.year}. I have not estimated a replacement.`,
        ],
        [indicator.sourceId],
      );
    const record = { ...indicator, ...observed };
    return respond(
      [
        `${indicator.label} in Nigeria: ${indicatorValue(record)} (${record.unit}), reporting year ${record.year}.`,
        indicator.note,
        ...(/\b(improve|recommend|should|why)\b/.test(q)
          ? [
              "This national observation identifies context, not the cause of a problem. Before choosing an intervention, collect local service gaps, costs and measured outcomes; the imported data cannot establish which policy will work best.",
            ]
          : []),
      ],
      [indicator.sourceId],
      { context: { ...context, topic } },
    );
  }
  if ((topic === "revenue" || named.length) && !budgetIntent) {
    // Historical trend questions use the requested years as endpoints, not an invented forecast.
    const trend = /\b(trend|since|history|changed|change|over time)\b/.test(q) || years.length > 1;
    const selectedYear = trend && years.length === 1 ? null : year;
    const available = getRevenue();
    if (selectedYear !== null && !available.years.includes(selectedYear))
      return respond(
        [
          `State IGR is available only for 2019–2025. There is no imported observation for ${selectedYear}.`,
        ],
        [available.sourceId],
      );
    const revenue = selectedYear === null ? available : getRevenue(selectedYear);
    const lowest = /\b(lowest|least|bottom)\b/.test(q);
    const ordered = lowest ? revenue.states.toReversed() : revenue.states;
    const rows =
      named.length > 1
        ? ordered.filter((s) => named.some((n) => n.id === s.id))
        : scope === "all"
          ? ordered.slice(0, 5)
          : revenue.states.filter((s) => s.id === scope);
    if (trend) {
      const history = getRevenueHistory(scope).filter(
        (r) =>
          (!years.length || r.year >= Math.min(...years)) &&
          (years.length < 2 || r.year <= Math.max(...years)),
      );
      if (!history.length)
        return respond(
          ["No state IGR observations match that period. Coverage is 2019–2025."],
          [revenue.sourceId],
        );
      const first = history[0],
        last = history.at(-1);
      if (named.length > 1) {
        const histories = named.map((state) => getRevenueHistory(state.id));
        return respond(
          [
            `Observed nominal IGR comparison, ${first.year}–${last.year}. Values are not adjusted for inflation or population.`,
            revenue.note,
          ],
          [revenue.sourceId],
          {
            table: {
              columns: ["Year", ...named.map((state) => state.name)],
              rows: history.map((row) => [
                String(row.year),
                ...histories.map((series) =>
                  naira(series.find((point) => point.year === row.year)?.totalNaira),
                ),
              ]),
            },
            context: { scope, year: last.year, topic: "revenue" },
          },
        );
      }
      return respond(
        [
          `${getPlanningContext(scope).name}: IGR was ${naira(first.totalNaira)} in ${first.year} and ${naira(last.totalNaira)} in ${last.year}.${history.length > 1 ? ` That is a ${number((last.totalNaira / first.totalNaira - 1) * 100)}% nominal change.` : " Only one observation matches."}`,
          revenue.note,
        ],
        [revenue.sourceId],
        {
          table: {
            columns: ["Year", "Observed IGR"],
            rows: history.map((r) => [String(r.year), naira(r.totalNaira)]),
          },
          context: { scope, year: last.year, topic: "revenue" },
        },
      );
    }
    const explanation =
      rows.length > 1
        ? `${rows[0].name} has the ${lowest ? "lowest" : "highest"} nominal IGR among the jurisdictions shown. This does not establish which state is governed best or explain the differences in collections.`
        : `${rows[0].name}'s collections represent ${number(rows[0].nationalSharePercent)}% of combined state and FCT IGR.`;
    return respond(
      [
        `NBS internally generated revenue, ${revenue.year}. ${explanation}`,
        revenue.note,
        ...(/\b(why|improve|recommend|should|best)\b/.test(q)
          ? [
              "To investigate improvements, compare tax-base coverage, compliance processes, collection costs and service outcomes. These are investigation steps, not proven explanations: those underlying measures are not in the import.",
            ]
          : []),
      ],
      [revenue.sourceId],
      {
        table: {
          columns: ["Jurisdiction", "IGR", "Rank / 37", "Annual nominal change"],
          rows: rows.map((s) => [
            s.name,
            naira(s.totalNaira),
            String(s.rank),
            s.growthPercent == null ? "Not reported" : `${number(s.growthPercent)}%`,
          ]),
        },
        context: { ...context, year: revenue.year, topic: "revenue" },
      },
    );
  }
  if (/\b(budget|appropriation)\b/.test(q)) {
    const budget = getDatabase()
      .prepare("select * from federal_budgets order by year desc limit 1")
      .get();
    if (scope !== "all" || (year !== null && year !== budget.year))
      return respond(
        [
          "Only the 2025 approved federal budget headline is imported. State budgets and other federal budget years are not available; IGR must not be substituted for a budget.",
        ],
        [budget.source_id],
      );
    return respond(
      [
        `Nigeria's approved ${budget.year} federal budget is ${naira(budget.approved_naira)}. This is an appropriation, not actual spending, and excludes any inference about available project funds.`,
      ],
      [budget.source_id],
    );
  }
  return respond([
    "I can look up national indicators, compare state IGR, explain historical revenue changes and model your current investment assumptions. Try “Compare Lagos and Rivers revenue” or “What does the data say about education?”.",
    "I use the imported SQLite observations and explicit calculations. I am a local, rule-based data assistant, not a connected language model. Questions about citizens, banks, state GDP or policy effects need datasets that are not currently provided.",
  ]);
}
