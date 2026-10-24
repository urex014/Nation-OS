import type { GovernmentProject, ProjectSource, ProjectStatusObservation } from "./types";

function normalizeString(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function matchProjects(
  candidate: { canonicalId: string; name: string; lga: string; agency: string },
  existing: GovernmentProject[],
): { matchedProject: GovernmentProject | null; matchType: "exact_id" | "normalized_attribute" | "none" } {
  // 1. Deterministic exact code match
  const exact = existing.find((p) => p.canonicalId.toLowerCase() === candidate.canonicalId.toLowerCase());
  if (exact) return { matchedProject: exact, matchType: "exact_id" };

  // 2. Exact LGA + Agency + Clean Normalized Name match
  const normCandidateName = normalizeString(candidate.name);
  const normCandidateLga = normalizeString(candidate.lga);
  const normCandidateAgency = normalizeString(candidate.agency);

  if (normCandidateName.length >= 10 && normCandidateLga && normCandidateAgency) {
    const attrMatch = existing.find((p) => {
      const matchLga = normalizeString(p.lga) === normCandidateLga;
      const matchAgency = normalizeString(p.agency) === normCandidateAgency;
      const matchName = normalizeString(p.name) === normCandidateName;
      return matchLga && matchAgency && matchName;
    });
    if (attrMatch) return { matchedProject: attrMatch, matchType: "normalized_attribute" };
  }

  return { matchedProject: null, matchType: "none" };
}

export function checkDiscrepancies(
  current: GovernmentProject,
  reported: { status?: string; progress?: number; amountKobo?: bigint; publisher: string },
): ProjectStatusObservation | null {
  const isStatusDivergent = reported.status && reported.status !== current.status;
  const isProgressDivergent =
    reported.progress !== undefined && Math.abs(reported.progress - current.progressPercent) > 20;

  if (isStatusDivergent || isProgressDivergent) {
    return {
      id: `OBS-DISC-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      projectId: current.id,
      reportedStatus: reported.status || current.status,
      progressPercent: reported.progress,
      observationDate: new Date().toISOString().split("T")[0],
      publisher: reported.publisher,
      remarks: `Discrepancy detected: ${reported.publisher} reports status='${reported.status || "N/A"}' (progress ${reported.progress ?? "N/A"}%), while system baseline has '${current.status}' (${current.progressPercent}%).`,
      conflicting: true,
      createdAt: new Date().toISOString(),
    };
  }

  return null;
}
