import { getDatabase } from "./database.mjs";
import { listDecisions } from "./decisions.mjs";
import { getOverview, getPlanningContext } from "./repository.mjs";

function sourceBrief(source) {
  if (!source) return null;
  return {
    id: source.id,
    publisher: source.publisher,
    title: source.title,
    period: source.period,
    url: source.url,
    note: source.note,
  };
}

/** Published Lagos money for the budget what-if. Missing rows stay missing. */
export async function publicMoneySnapshot() {
  try {
    const overview = getOverview();
    const lagos = overview.revenue.states.find((state) => state.id === "NG-LA");
    if (!lagos) return null;
    const row = getDatabase()
      .prepare(
        "select total_kobo, tax_kobo, other_kobo from state_revenue where state_id = 'NG-LA' and year = ?",
      )
      .get(overview.revenue.year);
    if (!row || row.tax_kobo == null || row.other_kobo == null) return null;
    const inflation = overview.indicators.find((item) => item.code === "FP.CPI.TOTL.ZG");
    let decisions = [];
    try {
      decisions = (await listDecisions(5, 0)).records.map((item) => ({
        id: item.id,
        title: item.title,
        status: item.status,
        createdAt: String(item.createdAt).slice(0, 10),
      }));
    } catch {
      decisions = [];
    }
    return {
      state: lagos.name,
      year: lagos.year,
      totalKobo: row.total_kobo,
      taxKobo: row.tax_kobo,
      otherKobo: row.other_kobo,
      totalNaira: lagos.totalNaira,
      taxNaira: lagos.taxNaira,
      otherNaira: lagos.otherNaira,
      envelopeNaira: Math.round(row.total_kobo / 100),
      taxShare: (row.tax_kobo / row.total_kobo) * 100,
      rank: lagos.rank,
      coverage: overview.revenue.coverage,
      warning: getPlanningContext("NG-LA").warning,
      igrSource: sourceBrief(
        overview.sources.find((item) => item.id === overview.revenue.sourceId),
      ),
      budget: {
        year: overview.budget.year,
        approvedNaira: overview.budget.approvedNaira,
        note: overview.budget.note,
        classification: overview.budget.classification,
        source: sourceBrief(overview.sources.find((item) => item.id === overview.budget.sourceId)),
      },
      inflation:
        inflation?.value == null
          ? null
          : {
              value: inflation.value,
              year: inflation.year,
              note: inflation.note,
              source: sourceBrief(overview.sources.find((item) => item.id === inflation.sourceId)),
            },
      decisions,
    };
  } catch {
    return null;
  }
}
