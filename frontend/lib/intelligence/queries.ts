import { getReadDb, getWriteDb } from "./db";
import type {
  GovernmentProject,
  ProjectSource,
  ProjectFinancialRecord,
  ProjectStatusObservation,
  IngestionJob,
  DecisionAnalysis,
  NormalizedStatus,
  RiskLevel,
  RiskIndicator,
} from "./types";
import type { ProjectFilter } from "./store";

function mapRowToProject(r: any): GovernmentProject {
  return {
    id: r.id,
    canonicalId: r.canonical_id,
    name: r.name,
    description: r.description || "",
    state: r.state,
    lga: r.lga || "",
    agency: r.agency,
    sector: r.sector,
    status: r.status as NormalizedStatus,
    progressPercent: Number(r.progress_percent || 0),
    contractSumKobo: BigInt(r.contract_sum_kobo || 0),
    expendedKobo: BigInt(r.expended_kobo || 0),
    startDate: r.start_date,
    expectedCompletionDate: r.expected_completion_date,
    actualCompletionDate: r.actual_completion_date,
    riskLevel: r.risk_level as RiskLevel,
    riskIndicators: r.risk_indicators_json ? (JSON.parse(r.risk_indicators_json) as RiskIndicator[]) : [],
    sourceCount: Number(r.source_count || 1),
    primarySource: r.canonical_id?.startsWith("LAGOS-PMR")
      ? "Lagos MEPB (PMR)"
      : r.canonical_id?.startsWith("TRACKA")
      ? "BudgIT Tracka"
      : r.canonical_id?.startsWith("BPP")
      ? "Nigeria BPP NOCOPO"
      : "Kaduna OCDS",
    lastVerifiedAt: r.last_verified_at,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

export async function listProjects(filter: ProjectFilter = {}): Promise<{ projects: GovernmentProject[]; total: number }> {
  const db = getReadDb();
  const conditions: string[] = [];
  const params: any[] = [];

  if (filter.search?.trim()) {
    conditions.push("(name LIKE ? OR description LIKE ? OR agency LIKE ? OR lga LIKE ?)");
    const term = `%${filter.search.trim()}%`;
    params.push(term, term, term, term);
  }
  if (filter.lga?.trim()) {
    conditions.push("LOWER(lga) = LOWER(?)");
    params.push(filter.lga.trim());
  }
  if (filter.status?.trim()) {
    conditions.push("status = ?");
    params.push(filter.status.trim());
  }
  if (filter.sector?.trim()) {
    conditions.push("LOWER(sector) = LOWER(?)");
    params.push(filter.sector.trim());
  }
  if (filter.riskLevel?.trim()) {
    conditions.push("risk_level = ?");
    params.push(filter.riskLevel.trim());
  }
  if (filter.source?.trim()) {
    const src = filter.source.trim().toLowerCase();
    if (src === "pmr") conditions.push("canonical_id LIKE 'LAGOS-PMR-%'");
    else if (src === "tracka") conditions.push("canonical_id LIKE 'TRACKA-%'");
    else if (src === "bpp") conditions.push("canonical_id LIKE 'BPP-%'");
    else if (src === "kaduna") conditions.push("canonical_id LIKE 'KADUNA-%'");
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
  const countRow: any = db.prepare(`SELECT COUNT(*) as count FROM government_projects ${whereClause}`).get(...params);
  const total = Number(countRow?.count || 0);

  const limit = Math.min(Math.max(filter.limit || 20, 1), 100);
  const offset = Math.max(filter.offset || 0, 0);

  const rows: any[] = db
    .prepare(`
      SELECT * FROM government_projects
      ${whereClause}
      ORDER BY updated_at DESC, id DESC
      LIMIT ? OFFSET ?
    `)
    .all(...params, limit, offset);

  return { projects: rows.map(mapRowToProject), total };
}

export async function getProjectById(id: string): Promise<{
  project: GovernmentProject;
  sources: ProjectSource[];
  financials: ProjectFinancialRecord[];
  statusHistory: ProjectStatusObservation[];
} | null> {
  const db = getReadDb();
  const row: any = db.prepare("SELECT * FROM government_projects WHERE id = ? OR canonical_id = ?").get(id, id);
  if (!row) return null;

  const project = mapRowToProject(row);
  const sources: any[] = db.prepare("SELECT * FROM project_sources WHERE project_id = ? ORDER BY retrieval_timestamp DESC").all(project.id);
  const financials: any[] = db.prepare("SELECT * FROM project_financial_records WHERE project_id = ? ORDER BY date_recorded DESC").all(project.id);
  const statusHistory: any[] = db.prepare("SELECT * FROM project_status_history WHERE project_id = ? ORDER BY observation_date DESC").all(project.id);

  return {
    project,
    sources: sources.map((s) => ({
      id: s.id,
      projectId: s.project_id,
      publisher: s.publisher,
      sourceUrl: s.source_url,
      originalProjectId: s.original_project_id,
      documentTitle: s.document_title,
      pageNumber: s.page_number,
      publicationDate: s.publication_date,
      retrievalTimestamp: s.retrieval_timestamp,
      sourceType: s.source_type,
      confidence: Number(s.confidence || 1.0),
      rawPayloadJson: s.raw_payload_json,
      createdAt: s.created_at,
    })),
    financials: financials.map((f) => ({
      id: f.id,
      projectId: f.project_id,
      recordType: f.record_type,
      amountKobo: BigInt(f.amount_kobo || 0),
      currency: f.currency,
      fiscalYear: Number(f.fiscal_year),
      sourceId: f.source_id,
      description: f.description,
      verified: Boolean(f.verified),
      verifiedBy: f.verified_by,
      dateRecorded: f.date_recorded,
      createdAt: f.created_at,
    })),
    statusHistory: statusHistory.map((h) => ({
      id: h.id,
      projectId: h.project_id,
      reportedStatus: h.reported_status,
      progressPercent: h.progress_percent !== null ? Number(h.progress_percent) : undefined,
      observationDate: h.observation_date,
      publisher: h.publisher,
      sourceId: h.source_id,
      remarks: h.remarks,
      conflicting: Boolean(h.conflicting),
      createdAt: h.created_at,
    })),
  };
}

export async function getProjectSources(projectId: string): Promise<ProjectSource[]> {
  const db = getReadDb();
  const rows: any[] = db.prepare("SELECT * FROM project_sources WHERE project_id = ?").all(projectId);
  return rows.map((s) => ({
    id: s.id,
    projectId: s.project_id,
    publisher: s.publisher,
    sourceUrl: s.source_url,
    originalProjectId: s.original_project_id,
    documentTitle: s.document_title,
    pageNumber: s.page_number,
    publicationDate: s.publication_date,
    retrievalTimestamp: s.retrieval_timestamp,
    sourceType: s.source_type,
    confidence: Number(s.confidence || 1.0),
    rawPayloadJson: s.raw_payload_json,
    createdAt: s.created_at,
  }));
}

export async function getDecisionsOverview() {
  const db = getReadDb();
  const totalRow: any = db.prepare("SELECT COUNT(*) as total FROM government_projects").get();
  const ongoingRow: any = db.prepare("SELECT COUNT(*) as ongoing FROM government_projects WHERE status = 'Ongoing'").get();
  const completedRow: any = db.prepare("SELECT COUNT(*) as completed FROM government_projects WHERE status = 'Completed'").get();
  const abandonedRow: any = db.prepare("SELECT COUNT(*) as abandoned FROM government_projects WHERE status = 'Abandoned'").get();
  const verificationRow: any = db.prepare("SELECT COUNT(*) as verify FROM government_projects WHERE risk_level IN ('High', 'Critical') OR status = 'Unknown'").get();
  const financeRow: any = db.prepare("SELECT SUM(contract_sum_kobo) as total_kobo FROM government_projects").get();
  const lastSyncRow: any = db.prepare("SELECT MAX(completed_at) as last_sync FROM ingestion_jobs WHERE status = 'success'").get();

  return {
    totalProjects: Number(totalRow?.total || 0),
    ongoingProjects: Number(ongoingRow?.ongoing || 0),
    completedProjects: Number(completedRow?.completed || 0),
    abandonedProjects: Number(abandonedRow?.abandoned || 0),
    requiringVerification: Number(verificationRow?.verify || 0),
    verifiedAllocationsKobo: BigInt(financeRow?.total_kobo || 0),
    lastDataRefresh: lastSyncRow?.last_sync || null,
  };
}

export async function getDataHealthSummary() {
  const db = getReadDb();
  const jobs: any[] = db.prepare("SELECT * FROM ingestion_jobs ORDER BY started_at DESC LIMIT 15").all();
  const sourcesRow: any[] = db.prepare("SELECT publisher, COUNT(*) as count FROM project_sources GROUP BY publisher").all();

  return {
    sources: sourcesRow.map((s) => ({ publisher: s.publisher, count: Number(s.count) })),
    recentJobs: jobs.map((j) => ({
      id: j.id,
      sourceName: j.source_name,
      status: j.status,
      startedAt: j.started_at,
      completedAt: j.completed_at,
      recordsRetrieved: Number(j.records_retrieved),
      recordsCreated: Number(j.records_created),
      recordsUpdated: Number(j.records_updated),
      recordsRejected: Number(j.records_rejected),
      errorDetails: j.error_details,
      sourceAvailability: j.source_availability,
    })),
  };
}

export async function saveDecisionAnalysis(a: DecisionAnalysis): Promise<void> {
  const db = getWriteDb();
  const stmt = db.prepare(`
    INSERT INTO decision_analyses (
      id, title, proposed_budget_kobo, priority_weights_json,
      selected_lga, selected_sector, allocation_results_json,
      rationale, evidence_citations_json, created_by, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  stmt.run(
    a.id,
    a.title,
    Number(a.proposedBudgetKobo),
    JSON.stringify(a.priorityWeights),
    a.selectedLga || null,
    a.selectedSector || null,
    JSON.stringify(a.allocationResults, (key, value) => (typeof value === "bigint" ? value.toString() : value)),
    a.rationale,
    JSON.stringify(a.evidenceCitations),
    a.createdBy || null,
    a.createdAt,
  );
}

export async function getDecisionAnalysis(id: string): Promise<DecisionAnalysis | null> {
  const db = getReadDb();
  const row: any = db.prepare("SELECT * FROM decision_analyses WHERE id = ?").get(id);
  if (!row) return null;
  return {
    id: row.id,
    title: row.title,
    proposedBudgetKobo: BigInt(row.proposed_budget_kobo || 0),
    priorityWeights: JSON.parse(row.priority_weights_json),
    selectedLga: row.selected_lga || undefined,
    selectedSector: row.selected_sector || undefined,
    allocationResults: JSON.parse(row.allocation_results_json),
    rationale: row.rationale,
    evidenceCitations: JSON.parse(row.evidence_citations_json),
    createdBy: row.created_by || undefined,
    createdAt: row.created_at,
  };
}

export async function listDecisionAnalyses(limit = 20, offset = 0) {
  const db = getReadDb();
  const countRow: any = db.prepare("SELECT COUNT(*) as count FROM decision_analyses").get();
  const total = Number(countRow?.count || 0);
  const rows: any[] = db
    .prepare("SELECT * FROM decision_analyses ORDER BY created_at DESC LIMIT ? OFFSET ?")
    .all(limit, offset);
  const analyses = rows.map((r) => ({
    id: r.id,
    title: r.title,
    proposedBudgetKobo: BigInt(r.proposed_budget_kobo || 0),
    priorityWeights: JSON.parse(r.priority_weights_json || "{}"),
    selectedLga: r.selected_lga || undefined,
    selectedSector: r.selected_sector || undefined,
    allocationResults: JSON.parse(r.allocation_results_json || "{}"),
    rationale: r.rationale,
    evidenceCitations: JSON.parse(r.evidence_citations_json || "[]"),
    createdBy: r.created_by || undefined,
    createdAt: r.created_at,
  }));
  return { analyses, total };
}
