/** Explain computed risks without inventing outcomes. Every stress case reruns the same versioned engines. */
import { computeProposal, sources } from "./knowledge.mjs";
import planning from "./domain/planning-engine.cjs";

export function reviewProposal({ question, proposal }) {
  let result;
  try {
    if (!proposal || typeof proposal !== "object") throw Error("Choose a proposal first.");
    if (
      !proposal.budgets ||
      Object.keys(proposal.budgets).length !== 6 ||
      Object.keys(proposal.budgets).some((key) => !Object.hasOwn(planning.definitions, key))
    ) {
      throw Error("Supply exactly the six supported sector budgets.");
    }
    result = computeProposal(proposal);
  } catch (error) {
    throw Object.assign(Error(error.message), { status: 400 });
  }
  const variants = [
    ["Current assumptions", proposal],
    [
      "Delivery falls by 20 percentage points",
      { ...proposal, delivery: Math.max(0, proposal.delivery - 20) },
    ],
    [
      "Population growth rises by 1 percentage point",
      { ...proposal, growth: Math.min(5, proposal.growth + 1) },
    ],
    ["No maintenance allocation", { ...proposal, maintenance: 0 }],
  ];
  const cases = variants.map(([label, config]) => {
    const run = computeProposal(config);
    return {
      label,
      config: run.config,
      annualCost: run.annualCost,
      end: run.years.at(-1).national,
    };
  });
  const flags = [],
    findings = [],
    monitoring = [];
  const add = (text) => findings.push({ text, sourceIds: ["METHOD", "ECON-NATIONAL"] });
  if (!result.annualCost)
    flags.push("No investment is allocated; this proposal cannot model an investment gain.");
  if (proposal.delivery < 60)
    flags.push(
      "Delivery is below 60%; validate procurement and implementation capacity before expanding commitments.",
    );
  if (proposal.maintenance < 20)
    flags.push(
      "Maintenance is below the model's 20% retention threshold. Check the full operating and upkeep costs.",
    );
  if (result.fiscal.supplemental > 0)
    flags.push(
      `Annual spending exceeds the national planning envelope by ${result.fiscal.supplemental.toFixed(1)} million; the fiscal model adds borrowing.`,
    );
  add(
    `The ${proposal.years}-year package allocates ${result.annualCost.toFixed(1)} million annually and ${result.totalCost.toFixed(1)} million over its horizon. This is a conditional calculation, not a recommendation to approve it.`,
  );
  for (const [key, definition] of Object.entries(planning.definitions)) {
    if (!proposal.budgets[key]) continue;
    const end = cases[0].end[key],
      stressed = cases[1].end[key];
    const gain = definition.higher ? end.with - end.no : end.no - end.with;
    const stressGain = definition.higher
      ? stressed.with - stressed.no
      : stressed.no - stressed.with;
    add(
      `${definition.name}: national modelled improvement is ${gain.toFixed(2)} ${definition.unit === "%" ? "percentage points" : "minutes"}; under lower delivery it is ${stressGain.toFixed(2)}. These national averages can hide differences within the selected scope.`,
    );
    monitoring.push({
      sector: key,
      indicator: definition.metric,
      unit: definition.unit,
      cadence: "Quarterly delivery review; annual indicator measurement",
      evidence: "Dated source, sampling method, geographic coverage and responsible institution",
      trigger:
        "Investigate missed delivery milestones or outcomes moving away from the intended direction; do not infer causation from the trend alone.",
    });
  }
  for (const flag of flags) add(flag);
  return {
    question,
    scope: proposal.scope,
    created: new Date().toISOString(),
    mode: "review",
    provider: "Local rules",
    model: null,
    engine: "aderin-proposal-review-v1",
    summary:
      "Proposal review: delivery risks, fiscal headroom, stress cases and an evidence collection plan.",
    findings,
    gaps: [
      "No measured implementation outcomes or causal effectiveness studies are supplied.",
      "No procurement schedule, project-level costing or within-state distribution is modelled.",
    ],
    assumptions: result.limitations,
    sources: sources.filter((source) => ["METHOD", "ECON-NATIONAL"].includes(source.id)),
    proposal: null,
    modelResult: null,
    review: {
      input: result.config,
      flags,
      cases,
      monitoring,
      version: "aderin-proposal-review-v1",
      dataset: result.dataset,
    },
  };
}
