import { DecisionRecords } from "../../components/nigeria/decision-records";
import { currentUser } from "../../lib/auth/current";
import { listDecisions } from "../../lib/nigeria/decisions.mjs";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function Page() {
  const user = await currentUser();
  return <DecisionRecords initial={listDecisions()} canReview={user?.role === "government"} />;
}
