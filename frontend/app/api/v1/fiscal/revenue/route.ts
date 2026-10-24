import { readWhole } from "@/lib/api/params";
import { readRevenue } from "@/lib/db/revenue";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function GET(request: Request): Response {
  const url = new URL(request.url);
  const fiscalYear = readWhole(url.searchParams.get("fiscalYear"), 2026);
  if (fiscalYear == null) {
    return Response.json({ error: "Year must be a whole number." }, { status: 400 });
  }
  const revenue = readRevenue(fiscalYear);
  if (!revenue) return Response.json({ error: "No revenue for that year." }, { status: 404 });
  return Response.json({
    fiscalYear: revenue.fiscalYear,
    distributablePool: revenue.distributablePool,
    tiers: revenue.tiers,
    sources: revenue.sources,
    stateAllocations: revenue.stateAllocations.map(
      ({ id, name, population, sharePercent, allocationAmount }) => ({
        id,
        name,
        population,
        sharePercent,
        allocationAmount,
      }),
    ),
  });
}
