import { TaxWhatIf } from "../../components/dashboard/tax-what-if";
import { IntelligenceChat } from "../../components/nigeria/intelligence-chat";
import { publicMoneySnapshot } from "../../lib/nigeria/baseline.mjs";
import { getJurisdictions } from "../../lib/nigeria/repository.mjs";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function Page() {
  return (
    <IntelligenceChat jurisdictions={getJurisdictions()}>
      <TaxWhatIf snapshot={await publicMoneySnapshot()} />
    </IntelligenceChat>
  );
}
