import { CitizenDesk } from "../../../components/dashboard/citizen-desk";
import { requireRole } from "../../../lib/auth/current";
import { publicMoneySnapshot } from "../../../lib/nigeria/baseline.mjs";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const metadata = { title: "Citizen desk · NationOS" };

export default async function Page() {
  const user = await requireRole("citizen");
  return <CitizenDesk user={user} snapshot={publicMoneySnapshot()} />;
}
