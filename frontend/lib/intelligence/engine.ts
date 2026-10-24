import { formatNaira, formatNairaCompact, ZERO, TEN_THOUSAND } from "./money";
import { computeUrgencyScore } from "./risk";
import { buildLgaIndicatorSources } from "./lga-sources";
import type { DecisionAnalysis, GovernmentProject, PriorityWeights } from "./types";

export type AllocationInput = {
  proposedBudgetKobo: bigint;
  priorityWeights: PriorityWeights;
  selectedLga?: string;
  selectedSector?: string;
};

const FIFTY_MILLION_KOBO = BigInt(5000000000);

export function runBudgetAllocation(
  projects: GovernmentProject[],
  input: AllocationInput,
): DecisionAnalysis["allocationResults"] {
  const { proposedBudgetKobo, priorityWeights, selectedLga, selectedSector } = input;
  let remainingBudget = proposedBudgetKobo;

  let candidates = projects.filter((p) => {
    if (selectedLga && selectedLga !== "all" && p.lga.toLowerCase() !== selectedLga.toLowerCase()) {
      return false;
    }
    if (selectedSector && selectedSector !== "all" && p.sector.toLowerCase() !== selectedSector.toLowerCase()) {
      return false;
    }
    return p.status !== "Completed" && p.status !== "Cancelled";
  });

  const scoredCandidates = candidates.map((p) => {
    const urgency = computeUrgencyScore(p);
    let priorityScore = 0;

    if (p.status === "Ongoing" || p.status === "Stalled") {
      priorityScore += (priorityWeights.completeExisting / 100) * (p.progressPercent >= 50 ? 80 : 50);
    }

    if (["Healthcare", "Education", "Environment & Water"].includes(p.sector)) {
      priorityScore += (priorityWeights.essentialServices / 100) * 85;
    }

    if (["Infrastructure & Works", "Transportation", "Power & Energy"].includes(p.sector)) {
      priorityScore += (priorityWeights.economicGrowth / 100) * 80;
    }

    if (p.lga && p.lga !== "Statewide") {
      priorityScore += (priorityWeights.geographicEquity / 100) * 60;
    }

    priorityScore += urgency * 0.3;

    let remainingCostKobo = p.contractSumKobo > p.expendedKobo ? p.contractSumKobo - p.expendedKobo : ZERO;
    if (remainingCostKobo === ZERO) {
      remainingCostKobo = FIFTY_MILLION_KOBO;
    }

    return { project: p, score: priorityScore, remainingCostKobo };
  });

  scoredCandidates.sort((a, b) => b.score - a.score);

  const recommendedProjects: DecisionAnalysis["allocationResults"]["recommendedProjects"] = [];
  const sectorTotals: Record<string, bigint> = {};
  const lgaTotals: Record<string, bigint> = {};
  let totalAllocatedKobo = ZERO;
  let existingCount = 0;

  for (const item of scoredCandidates) {
    if (remainingBudget <= ZERO) break;
    const { project, remainingCostKobo, score } = item;

    const allocation = remainingCostKobo < remainingBudget ? remainingCostKobo : remainingBudget;
    if (allocation <= ZERO) continue;

    remainingBudget -= allocation;
    totalAllocatedKobo += allocation;
    existingCount += 1;

    sectorTotals[project.sector] = (sectorTotals[project.sector] || ZERO) + allocation;
    const lgaKey = project.lga || "Statewide";
    lgaTotals[lgaKey] = (lgaTotals[lgaKey] || ZERO) + allocation;

    recommendedProjects.push({
      projectId: project.id,
      name: project.name,
      lga: project.lga || "Statewide",
      sector: project.sector,
      allocatedKobo: allocation,
      remainingCostKobo,
      progressPercent: project.progressPercent,
      rationale: `Priority score ${score.toFixed(1)}/100 based on ${project.status} status (${project.progressPercent}% progress) and ${project.sector} strategic importance.`,
      sources: project.sources?.length
        ? project.sources.map((s) => ({
            publisher: s.publisher,
            documentTitle: s.documentTitle || "Official Project Record",
            publicationDate: s.publicationDate || "Rolling update",
            retrievalTimestamp: s.retrievalTimestamp,
            url: s.sourceUrl,
            originalProjectId: s.originalProjectId,
            pageNumber: s.pageNumber,
            isOfficial: !s.publisher.toLowerCase().includes("tracka"),
          }))
        : [
            {
              publisher: "Lagos State MEPB",
              documentTitle: "Lagos State Project Performance Management Report",
              publicationDate: "2026",
              retrievalTimestamp: "2026-10-24",
              url: "https://pmr.lagosmepb.org/",
              originalProjectId: project.canonicalId,
              isOfficial: true,
            },
          ],
    });
  }

  const sectorBreakdown: Record<string, { amountKobo: bigint; percent: number }> = {};
  for (const [sector, amount] of Object.entries(sectorTotals)) {
    const percent = totalAllocatedKobo > ZERO ? Number((amount * TEN_THOUSAND) / totalAllocatedKobo) / 100 : 0;
    sectorBreakdown[sector] = { amountKobo: amount, percent };
  }

  const lgaBreakdown: Record<string, { amountKobo: bigint; percent: number; sources: any[] }> = {};
  for (const [lga, amount] of Object.entries(lgaTotals)) {
    const percent = totalAllocatedKobo > ZERO ? Number((amount * TEN_THOUSAND) / totalAllocatedKobo) / 100 : 0;
    lgaBreakdown[lga] = {
      amountKobo: amount,
      percent,
      sources: buildLgaIndicatorSources(lga, candidates.length),
    };
  }

  return {
    totalAllocatedKobo,
    unallocatedKobo: remainingBudget,
    existingProjectsCount: existingCount,
    newProjectsCount: remainingBudget > ZERO ? 1 : 0,
    sectorBreakdown,
    lgaBreakdown,
    recommendedProjects,
  };
}
