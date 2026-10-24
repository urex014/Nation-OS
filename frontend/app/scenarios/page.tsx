import { Lab } from "@/components/nigeria/lab";
import { scenarioInputs } from "@/lib/db/ledger";

export const dynamic = "force-dynamic";
export const metadata = { title: "Scenario Lab" };

export default function Page() {
  return <Lab {...scenarioInputs()} />;
}
