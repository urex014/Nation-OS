import { connection } from "next/server";
import { DecisionRecords } from "../../components/nigeria/decision-records";
import { currentUser } from "../../lib/auth/current";
import { listDecisions } from "../../lib/nigeria/decisions.mjs";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function Page() {
  await connection();
  const user = await currentUser();
  const initial = await listDecisions();
  return <DecisionRecords initial={initial} canReview={user?.role === "government"} />;
}
