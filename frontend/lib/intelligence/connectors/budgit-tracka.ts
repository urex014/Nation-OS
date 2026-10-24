import { parseNairaToKobo } from "../money";
import { safeFetch } from "../http-client";
import type { NormalizedStatus } from "../types";

export type RawTrackaProject = {
  id: number;
  project_code?: string;
  title: string;
  image_url?: string;
  country?: string;
  state?: string;
  lga?: string;
  status?: string;
  amount_allocated?: string;
  amount_disbursed?: string;
  ministry?: string;
  agency?: string;
  year?: number;
  created_at?: string;
  updated_at?: string;
};

export type IngestedTrackaProject = {
  canonicalId: string;
  originalId: string;
  name: string;
  description: string;
  state: string;
  lga: string;
  agency: string;
  sector: string;
  status: NormalizedStatus;
  progressPercent: number;
  contractSumKobo: bigint;
  expendedKobo: bigint;
  startDate: string | null;
  actualCompletionDate: string | null;
  publisher: "BudgIT Tracka";
  sourceUrl: string;
  imageUrl?: string;
  raw: RawTrackaProject;
};

function mapTrackaStatus(status?: string): NormalizedStatus {
  const s = (status || "").toLowerCase().trim();
  if (s.includes("complete")) return "Completed";
  if (s.includes("progress") || s.includes("ongoing")) return "Ongoing";
  if (s.includes("not start") || s.includes("planned")) return "Planned";
  if (s.includes("abandon")) return "Abandoned";
  if (s.includes("stall") || s.includes("uncertain")) return "Stalled";
  return "Unknown";
}

function inferSector(title: string, agency?: string, ministry?: string): string {
  const text = `${title} ${agency || ""} ${ministry || ""}`.toLowerCase();
  if (text.includes("road") || text.includes("bridge") || text.includes("drain") || text.includes("works") || text.includes("construct"))
    return "Infrastructure & Works";
  if (text.includes("health") || text.includes("hospital") || text.includes("maternity") || text.includes("clinic") || text.includes("medical"))
    return "Healthcare";
  if (text.includes("school") || text.includes("classroom") || text.includes("education") || text.includes("college") || text.includes("student"))
    return "Education";
  if (text.includes("water") || text.includes("borehole") || text.includes("wash") || text.includes("pipe"))
    return "Environment & Water";
  if (text.includes("solar") || text.includes("light") || text.includes("power") || text.includes("electric") || text.includes("transformer"))
    return "Power & Energy";
  if (text.includes("farm") || text.includes("agric") || text.includes("seed") || text.includes("fertilizer") || text.includes("grain"))
    return "Agriculture & Food Security";
  return "Community Development";
}

export async function fetchTrackaProjects(state = "Lagos", page = 1, pageSize = 20): Promise<{ projects: IngestedTrackaProject[]; total: number }> {
  const url = `https://apirebuild.yourtracka.org/recent_projects_by_year_list/filter?country=nigeria&state=${encodeURIComponent(state)}&page=${page}&page_size=${pageSize}`;
  const response = await safeFetch(url, {
    headers: {
      "User-Agent": "NationOS-Intelligence/1.0",
      Accept: "application/json",
    },
    signal: AbortSignal.timeout(15000),
  });

  if (!response.ok) {
    throw new Error(`Tracka API responded with HTTP ${response.status}: ${response.statusText}`);
  }

  const payload = await response.json();
  const rawList: RawTrackaProject[] = payload?.data?.projects?.projects || [];
  const total = Number(payload?.data?.projects?.total_count || rawList.length);

  const projects: IngestedTrackaProject[] = rawList.map((p) => {
    const code = p.project_code || `TRK-${p.id}`;
    const canonicalId = `TRACKA-${code}`;
    const agency = p.agency || p.ministry || "Federal / State Ministry";
    const sector = inferSector(p.title, p.agency, p.ministry);
    const status = mapTrackaStatus(p.status);
    const progress = status === "Completed" ? 100 : status === "Ongoing" ? 50 : 0;
    const allocatedKobo = parseNairaToKobo(p.amount_allocated);
    const disbursedKobo = parseNairaToKobo(p.amount_disbursed);

    return {
      canonicalId,
      originalId: String(p.id),
      name: p.title?.trim() || "Untitled Tracka Monitored Project",
      description: `Monitored under ${p.ministry || "Ministry"} (Fiscal Year: ${p.year || "N/A"}). Allocated: ₦${p.amount_allocated || "0"}. Disbursed: ₦${p.amount_disbursed || "0"}.`,
      state: p.state || state,
      lga: p.lga || "Statewide",
      agency,
      sector,
      status,
      progressPercent: progress,
      contractSumKobo: allocatedKobo,
      expendedKobo: disbursedKobo,
      startDate: p.year ? `${p.year}-01-01` : null,
      actualCompletionDate: status === "Completed" ? (p.updated_at ? p.updated_at.split("T")[0] : null) : null,
      publisher: "BudgIT Tracka",
      sourceUrl: `https://www.yourtracka.org/ng/projects`,
      imageUrl: p.image_url,
      raw: p,
    };
  });

  return { projects, total };
}
