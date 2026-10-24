import { readWhole } from "@/lib/api/params";
import { readOverview } from "@/lib/db/overview";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function GET(request: Request): Response {
  const url = new URL(request.url);
  const fiscalYear = readWhole(url.searchParams.get("fiscalYear"), 2026);
  const jurisdictionId = url.searchParams.get("jurisdictionId") ?? "all";
  if (fiscalYear == null) {
    return Response.json({ error: "Year must be a whole number." }, { status: 400 });
  }
  const overview = readOverview(fiscalYear, jurisdictionId);
  if (!overview) return Response.json({ error: "No figures for that query." }, { status: 404 });
  return Response.json({
    fiscalYear: overview.fiscalYear,
    currency: overview.currency,
    unit: overview.unit,
    metrics: overview.metrics,
    indicators: overview.indicators.map(({ title, value, period, bars, source }) => ({
      title,
      value,
      period,
      bars,
      source,
    })),
    revenueTrajectory: overview.revenueTrajectory,
    priorities: overview.priorities,
    projects: overview.projects,
  });
}
