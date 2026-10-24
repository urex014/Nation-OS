import { Landing } from "../components/public/landing";
import { currentUser } from "../lib/auth/current";
import { evidenceSnapshot } from "../lib/auth/evidence.mjs";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "NationOS",
  description:
    "Budget planning, tax allocation insight, and decision records for Lagos State government agencies.",
};

export default async function Page() {
  const user = await currentUser();
  return <Landing user={user} evidence={evidenceSnapshot()} />;
}
