import { getRevenue, getRevenueHistory, getJurisdictions } from "../../lib/nigeria/repository.mjs";
import { Revenue } from "../../components/nigeria/revenue";
export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export default function Page() {
  return (
    <Revenue
      jurisdictions={getJurisdictions()}
      initial={{
        revenue: getRevenue(),
        scope: "NG-LA",
        compare: "NG-RI",
        history: getRevenueHistory("NG-LA"),
        comparison: getRevenueHistory("NG-RI"),
      }}
    />
  );
}
