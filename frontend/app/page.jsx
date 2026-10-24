import { getOverview } from "../lib/nigeria/repository.mjs";
import { Overview } from "../components/nigeria/overview";
export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export default function Page() {
  return <Overview data={getOverview()} />;
}
