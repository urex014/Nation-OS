import { api } from "../../../../../lib/nigeria/http.mjs";
import { getProjectById } from "../../../../../lib/intelligence/queries";
import { formatNaira, formatNairaCompact } from "../../../../../lib/intelligence/money";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = api(async (_: Request, context: { params: Promise<{ id: string }> }) => {
  const { id } = await context.params;
  const data = await getProjectById(id);
  if (!data) {
    throw Object.assign(new Error(`Government project '${id}' not found.`), { status: 404 });
  }

  return {
    project: {
      ...data.project,
      contractSumKobo: data.project.contractSumKobo.toString(),
      expendedKobo: data.project.expendedKobo.toString(),
      contractSumFormatted: formatNaira(data.project.contractSumKobo),
      contractSumCompact: formatNairaCompact(data.project.contractSumKobo),
      expendedFormatted: formatNaira(data.project.expendedKobo),
    },
    sources: data.sources,
    financials: data.financials.map((f) => ({
      ...f,
      amountKobo: f.amountKobo.toString(),
      amountFormatted: formatNaira(f.amountKobo),
    })),
    statusHistory: data.statusHistory,
  };
});
