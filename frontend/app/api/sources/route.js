import { api } from "../../../lib/nigeria/http.mjs";
import { getSources } from "../../../lib/nigeria/repository.mjs";
import { getDatabase } from "../../../lib/nigeria/database.mjs";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const GET = api(() => ({
  sources: getSources(),
  coverage: {
    jurisdictions: getDatabase().prepare("select count(*) as n from jurisdictions").get().n,
    stateYearRows: getDatabase().prepare("select count(*) as n from state_revenue").get().n,
    indicatorRows: getDatabase().prepare("select count(*) as n from indicators").get().n,
    missingIndicatorValues: getDatabase()
      .prepare("select count(*) as n from indicators where value is null")
      .get().n,
  },
}));
