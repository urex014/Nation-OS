import { api } from "../../../lib/nigeria/http.mjs";
import { getRevenue, getRevenueHistory } from "../../../lib/nigeria/repository.mjs";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const GET = api((request) => {
  const query = new URL(request.url).searchParams;
  return {
    revenue: getRevenue(query.get("year")),
    scope: query.get("scope") || "all",
    compare: query.get("compare"),
    history: getRevenueHistory(query.get("scope") || "all"),
    comparison: query.get("compare") ? getRevenueHistory(query.get("compare")) : null,
  };
});
