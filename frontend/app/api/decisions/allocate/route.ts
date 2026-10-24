import { api, readJson } from "../../../../lib/nigeria/http.mjs";
import { parseNairaToKobo, formatNaira, formatNairaCompact } from "../../../../lib/intelligence/money";
import { listProjects } from "../../../../lib/intelligence/queries";
import { runBudgetAllocation } from "../../../../lib/intelligence/engine";
import { saveDecisionAnalysis } from "../../../../lib/intelligence/queries";
import { currentUser } from "../../../../lib/auth/current";
import type { PriorityWeights, DecisionAnalysis } from "../../../../lib/intelligence/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const POST = api(async (request: Request) => {
  const body = await readJson(request);
  const budgetRaw = body.proposedBudget || body.budget || "100000000000"; // default ₦100bn
  const proposedBudgetKobo = parseNairaToKobo(budgetRaw);

  if (proposedBudgetKobo <= BigInt(0)) {
    throw Object.assign(new Error("Please enter a valid positive budget amount."), { status: 400 });
  }

  const priorityWeights: PriorityWeights = {
    completeExisting: Number(body.completeExisting ?? 40),
    essentialServices: Number(body.essentialServices ?? 30),
    geographicEquity: Number(body.geographicEquity ?? 15),
    economicGrowth: Number(body.economicGrowth ?? 15),
  };

  const selectedLga = body.lga?.trim() || undefined;
  const selectedSector = body.sector?.trim() || undefined;

  const { projects } = await listProjects({ limit: 100 });
  const results = runBudgetAllocation(projects, {
    proposedBudgetKobo,
    priorityWeights,
    selectedLga,
    selectedSector,
  });

  const user = await currentUser();
  const analysisId = `analysis-${Date.now()}`;
  const analysis: DecisionAnalysis = {
    id: analysisId,
    title: `Budget Allocation Scenario (${formatNairaCompact(proposedBudgetKobo)})`,
    proposedBudgetKobo,
    priorityWeights,
    selectedLga,
    selectedSector,
    allocationResults: results,
    rationale: `Allocation of ${formatNaira(proposedBudgetKobo)} prioritising ${priorityWeights.completeExisting}% completion of existing commitments, ${priorityWeights.essentialServices}% essential services, and ${priorityWeights.geographicEquity}% geographic equity.`,
    evidenceCitations: [
      { title: "Lagos State Project Performance Management Report", url: "https://pmr.lagosmepb.org/", note: "Baseline contract sums and progress" },
      { title: "BudgIT Tracka Monitoring Observations", url: "https://www.yourtracka.org/ng/projects", note: "Civil society ground observations" },
    ],
    createdBy: user?.email,
    createdAt: new Date().toISOString(),
  };

  try {
    await saveDecisionAnalysis(analysis);
  } catch (err) {
    console.error("Could not persist analysis record:", err);
  }

  return {
    analysisId,
    proposedBudgetKobo: proposedBudgetKobo.toString(),
    proposedBudgetFormatted: formatNaira(proposedBudgetKobo),
    results: {
      totalAllocatedKobo: results.totalAllocatedKobo.toString(),
      totalAllocatedFormatted: formatNaira(results.totalAllocatedKobo),
      unallocatedKobo: results.unallocatedKobo.toString(),
      unallocatedFormatted: formatNaira(results.unallocatedKobo),
      existingProjectsCount: results.existingProjectsCount,
      newProjectsCount: results.newProjectsCount,
      sectorBreakdown: Object.fromEntries(
        Object.entries(results.sectorBreakdown).map(([k, v]) => [
          k,
          { amountKobo: v.amountKobo.toString(), amountFormatted: formatNaira(v.amountKobo), percent: v.percent },
        ]),
      ),
      lgaBreakdown: Object.fromEntries(
        Object.entries(results.lgaBreakdown).map(([k, v]) => [
          k,
          { amountKobo: v.amountKobo.toString(), amountFormatted: formatNaira(v.amountKobo), percent: v.percent },
        ]),
      ),
      recommendedProjects: results.recommendedProjects.map((p) => ({
        ...p,
        allocatedKobo: p.allocatedKobo.toString(),
        allocatedFormatted: formatNaira(p.allocatedKobo),
        remainingCostKobo: p.remainingCostKobo.toString(),
        remainingCostFormatted: formatNaira(p.remainingCostKobo),
      })),
    },
  };
});
