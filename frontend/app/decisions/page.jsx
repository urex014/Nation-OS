import { connection } from "next/server";
import { Notice } from "../../components/nigeria/ui";
import { DecisionsSystem } from "../../components/intelligence/decisions-system";
import { currentUser } from "../../lib/auth/current";
import { listDecisions } from "../../lib/nigeria/decisions.mjs";
import {
  getDecisionsOverview,
  listProjects,
  getDataHealthSummary,
  listDecisionAnalyses,
} from "../../lib/intelligence/queries";
import { formatNaira, formatNairaCompact } from "../../lib/intelligence/money";
import { getLgaProfile } from "../../lib/intelligence/lga-sources";
import { getDb } from "../../lib/intelligence/db";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function Page() {
  await connection();
  const user = await currentUser();
  const canReview = user?.role === "government";

  let initialSaved = { records: [], total: 0, limit: 20, offset: 0, hasMore: false };
  try {
    initialSaved = await listDecisions();
  } catch (error) {
    // Expected when DATABASE_URL is unset; saved decisions stay isolated
  }

  const rawOverview = await getDecisionsOverview();
  const overview = {
    totalProjects: rawOverview.totalProjects,
    ongoingProjects: rawOverview.ongoingProjects,
    completedProjects: rawOverview.completedProjects,
    abandonedProjects: rawOverview.abandonedProjects,
    requiringVerification: rawOverview.requiringVerification,
    verifiedAllocationsFormatted: formatNaira(rawOverview.verifiedAllocationsKobo),
    verifiedAllocationsCompact: formatNairaCompact(rawOverview.verifiedAllocationsKobo),
    lastDataRefresh: rawOverview.lastDataRefresh,
  };

  const { projects: rawProjects, total: initialProjectsTotal } = await listProjects({ limit: 15, offset: 0 });
  const initialProjects = rawProjects.map((p) => ({
    ...p,
    contractSumKobo: p.contractSumKobo.toString(),
    expendedKobo: p.expendedKobo.toString(),
    contractSumFormatted: formatNaira(p.contractSumKobo),
    contractSumCompact: formatNairaCompact(p.contractSumKobo),
    expendedFormatted: formatNaira(p.expendedKobo),
  }));

  const healthData = await getDataHealthSummary();

  const { analyses: rawAnalyses, total: analysesTotal } = await listDecisionAnalyses(20, 0);
  const initialLgaProfile = getLgaProfile("Statewide");
  const decisionAnalyses = {
    total: analysesTotal,
    records: rawAnalyses.map((a) => ({
      ...a,
      proposedBudgetKobo: a.proposedBudgetKobo.toString(),
      proposedBudgetFormatted: formatNaira(a.proposedBudgetKobo),
      proposedBudgetCompact: formatNairaCompact(a.proposedBudgetKobo),
    })),
  };

  const sources = [
    {
      publisher: "Lagos State MEPB (PMR)",
      name: "Lagos State Project Performance Management Report",
      url: "https://pmr.lagosmepb.org/",
      coverage: "Lagos State Government capital projects across 20 LGAs & 37 LCDAs",
      status: "Verified & Connected",
      indexedCount: 2733,
      dataQuality: "Official state records with progress %, contracts, and MDA assignments",
    },
    {
      publisher: "BudgIT Tracka",
      name: "BudgIT Tracka Service Delivery & Project Tracking",
      url: "https://www.yourtracka.org/ng/projects",
      coverage: "Civic ground-truth monitoring of federal and state capital constituency projects",
      status: "Verified & Connected",
      indexedCount: 1324,
      dataQuality: "Citizen status tracking, ground photos, and disbursement observations",
    },
    {
      publisher: "Nigeria BPP (NOCOPO OCDS)",
      name: "Bureau of Public Procurement Open Contracting Portal",
      url: "https://data.open-contracting.org/en/publication/64",
      coverage: "Federal & State procurement plans, contract awards, and supplier details",
      status: "Verified & Connected",
      indexedCount: 1500,
      dataQuality: "Structured Open Contracting Data Standard (OCDS) releases",
    },
    {
      publisher: "Kaduna Open Contracting",
      name: "Kaduna State Open Contracting Portal",
      url: "https://www.ocds.kdsg.gov.ng/",
      coverage: "Kaduna State procurement data (isolated, non-Lagos)",
      status: "Degraded (MDA catalog online, transaction tables report 500)",
      indexedCount: 0,
      dataQuality: "Upstream server errors on transaction routes; isolated state tracking",
    },
  ];

  return (
    <DecisionsSystem
      overview={overview}
      initialProjects={initialProjects}
      initialProjectsTotal={initialProjectsTotal}
      sources={sources}
      healthData={healthData}
      canReview={canReview}
      initialSavedDecisions={initialSaved}
      decisionAnalyses={decisionAnalyses}
      initialLgaProfile={initialLgaProfile}
    />
  );
}
