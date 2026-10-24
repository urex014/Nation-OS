import { api } from "../../../../../lib/nigeria/http.mjs";
import { getDecisionAnalysis } from "../../../../../lib/intelligence/queries";
import { formatNaira } from "../../../../../lib/intelligence/money";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = api(async (_: Request, context: { params: Promise<{ id: string }> }) => {
  const { id } = await context.params;
  const analysis = await getDecisionAnalysis(id);
  if (!analysis) {
    throw Object.assign(new Error(`Decision analysis '${id}' not found.`), { status: 404 });
  }

  return {
    ...analysis,
    proposedBudgetKobo: analysis.proposedBudgetKobo.toString(),
    proposedBudgetFormatted: formatNaira(analysis.proposedBudgetKobo),
  };
});
