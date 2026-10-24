import { naira } from "../nigeria/format.mjs";
import { getOverview } from "../nigeria/repository.mjs";

/** Published observations for the landing page and role desks. Missing data stays missing. */
export function evidenceSnapshot() {
  try {
    const data = getOverview();
    const lagos = data.revenue.states.find((state) => state.id === "NG-LA");
    return {
      lagosIgr: lagos ? naira(lagos.totalNaira) : "Not reported",
      lagosTax: lagos?.taxNaira == null ? "Not reported" : naira(lagos.taxNaira),
      lagosYear: data.revenue.year,
      lagosRank: lagos?.rank ?? null,
      coverage: data.revenue.coverage,
      combined: naira(data.revenue.totalNaira),
      budget: naira(data.budget.approvedNaira),
      budgetYear: data.budget.year,
    };
  } catch {
    return null;
  }
}
