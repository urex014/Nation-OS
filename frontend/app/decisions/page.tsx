import { Decisions } from "@/components/nigeria/decisions";
import { listDecisions } from "@/lib/db/decisions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Decision Records" };

export default function Page() {
  return <Decisions records={listDecisions()} />;
}
