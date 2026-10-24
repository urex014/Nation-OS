import { api } from "../../../../lib/nigeria/http.mjs";
import { getDb } from "../../../../lib/intelligence/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = api(async () => {
  const db = getDb();
  const counts: any[] = db
    .prepare("SELECT publisher, COUNT(*) as count, MAX(retrieval_timestamp) as last_retrieval FROM project_sources GROUP BY publisher")
    .all();

  const countMap = new Map(counts.map((c) => [c.publisher, c]));

  const catalog = [
    {
      publisher: "Lagos State MEPB (PMR)",
      name: "Lagos State Project Performance Management Report",
      url: "https://pmr.lagosmepb.org/",
      sourceType: "api",
      coverage: "Lagos State Government capital projects across 20 LGAs & 37 LCDAs",
      status: "Verified & Connected",
      indexedCount: countMap.get("Lagos State MEPB (PMR)")?.count || 0,
      lastRetrieval: countMap.get("Lagos State MEPB (PMR)")?.last_retrieval || null,
      dataQuality: "Official state records with progress %, contracts, and MDA assignments",
    },
    {
      publisher: "BudgIT Tracka",
      name: "BudgIT Tracka Service Delivery & Project Tracking",
      url: "https://www.yourtracka.org/ng/projects",
      sourceType: "portal",
      coverage: "Civic ground-truth monitoring of federal and state capital constituency projects",
      status: "Verified & Connected",
      indexedCount: countMap.get("BudgIT Tracka")?.count || 0,
      lastRetrieval: countMap.get("BudgIT Tracka")?.last_retrieval || null,
      dataQuality: "Citizen status tracking, ground photos, and disbursement observations",
    },
    {
      publisher: "Nigeria BPP (NOCOPO OCDS)",
      name: "Bureau of Public Procurement Open Contracting Portal",
      url: "https://data.open-contracting.org/en/publication/64",
      sourceType: "ocds",
      coverage: "Federal & State procurement plans, contract awards, and supplier details",
      status: "Verified & Connected",
      indexedCount: countMap.get("Nigeria BPP (NOCOPO OCDS)")?.count || 0,
      lastRetrieval: countMap.get("Nigeria BPP (NOCOPO OCDS)")?.last_retrieval || null,
      dataQuality: "Structured Open Contracting Data Standard (OCDS) releases",
    },
    {
      publisher: "Kaduna Open Contracting",
      name: "Kaduna State Open Contracting Portal",
      url: "https://www.ocds.kdsg.gov.ng/",
      sourceType: "portal",
      coverage: "Kaduna State procurement data (isolated, non-Lagos)",
      status: "Degraded (MDA catalog online, transaction tables report 500)",
      indexedCount: 0,
      lastRetrieval: null,
      dataQuality: "Upstream server errors on transaction routes; isolated state tracking",
    },
  ];

  return { sources: catalog };
});
