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

export type ProjectFilter = {
  search?: string;
  lga?: string;
  status?: NormalizedStatus;
  sector?: string;
  riskLevel?: RiskLevel;
  source?: string;
  limit?: number;
  offset?: number;
};

export async function upsertGovernmentProject(p: GovernmentProject): Promise<void> {
  const db = getWriteDb();
  const stmt = db.prepare(`
    INSERT INTO government_projects (
      id, canonical_id, name, description, state, lga, agency, sector,
      status, progress_percent, contract_sum_kobo, expended_kobo,
      start_date, expected_completion_date, actual_completion_date,
      risk_level, risk_indicators_json, source_count, last_verified_at,
      created_at, updated_at
    ) VALUES (
      ?, ?, ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?,
      ?, ?, ?,
      ?, ?, ?, ?,
      ?, ?
    )
    ON CONFLICT(canonical_id) DO UPDATE SET
      name = excluded.name,
      description = excluded.description,
      lga = COALESCE(excluded.lga, government_projects.lga),
      agency = excluded.agency,
      sector = excluded.sector,
      status = excluded.status,
      progress_percent = excluded.progress_percent,
      contract_sum_kobo = CASE WHEN excluded.contract_sum_kobo > 0 THEN excluded.contract_sum_kobo ELSE government_projects.contract_sum_kobo END,
      expended_kobo = CASE WHEN excluded.expended_kobo > 0 THEN excluded.expended_kobo ELSE government_projects.expended_kobo END,
      start_date = COALESCE(excluded.start_date, government_projects.start_date),
      expected_completion_date = COALESCE(excluded.expected_completion_date, government_projects.expected_completion_date),
      actual_completion_date = COALESCE(excluded.actual_completion_date, government_projects.actual_completion_date),
      risk_level = excluded.risk_level,
      risk_indicators_json = excluded.risk_indicators_json,
      source_count = government_projects.source_count + 1,
      last_verified_at = excluded.last_verified_at,
      updated_at = excluded.updated_at
  `);
  stmt.run(
    p.id,
    p.canonicalId,
    p.name,
    p.description || "",
    p.state || "Lagos",
    p.lga || "",
    p.agency,
    p.sector,
    p.status,
    p.progressPercent,
    Number(p.contractSumKobo),
    Number(p.expendedKobo),
    p.startDate || null,
    p.expectedCompletionDate || null,
    p.actualCompletionDate || null,
    p.riskLevel,
    JSON.stringify(p.riskIndicators || []),
    p.sourceCount || 1,
    p.lastVerifiedAt,
    p.createdAt,
    p.updatedAt,
  );
}

export async function insertProjectSource(s: ProjectSource): Promise<void> {
  const db = getWriteDb();
  const stmt = db.prepare(`
    INSERT INTO project_sources (
      id, project_id, publisher, source_url, original_project_id,
      document_title, page_number, publication_date, retrieval_timestamp,
      source_type, confidence, raw_payload_json, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  stmt.run(
    s.id,
    s.projectId,
    s.publisher,
    s.sourceUrl,
    s.originalProjectId,
    s.documentTitle || null,
    s.pageNumber || null,
    s.publicationDate || null,
    s.retrievalTimestamp,
    s.sourceType,
    s.confidence,
    s.rawPayloadJson || null,
    s.createdAt,
  );
}

export async function insertFinancialRecord(f: ProjectFinancialRecord): Promise<void> {
  const db = getWriteDb();
  const stmt = db.prepare(`
    INSERT INTO project_financial_records (
      id, project_id, record_type, amount_kobo, currency,
      fiscal_year, source_id, description, verified, verified_by,
      date_recorded, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  stmt.run(
    f.id,
    f.projectId,
    f.recordType,
    Number(f.amountKobo),
    f.currency,
    f.fiscalYear,
    f.sourceId || null,
    f.description || null,
    f.verified ? 1 : 0,
    f.verifiedBy || null,
    f.dateRecorded,
    f.createdAt,
  );
}

export async function insertStatusObservation(o: ProjectStatusObservation): Promise<void> {
  const db = getWriteDb();
  const stmt = db.prepare(`
    INSERT INTO project_status_history (
      id, project_id, reported_status, progress_percent, observation_date,
      publisher, source_id, remarks, conflicting, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  stmt.run(
    o.id,
    o.projectId,
    o.reportedStatus,
    o.progressPercent !== undefined ? o.progressPercent : null,
    o.observationDate,
    o.publisher,
    o.sourceId || null,
    o.remarks || null,
    o.conflicting ? 1 : 0,
    o.createdAt,
  );
}

export async function recordIngestionJob(job: IngestionJob): Promise<void> {
  const db = getWriteDb();
  const stmt = db.prepare(`
    INSERT INTO ingestion_jobs (
      id, source_name, status, started_at, completed_at,
      records_retrieved, records_created, records_updated, records_rejected,
      error_details, source_availability, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      status = excluded.status,
      completed_at = excluded.completed_at,
      records_retrieved = excluded.records_retrieved,
      records_created = excluded.records_created,
      records_updated = excluded.records_updated,
      records_rejected = excluded.records_rejected,
      error_details = excluded.error_details,
      source_availability = excluded.source_availability
  `);
  stmt.run(
    job.id,
    job.sourceName,
    job.status,
    job.startedAt,
    job.completedAt || null,
    job.recordsRetrieved,
    job.recordsCreated,
    job.recordsUpdated,
    job.recordsRejected,
    job.errorDetails || null,
    job.sourceAvailability,
    job.createdAt,
  );
}
