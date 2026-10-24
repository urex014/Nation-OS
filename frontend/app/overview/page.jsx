import { Overview } from "../../components/nigeria/overview";
import { getOverview } from "../../lib/nigeria/repository.mjs";
import { getDecisionsOverview, listDecisionAnalyses } from "../../lib/intelligence/queries";
import { formatNaira, formatNairaCompact } from "../../lib/intelligence/money";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const metadata = { title: "National overview · NationOS" };

export default async function Page() {
  const data = getOverview();
  const rawOv = await getDecisionsOverview();
  const { analyses: rawAnalyses } = await listDecisionAnalyses(3, 0);

  const decisionsData = {
    overview: {
      totalProjects: rawOv.totalProjects,
      ongoingProjects: rawOv.ongoingProjects,
      completedProjects: rawOv.completedProjects,
      verifiedAllocationsCompact: formatNairaCompact(rawOv.verifiedAllocationsKobo),
    },
    recentAnalyses: rawAnalyses.map((a) => ({
      id: a.id,
      title: a.title,
      proposedBudgetFormatted: formatNaira(a.proposedBudgetKobo),
      createdAt: a.createdAt,
      rationale: a.rationale,
      projectsCount: a.allocationResults?.recommendedProjects?.length || 0,
    })),
  };

  return <Overview data={data} decisionsData={decisionsData} />;
}
