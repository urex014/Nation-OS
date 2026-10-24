import { pageSettings } from "../ai/history.mjs";
import { classifyAmounts, parseMoneyPhrases } from "./amounts.mjs";
import { bestReason, explainProject } from "./alternatives.mjs";
import { describeNaira } from "./money.mjs";
import { listBudgets } from "./ledger-read.mjs";
import { scenarioPageHref } from "./plan-links.mjs";

/** No state or agency budget is loaded. A federal figure is only an explicit last resort. */
export function agencyBudget() {
  return null;
}

function isProjectAsk(message) {
  if (/\b(sectors|across)\b/i.test(message) && !/\bproject\b/i.test(message)) return false;
  if (!parseMoneyPhrases(message).length) return false;
  return /\b(project|road)\b/i.test(message) || (/\ballocate\b/i.test(message) && /\bto\b/i.test(message));
}

function capitalQuestion(message) {
  return /\b(capital|road|bridge|infrastructure)\b/i.test(message);
}

function show(naira) {
  return describeNaira(naira).short;
}

function fineShare(part, whole) {
  if (!whole) return "0";
  const micro = Number((BigInt(part) * 100000000n) / BigInt(whole)) / 1e6;
  if (micro >= 0.01) return String(Math.round(micro * 100) / 100);
  return micro.toFixed(6);
}

function chooseBase(message, assumedKind) {
  const rows = listBudgets();
  if (assumedKind) {
    const kept = rows.find((row) => row.kind === assumedKind);
    if (kept) return kept;
  }
  if (capitalQuestion(message)) {
    const capital = rows.find((row) => row.kind === "capital");
    if (capital) return capital;
  }
  return rows.find((row) => row.kind === "signed") || rows.find((row) => row.kind === "approved") || null;
}

function remembered(context, history) {
  const turns = Array.isArray(history) ? history : [];
  for (let index = turns.length - 1; index >= 0; index -= 1) {
    const turn = turns[index];
    if (turn?.role && turn.role !== "user") continue;
    const found = classifyAmounts(turn?.text || "");
    if (found.budget && (found.project || /\bbudget\b/i.test(turn?.text || ""))) {
      return { budget: found.budget, project: found.project, source: "memory", assumedKind: null };
    }
  }
  if (context?.budgetNaira && context.budgetSource !== "assumed") {
    return {
      budget: context.budgetNaira,
      project: context.projectNaira || null,
      source: context.budgetSource === "agency" ? "agency" : "memory",
      assumedKind: null,
    };
  }
  if (context?.budgetNaira) {
    return {
      budget: context.budgetNaira,
      project: context.projectNaira || null,
      source: "assumed",
      assumedKind: context.assumedKind || null,
    };
  }
  return { budget: null, project: null, source: null, assumedKind: null };
}

function why(project, budget, share, remaining, hot, blocked) {
  const sentence = `${show(project)} is ${share}% of ${show(budget)}`;
  if (blocked) {
    return `${sentence}, above the 25% limit, so this is blocked unless you explicitly override. It would leave ${show(remaining)} for everything else.`;
  }
  if (hot) {
    return `${sentence}, above the 10% limit for one project, and leaves ${show(remaining)} for everything else.`;
  }
  return `${sentence}. That's inside the 10% limit for one project, and it leaves ${show(remaining)} for everything else.`;
}

function assumptionLine(base) {
  const when = base.source?.dateLabel || base.source?.date || "";
  const who = base.source?.publisher || "the source on file";
  if (base.kind === "capital") {
    return `You didn't say which budget this comes from, so I compared it with the ${base.year} federal capital line of ${base.display} (${who}, ${when}). That's the capital part of the third-reading budget, not your agency's budget, so treat this as a rough guide.`;
  }
  return `You didn't say which budget this comes from, so I compared it with the ${base.year} federal budget of ${base.display} (${who}, ${when}), the latest budget I have. That's not your agency's budget, so treat this as a rough guide.`;
}

function levelLine(base, project) {
  if (base.kind === "capital") {
    return `Comparing this with the capital line makes ${show(project)} look like a bigger share than the full federal total would. It is still not your agency budget.`;
  }
  return `Comparing this with the federal total makes ${show(project)} look smaller than it would on an agency budget. This is not a recommendation for your agency.`;
}

function answerFor(budget, project, source, base) {
  const explained = explainProject(budget, project);
  if (explained.ask) {
    return { paragraphs: [explained.ask], work: [], links: [], alternatives: [], warnings: [], context: {}, checked: true };
  }
  const shareText = fineShare(project, budget);
  const entered = source === "user" || source === "memory";
  const paragraphs = [];
  if (source === "assumed" && base) paragraphs.push(assumptionLine(base));
  let lead = why(project, budget, shareText, explained.remaining, explained.warnings.length > 0, explained.blocked);
  if (source === "user") lead += " You entered both figures.";
  if (source === "memory") lead += ` Using the ${show(budget)} you entered earlier.`;
  paragraphs.push(lead);
  if (source === "assumed" && base) paragraphs.push(levelLine(base, project));
  if (!explained.alternatives.length && source !== "assumed") {
    paragraphs.push(
      "A balanced split of what's left would sit inside the usual sector ranges. Those ranges are starting assumptions, not sourced facts.",
    );
  } else if (explained.alternatives.length) {
    for (const item of explained.alternatives) {
      paragraphs.push(`${item.best ? "Best fit: " : ""}${item.title}. ${item.summary} ${item.tradeoff}`);
    }
    paragraphs.push(explained.bestReason || bestReason(explained.alternatives, budget, project));
    paragraphs.push("Nothing is saved unless you save it. The official decides.");
  }
  if (source === "assumed") paragraphs.push("Tell me your agency's budget and I'll redo this.");
  const linkInput = { annualBudgetNaira: budget, projectNaira: project, years: 5, startYear: 2026, scope: "all" };
  const shownBudget = describeNaira(budget);
  const shownProject = describeNaira(project);
  return {
    checked: true,
    year: base?.year || null,
    paragraphs,
    warnings: explained.warnings,
    alternatives: explained.alternatives,
    bestReason: explained.bestReason,
    work: [
      {
        formula: `${show(project)} / ${show(budget)} × 100 = ${shareText}%`,
        inputs: [
          {
            label: source === "assumed" ? "Assumed budget" : "Budget",
            display: `${shownBudget.short} (${shownBudget.full})`,
            enteredByUser: entered,
            assumed: source === "assumed",
          },
          { label: "Project", display: `${shownProject.short} (${shownProject.full})`, enteredByUser: true },
          { label: "Left", display: show(explained.remaining), enteredByUser: false },
        ],
        source:
          source === "assumed" && base
            ? `${base.source?.publisher || "cited source"}, ${base.source?.dateLabel || base.source?.date || ""}`.trim()
            : "the amount you typed",
        enteredByUser: entered,
      },
    ],
    links: [
      { href: scenarioPageHref(linkInput), label: "Open in What-if tests" },
      ...explained.alternatives.map((item) => ({ href: item.href, label: "Open in What-if tests" })),
    ],
    context: {
      budgetNaira: budget,
      budgetSource: source === "memory" ? "user" : source,
      projectNaira: project,
      pendingProjectNaira: null,
      assumedKind: source === "assumed" ? base?.kind || null : null,
    },
    sourceIds: base?.source?.id ? [base.source.id] : [],
  };
}

function pageBudget(page) {
  const settings = pageSettings(page);
  if (!settings?.useBudget || !settings.annualBudgetNaira) return null;
  return settings.annualBudgetNaira;
}

/** Deterministic project check. A missing budget is named as an assumption, never a silent stand-in. */
export function checkProjectRequest({ message, context = {}, history = [], page = null, role = "citizen" }) {
  const phrases = parseMoneyPhrases(message);
  const prior = remembered(context, history);
  const replacing =
    prior.budget &&
    prior.project &&
    phrases.length === 1 &&
    /\b(instead|what about|rather|make it|change)\b/i.test(message) &&
    !/\bbudget\b/i.test(message);
  const namingBudget = prior.project && /\bbudget\b/i.test(message) && phrases.length > 0 && !/\b(project|road)\b/i.test(message);
  if (!isProjectAsk(message) && !replacing && !namingBudget) return null;
  if (role !== "government") {
    return {
      checked: true,
      paragraphs: [
        "That project check is for a government seat. This seat can still ask what percent one amount is of another.",
      ],
      work: [],
      links: [],
      alternatives: [],
      warnings: [],
      sourceIds: [],
    };
  }
  const classified = classifyAmounts(message);
  let project = classified.project;
  let budget = classified.budget;
  let source = budget ? "user" : null;
  let base = null;
  if (replacing) {
    project = phrases[0].naira;
    budget = prior.budget;
    source = prior.source === "assumed" ? "assumed" : "memory";
    if (source === "assumed") base = chooseBase(message, prior.assumedKind);
  } else if (namingBudget) {
    project = prior.project;
    budget = classified.budget || phrases[0].naira;
    source = "user";
  } else if (!project && budget && phrases.length === 1 && /\b(allocate|project|road)\b/i.test(message)) {
    project = budget;
    budget = null;
    source = null;
  }
  if (!budget && prior.budget && prior.source !== "assumed") {
    budget = prior.budget;
    source = prior.source === "agency" ? "agency" : "memory";
  }
  if (!budget) {
    const fromPage = pageBudget(page);
    if (fromPage) {
      budget = fromPage;
      source = "memory";
    }
  }
  if (!budget) {
    const agency = agencyBudget();
    if (agency?.naira) {
      budget = agency.naira;
      source = "agency";
    }
  }
  if (!budget && prior.source === "assumed" && prior.budget) {
    budget = prior.budget;
    source = "assumed";
    base = chooseBase(message, prior.assumedKind);
  }
  if (!project) {
    return {
      checked: true,
      paragraphs: ["Tell me the project amount and the budget it comes from, and I'll check the share."],
      work: [],
      links: [],
      alternatives: [],
      warnings: [],
      sourceIds: [],
      context: budget ? { budgetNaira: budget, budgetSource: source === "memory" ? "user" : source } : {},
    };
  }
  if (!budget) {
    base = chooseBase(message, null);
    if (!base) {
      return {
        checked: true,
        paragraphs: ["I don't have a budget on file to compare that with. Tell me your agency's budget and I'll check it."],
        work: [],
        links: [],
        alternatives: [],
        warnings: [],
        sourceIds: [],
        context: { pendingProjectNaira: project },
      };
    }
    budget = base.naira;
    source = "assumed";
  }
  return answerFor(budget, project, source, base);
}
