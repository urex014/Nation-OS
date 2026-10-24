import { connection } from "next/server";
import { GovernmentDesk } from "../../../components/dashboard/government-desk";
import { requireRole } from "../../../lib/auth/current";
import { publicMoneySnapshot } from "../../../lib/nigeria/baseline.mjs";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const metadata = { title: "Government desk · NationOS" };

export default async function Page() {
  await connection();
  const user = await requireRole("government");
  return <GovernmentDesk user={user} snapshot={await publicMoneySnapshot()} />;
}
