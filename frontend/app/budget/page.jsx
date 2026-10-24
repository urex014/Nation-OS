import { getJurisdictions } from "../../lib/nigeria/repository.mjs";
import { IntelligenceChat } from "../../components/nigeria/intelligence-chat";
export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export default function Page() {
  return <IntelligenceChat jurisdictions={getJurisdictions()} />;
}
