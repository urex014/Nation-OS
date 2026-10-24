/** All observations are read from SQLite; no fixture data is bundled into client components. */
import { getDatabase } from "./database.mjs";
import { INDICATORS } from "./constants.mjs";
import { geometryPath } from "./geography.mjs";

export const getSources = () =>
  getDatabase()
    .prepare("select metadata_json from sources order by id")
    .all()
    .map((row) => JSON.parse(row.metadata_json));
export const getJurisdictions = () =>
  getDatabase()
    .prepare("select id,name,type from jurisdictions order by name")
    .all()
    .map((row) => ({ ...row }));

export function requireScope(scope) {
  if (
    scope !== "all" &&
    !getDatabase().prepare("select 1 from jurisdictions where id=?").get(scope)
  ) {
    throw Object.assign(Error("Choose a known Nigerian state or FCT."), { status: 400 });
  }
  return scope;
}
export function getRevenue(year) {
  const db = getDatabase();
  const years = db
    .prepare("select distinct year from state_revenue order by year desc")
    .all()
    .map((row) => row.year);
  const selectedYear = year == null ? years[0] : Number(year);
  if (!years.includes(selectedYear))
    throw Object.assign(Error("No NBS observations for that year."), { status: 400 });
  const rows = db
    .prepare(
      `select r.*,j.name,j.type,rank() over(order by r.total_kobo desc) as rank,
    previous.total_kobo as previous_kobo from state_revenue r join jurisdictions j on j.id=r.state_id
    left join state_revenue previous on previous.state_id=r.state_id and previous.year=r.year-1
    where r.year=? order by r.total_kobo desc,j.name`,
    )
    .all(selectedYear);
  const totalKobo = rows.reduce((sum, row) => sum + row.total_kobo, 0);
  const states = rows.map((row) => ({
    id: row.state_id,
    name: row.name,
    type: row.type,
    rank: row.rank,
    totalNaira: row.total_kobo / 100,
    taxNaira: row.tax_kobo == null ? null : row.tax_kobo / 100,
    otherNaira: row.other_kobo == null ? null : row.other_kobo / 100,
    otherLabel: row.other_label,
    sourceName: row.source_name,
    sourceId: row.source_id,
    components: JSON.parse(row.components_json).map((item) => ({
      label: item.label,
      naira: item.kobo == null ? null : item.kobo / 100,
    })),
    growthPercent: row.previous_kobo > 0 ? (row.total_kobo / row.previous_kobo - 1) * 100 : null,
    nationalSharePercent: totalKobo ? (row.total_kobo / totalKobo) * 100 : null,
    reconciliationKobo: row.reconciliation_kobo,
  }));
  return {
    year: selectedYear,
    years,
    states,
    totalNaira: totalKobo / 100,
    taxNaira: rows.reduce((sum, row) => sum + (row.tax_kobo || 0), 0) / 100,
    otherNaira: rows.reduce((sum, row) => sum + (row.other_kobo || 0), 0) / 100,
    sourceId: "nbs-igr-2019-2025",
    coverage: states.length,
    note: "IGR (money the state raises itself) leaves out federal transfers. A higher amount doesn't mean the state is better run, or that services are better.",
  };
}
export function getRevenueHistory(scope = "all") {
  requireScope(scope);
  const sql =
    scope === "all"
      ? "select year,sum(total_kobo)/100.0 as totalNaira from state_revenue group by year order by year"
      : "select year,total_kobo/100.0 as totalNaira from state_revenue where state_id=? order by year";
  // node:sqlite rows have null prototypes; React server props require plain objects.
  const rows =
    scope === "all" ? getDatabase().prepare(sql).all() : getDatabase().prepare(sql).all(scope);
  return rows.map((row) => ({ ...row }));
}
export function getIndicators() {
  const rows = getDatabase()
    .prepare("select * from indicators where value is not null order by code,year desc")
    .all();
  return Object.entries(INDICATORS).map(([code, definition]) => {
    const series = rows
      .filter((row) => row.code === code)
      .map((row) => ({ year: row.year, value: row.value }));
    return {
      code,
      ...definition,
      value: series[0]?.value ?? null,
      year: series[0]?.year ?? null,
      series: series.toReversed(),
      sourceId: "worldbank-wdi-ng",
    };
  });
}
export function getOverview() {
  const db = getDatabase();
  const budget = db
    .prepare("select metadata_json from federal_budgets order by year desc limit 1")
    .get();
  const map = db
    .prepare("select id,name,geometry_json,source_id from jurisdictions order by name")
    .all()
    .map((row) => ({
      id: row.id,
      name: row.name,
      path: geometryPath(JSON.parse(row.geometry_json)),
      sourceId: row.source_id,
    }));
  return {
    country: "Federal Republic of Nigeria",
    indicators: getIndicators(),
    budget: JSON.parse(budget.metadata_json),
    revenue: getRevenue(),
    revenueHistory: getRevenueHistory(),
    map,
    sources: getSources(),
  };
}
export function getPlanningContext(scope) {
  requireScope(scope);
  const revenue = getRevenue();
  const state = revenue.states.find((item) => item.id === scope);
  return {
    scope,
    name: state?.name || "36 states and FCT combined",
    revenueYear: revenue.year,
    referenceRevenueNaira: state?.totalNaira ?? revenue.totalNaira,
    sourceId: revenue.sourceId,
    warning:
      "IGR (money the state raises itself) isn't the whole budget, and it isn't cash waiting for new projects. Federal transfers, debt, and money already committed are left out.",
  };
}
