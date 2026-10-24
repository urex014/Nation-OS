import { api } from "../../../../lib/nigeria/http.mjs";
import { getDecisionsOverview } from "../../../../lib/intelligence/queries";
import { formatNaira, formatNairaCompact } from "../../../../lib/intelligence/money";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = api(async () => {
  const ov = await getDecisionsOverview();
  return {
    totalProjects: ov.totalProjects,
    ongoingProjects: ov.ongoingProjects,
    completedProjects: ov.completedProjects,
    abandonedProjects: ov.abandonedProjects,
    requiringVerification: ov.requiringVerification,
    verifiedAllocationsKobo: ov.verifiedAllocationsKobo.toString(),
    verifiedAllocationsFormatted: formatNaira(ov.verifiedAllocationsKobo),
    verifiedAllocationsCompact: formatNairaCompact(ov.verifiedAllocationsKobo),
    lastDataRefresh: ov.lastDataRefresh,
  };
});
