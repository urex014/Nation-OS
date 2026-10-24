import { connection } from "next/server";
import { Notice } from "../../components/nigeria/ui";
import { DecisionRecords } from "../../components/nigeria/decision-records";
import { currentUser } from "../../lib/auth/current";
import { listDecisions } from "../../lib/nigeria/decisions.mjs";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function Page() {
  await connection();
  const user = await currentUser();
  let initial = { records: [], total: 0, limit: 20, offset: 0, hasMore: false };
  let notice = "";
  let canReview = user?.role === "government";
  try {
    initial = await listDecisions();
  } catch (error) {
    canReview = false;
    notice =
      error?.status === 503
        ? error.message
        : "We couldn't load saved decisions. Try again in a moment.";
  }
  return (
    <>
      {notice ? <Notice error>{notice}</Notice> : null}
      <DecisionRecords initial={initial} canReview={canReview} />
    </>
  );
}
