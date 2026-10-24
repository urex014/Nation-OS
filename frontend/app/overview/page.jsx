import { Overview } from "../../components/nigeria/overview";
import { getOverview } from "../../lib/nigeria/repository.mjs";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const metadata = { title: "National overview · NationOS" };

export default function Page() {
  return <Overview data={getOverview()} />;
}
