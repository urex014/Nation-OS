import { sources } from "../../lib/knowledge.mjs";
import { EvidenceExplorer } from "../../components/evidence/evidence-explorer";

// Only serializable aggregate records cross the server/client boundary.
export default function EvidencePage() {
  return <EvidenceExplorer sources={sources} />;
}
