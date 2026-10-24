import { SECTORS } from "./constants.mjs";
import {
  GUARDRAILS,
  projectWarnPercent,
  reviewAffordability,
  reviewPlan,
  reviewProject,
  reviewSectors,
  sharePercent,
} from "./guardrails.mjs";
import { describeNaira, largestRemainder } from "./money.mjs";
import { scenarioPageHref } from "./plan-links.mjs";

function capAmount(total, percent) {
  return Number((BigInt(total) * BigInt(Math.round(percent * 100))) / 10000n);
}

function phaseAmounts(total, cap) {
  if (cap <= 0) return [total];
  const amounts = [];
  let left = total;
  while (left > 0 && amounts.length < 40) {
    const year = left > cap ? cap : left;
    amounts.push(year);
    left -= year;
  }
  return amounts;
}

function show(naira) {
  return describeNaira(naira).short;
}

function linkFor(config, extra) {
  return scenarioPageHref({ ...config, annualBudgetNaira: config.budgetNaira, ...extra });
}

function countBreaches({ budget, projectNaira, allocations }) {
  let count = 0;
  if (projectNaira != null && sharePercent(projectNaira, budget) > projectWarnPercent()) count += 1;
  if (projectNaira != null && sharePercent(projectNaira, budget) > GUARDRAILS.projectCap.blockAbovePercent) {
    count += 1;
  }
  count += reviewSectors(allocations).length;
  return count;
}

function balanced(total) {
  const keys = Object.keys(SECTORS);
  const shares = largestRemainder(total, keys.map(() => 1));
  return Object.fromEntries(keys.map((key, index) => [key, shares[index]]));
}

function cutForProject(budget, project) {
  const keys = Object.keys(SECTORS);
  const base = balanced(budget);
  const next = { ...base };
  const cuts = Object.fromEntries(keys.map((key) => [key, 0]));
  const order = [...keys].sort((a, b) => {
    const room = (key) => base[key] - capAmount(budget, GUARDRAILS.sectorUsualPercent[key][0]);
    return room(b) - room(a) || a.localeCompare(b);
  });
  let need = project;
  for (const key of order) {
    if (need <= 0) break;
    const floor = capAmount(budget, GUARDRAILS.sectorUsualPercent[key][0]);
    const room = Math.max(0, next[key] - floor);
    const cut = Math.min(room, need);
    cuts[key] += cut;
    next[key] -= cut;
    need -= cut;
  }
  if (need > 0) {
    const again = [...keys].sort((a, b) => next[b] - next[a] || a.localeCompare(b));
    for (const key of again) {
      if (need <= 0) break;
      const cut = Math.min(next[key], need);
      cuts[key] += cut;
      next[key] -= cut;
      need -= cut;
    }
  }
  const pool = Object.values(next).reduce((sum, value) => sum + value, 0);
  const changes = keys
    .filter((key) => cuts[key] > 0)
    .map((key) => {
      const [min, max] = GUARDRAILS.sectorUsualPercent[key];
      const share = sharePercent(next[key], pool || budget);
      return {
        key,
        label: SECTORS[key],
        cutNaira: cuts[key],
        nextNaira: next[key],
        belowUsual: share < min || share > max,
        share,
      };
    });
  return { allocations: next, changes };
}

function markBest(options) {
  if (!options.length) return [];
  const best = [...options].sort((a, b) => a.breaches - b.breaches || Number(b.deliversFull) - Number(a.deliversFull) || a.order - b.order)[0];
  return options.map((item) => ({ ...item, best: item.id === best.id }));
}

export function projectAlternatives(budget, project, config = {}) {
  const warnAt = projectWarnPercent();
  const limit = capAmount(budget, warnAt);
  const years = phaseAmounts(project, limit);
  const gap = Math.max(0, project - limit);
  const rebalance = cutForProject(budget, project);
  const base = {
    budgetNaira: budget,
    scope: config.scope || "all",
    years: years.length > 5 ? 10 : 5,
    startYear: config.startYear || 2026,
  };
  const cutText = rebalance.changes
    .map(
      (change) =>
        `${change.label} down ${show(change.cutNaira)} to ${show(change.nextNaira)}, ${change.belowUsual ? "which drops outside the usual range" : "still inside the usual range"}`,
    )
    .join("; ");
  const options = [
    {
      id: "phase",
      order: 1,
      title: `Phase it over ${years.length} ${years.length === 1 ? "year" : "years"}`,
      summary: years.map((amount, index) => `Year ${index + 1} ${show(amount)}`).join(", "),
      tradeoff: `The work takes ${years.length} ${years.length === 1 ? "year" : "years"}, but no year is above the ${warnAt}% cap.`,
      years,
      capNaira: limit,
      deliversFull: true,
      breaches: countBreaches({ budget, projectNaira: Math.max(...years), allocations: balanced(budget) }),
      href: linkFor(base, { projectNaira: years[0], option: "phase", phase: years.join(",") }),
    },
    {
      id: "cap",
      order: 2,
      title: "Cap this budget line and name the gap",
      summary: `Fund ${show(limit)} now. Gap ${show(gap)}.`,
      tradeoff: `You fund ${show(limit)} from this budget. ${show(gap)} still has to come from borrowing, a PPP, or federal funds.`,
      fundedNaira: limit,
      gapNaira: gap,
      deliversFull: gap === 0,
      breaches: countBreaches({ budget, projectNaira: limit, allocations: balanced(budget) }),
      href: linkFor(base, { projectNaira: limit, option: "cap", gapNaira: gap }),
    },
    {
      id: "reduce",
      order: 3,
      title: "Shrink the first phase to the cap",
      summary: `First phase ${show(limit)}. ${show(gap)} waits.`,
      tradeoff: `The first phase is ${show(limit)}. ${show(gap)} of the project waits.`,
      phaseNaira: limit,
      gapNaira: gap,
      deliversFull: gap === 0,
      breaches: countBreaches({ budget, projectNaira: limit, allocations: balanced(budget) }),
      href: linkFor(base, { projectNaira: limit, option: "reduce", gapNaira: gap }),
    },
    {
      id: "rebalance",
      order: 4,
      title: "Fund it by cutting other sectors",
      summary: cutText || "No sector cut was needed.",
      tradeoff: `${cutText || "Nothing to cut"}. The project itself is still ${sharePercent(project, budget)}% of the budget.`,
      changes: rebalance.changes,
      allocations: rebalance.allocations,
      deliversFull: true,
      breaches: countBreaches({ budget, projectNaira: project, allocations: rebalance.allocations }),
      href: linkFor(base, { projectNaira: project, allocations: rebalance.allocations, option: "rebalance" }),
    },
  ];
  return markBest(options);
}

export function bestReason(alternatives, budget, project) {
  const best = alternatives.find((item) => item.best);
  if (!best) return "";
  const warnAt = projectWarnPercent();
  const share = project ? sharePercent(project, budget) : null;
  return `${best.title} is the best fit because it breaks ${best.breaches} guardrail${best.breaches === 1 ? "" : "s"}. ${best.tradeoff} ${share != null ? `The ask itself is ${share}% of ${show(budget)}, against a ${warnAt}% cap.` : ""} The official decides.`.replace(/\s+/g, " ").trim();
}

export function explainProject(budgetNaira, projectNaira, config = {}) {
  if (!Number.isSafeInteger(budgetNaira) || !Number.isSafeInteger(projectNaira) || projectNaira > budgetNaira) {
    return {
      ask: "That project amount has to be a real share of the budget, not more than the whole budget.",
      alternatives: [],
      warnings: [],
    };
  }
  const review = reviewProject({ budgetNaira, projectNaira, override: config.overrideProjectCap === true });
  const alternatives = review.warnings.length ? projectAlternatives(budgetNaira, projectNaira, config) : [];
  return {
    ...review,
    share: sharePercent(projectNaira, budgetNaira),
    remaining: budgetNaira - projectNaira,
    alternatives,
    bestReason: bestReason(alternatives, budgetNaira, projectNaira),
  };
}

export function explainGuardrails(config, funds = {}) {
  const review = reviewPlan(config, funds);
  const envelope = config.envelopeNaira ?? config.annualBudgetNaira;
  let alternatives = [];
  if (config.projectNaira && review.warnings.some((line) => /one project/i.test(line))) {
    alternatives = projectAlternatives(envelope, config.projectNaira, config);
  } else if (review.warnings.some((line) => /more than the funds/i.test(line))) {
    const available =
      Math.round(funds.igrNaira || 0) + (funds.faacNaira || 0) + (config.borrowingNaira || 0);
    const limit = Math.max(0, available);
    const gap = envelope - limit;
    const years = phaseAmounts(envelope, limit || envelope);
    alternatives = markBest([
      {
        id: "phase",
        order: 1,
        title: `Phase the spend over ${years.length} years`,
        summary: years.slice(0, 4).map((amount, index) => `Year ${index + 1} ${show(amount)}`).join(", "),
        tradeoff: "Each year stays within the funds you can name. The work takes longer.",
        years,
        deliversFull: true,
        breaches: 0,
        href: scenarioPageHref({ ...config, option: "phase", phase: years.join(","), years: years.length > 5 ? 10 : 5 }),
      },
      {
        id: "cap",
        order: 2,
        title: "Cap the plan at the funds you can name",
        summary: `Fund ${show(limit)}. Gap ${show(Math.max(0, gap))}.`,
        tradeoff: `${show(Math.max(0, gap))} still has to come from borrowing, a PPP, or federal funds.`,
        gapNaira: Math.max(0, gap),
        fundedNaira: limit,
        deliversFull: gap <= 0,
        breaches: 0,
        href: scenarioPageHref({ ...config, annualBudgetNaira: limit || envelope, option: "cap", gapNaira: Math.max(0, gap) }),
      },
      {
        id: "reduce",
        order: 3,
        title: "Do a first phase that fits",
        summary: `First phase ${show(limit || envelope)}.`,
        tradeoff: "A smaller first phase fits the named funds. The rest waits.",
        phaseNaira: limit,
        deliversFull: false,
        breaches: 0,
        href: scenarioPageHref({ ...config, annualBudgetNaira: limit || envelope, option: "reduce" }),
      },
      {
        id: "rebalance",
        order: 4,
        title: "Cut the sector split down to the named funds",
        summary: `Split ${show(limit || envelope)} instead of ${show(envelope)}.`,
        tradeoff: "Every sector gets less. Check whether any share falls out of its usual range.",
        deliversFull: false,
        breaches: reviewSectors(config.allocations).length,
        href: scenarioPageHref({ ...config, annualBudgetNaira: limit || envelope, option: "rebalance" }),
      },
    ]);
  }
  return { ...review, alternatives, bestReason: bestReason(alternatives, envelope, config.projectNaira) };
}

export function affordGap(spendNaira, funds = {}, borrowingNaira = 0) {
  return reviewAffordability({
    spendNaira,
    igrNaira: funds.igrNaira ?? 0,
    faacNaira: funds.faacNaira ?? null,
    borrowingNaira,
  });
}
