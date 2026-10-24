import { Overview } from "@/components/nigeria/overview";
import { readOverview } from "@/lib/db/overview";
import { readRevenue } from "@/lib/db/revenue";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";
export const metadata = { title: "National Overview" };

export default function Page() {
  const data = readOverview(2026, "all");
  const revenue = readRevenue(2026);
  if (!data || !revenue) notFound();
  return <Overview data={data} revenue={revenue} />;
}
