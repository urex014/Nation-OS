import { Revenue } from "@/components/nigeria/revenue";
import { readRevenue } from "@/lib/db/revenue";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";
export const metadata = { title: "Budget & Revenue" };

export default function Page() {
  const data = readRevenue(2026);
  if (!data) notFound();
  return <Revenue data={data} />;
}
