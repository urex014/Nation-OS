import { parseNairaToKobo } from "../money";
import { safeFetch } from "../http-client";
import type { NormalizedStatus } from "../types";

export type RawLagosPmrProject = {
  id: number;
  code: string;
  name: string;
  description?: string;
  objectives?: string;
  achievement?: string | null;
  stage?: number;
  status?: string;
  contract_sum?: string;
  approvedBudget?: string;
  expendedBudget?: string;
  progress?: number;
  actualStartDate?: string | null;
  actualEndDate?: string | null;
  mda?: { name: string; sector_id?: number };
  lgas?: Array<{ name: string; slug: string }>;
  published_at?: string;
  updated_at?: string;
};

export type IngestedLagosProject = {
  canonicalId: string;
  originalId: string;
  name: string;
  description: string;
  state: "Lagos";
  lga: string;
  agency: string;
  sector: string;
  status: NormalizedStatus;
  progressPercent: number;
  contractSumKobo: bigint;
  expendedKobo: bigint;
  startDate: string | null;
  actualCompletionDate: string | null;
  publisher: "Lagos State MEPB (PMR)";
  sourceUrl: string;
  raw: RawLagosPmrProject;
};

function mapPmrStatus(status?: string, progress?: number, actualEnd?: string | null): NormalizedStatus {
  if (progress !== undefined && progress >= 100) return "Completed";
  if (actualEnd) return "Completed";
  const s = (status || "").toLowerCase();
  if (s.includes("award") || s.includes("tender")) return "Procurement";
  if (s.includes("plan")) return "Planned";
  if (s.includes("cancel")) return "Cancelled";
  if (s.includes("suspend") || s.includes("stall")) return "Stalled";
  if (s.includes("abandon")) return "Abandoned";
  if (progress !== undefined && progress > 0) return "Ongoing";
  return "Planned";
}

function mapSector(sectorId?: number, mdaName?: string): string {
  const mda = (mdaName || "").toLowerCase();
  if (mda.includes("work") || mda.includes("infra") || mda.includes("road") || mda.includes("bridge"))
    return "Infrastructure & Works";
  if (mda.includes("health") || mda.includes("hospital") || mda.includes("clinic"))
    return "Healthcare";
  if (mda.includes("educat") || mda.includes("school") || mda.includes("learn"))
    return "Education";
  if (mda.includes("water") || mda.includes("drainage") || mda.includes("environ"))
    return "Environment & Water";
  if (mda.includes("transport") || mda.includes("traffic") || mda.includes("lamata"))
    return "Transportation";
  if (mda.includes("agric") || mda.includes("farm"))
    return "Agriculture & Food Security";
  if (mda.includes("energy") || mda.includes("power") || mda.includes("electr"))
    return "Power & Energy";
  return "General Public Service";
}

export async function fetchLagosPmrProjects(page = 1, perPage = 20): Promise<{ projects: IngestedLagosProject[]; total: number }> {
  const url = `https://lybrah-api.lagosmepb.org/api/v2/web/projects?page=${page}&per_page=${perPage}`;
  const response = await safeFetch(url, {
    headers: {
      "X-State-Domain": "lagos",
      "User-Agent": "NationOS-Intelligence/1.0",
      Accept: "application/json",
    },
    signal: AbortSignal.timeout(15000),
  });

  if (!response.ok) {
    throw new Error(`Lagos PMR API responded with HTTP ${response.status}: ${response.statusText}`);
  }

  const payload = await response.json();
  const rawList: RawLagosPmrProject[] = payload?.data || [];
  const total = Number(payload?.meta?.total || rawList.length);

  const projects: IngestedLagosProject[] = rawList.map((p) => {
    const canonicalId = `LAGOS-PMR-${p.code || p.id}`;
    const lga = p.lgas && p.lgas.length > 0 ? p.lgas[0].name : "Statewide";
    const agency = p.mda?.name || "Lagos State Government";
    const sector = mapSector(p.mda?.sector_id, agency);
    const progress = Math.min(Math.max(Number(p.progress || 0), 0), 100);
    const status = mapPmrStatus(p.status, progress, p.actualEndDate);
    const contractSumKobo = parseNairaToKobo(p.contract_sum);
    const expendedKobo = parseNairaToKobo(p.expendedBudget);

    return {
      canonicalId,
      originalId: String(p.id),
      name: p.name?.trim() || "Untitled Lagos State Project",
      description: [p.description, p.objectives].filter(Boolean).join("\n\n"),
      state: "Lagos",
      lga,
      agency,
      sector,
      status,
      progressPercent: progress,
      contractSumKobo,
      expendedKobo,
      startDate: p.actualStartDate || null,
      actualCompletionDate: p.actualEndDate || null,
      publisher: "Lagos State MEPB (PMR)",
      sourceUrl: `https://pmr.lagosmepb.org/projects`,
      raw: p,
    };
  });

  return { projects, total };
}
