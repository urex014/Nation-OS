import { api } from "../../../../lib/nigeria/http.mjs";
import { listProjects } from "../../../../lib/intelligence/queries";
import { formatNaira, formatNairaCompact } from "../../../../lib/intelligence/money";
import type { NormalizedStatus, RiskLevel } from "../../../../lib/intelligence/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = api(async (request: Request) => {
  const url = new URL(request.url);
  const search = url.searchParams.get("search") || undefined;
  const lga = url.searchParams.get("lga") || undefined;
  const status = (url.searchParams.get("status") as NormalizedStatus) || undefined;
  const sector = url.searchParams.get("sector") || undefined;
  const riskLevel = (url.searchParams.get("riskLevel") as RiskLevel) || undefined;
  const source = url.searchParams.get("source") || undefined;
  const limit = Math.min(Math.max(Number(url.searchParams.get("limit") || 20), 1), 100);
  const offset = Math.max(Number(url.searchParams.get("offset") || 0), 0);

  const { projects, total } = await listProjects({
    search,
    lga,
    status,
    sector,
    riskLevel,
    source,
    limit,
    offset,
  });

  return {
    total,
    limit,
    offset,
    projects: projects.map((p) => ({
      ...p,
      contractSumKobo: p.contractSumKobo.toString(),
      expendedKobo: p.expendedKobo.toString(),
      contractSumFormatted: formatNaira(p.contractSumKobo),
      contractSumCompact: formatNairaCompact(p.contractSumKobo),
      expendedFormatted: formatNaira(p.expendedKobo),
    })),
  };
});
