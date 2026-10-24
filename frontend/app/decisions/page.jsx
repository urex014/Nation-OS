import { listDecisions } from "../../lib/nigeria/decisions.mjs";
import { DecisionRecords } from "../../components/nigeria/decision-records";
export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export default function Page() {
  return <DecisionRecords initial={listDecisions()} />;
}
