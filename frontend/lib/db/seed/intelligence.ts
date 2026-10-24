import fs from "node:fs";
import path from "node:path";
import type { DatabaseSync } from "node:sqlite";

type IntelligenceSeedData = {
  government_projects: any[];
  project_sources: any[];
  project_financial_records: any[];
  ingestion_jobs: any[];
  decision_analyses: any[];
};

export function loadIntelligenceSeedData(): IntelligenceSeedData | null {
  const candidates = [
    path.resolve(process.cwd(), "data/intelligence/normalized/published-intelligence.json"),
    path.resolve(process.cwd(), "frontend/data/intelligence/normalized/published-intelligence.json"),
    path.resolve(import.meta.dirname, "../../../data/intelligence/normalized/published-intelligence.json"),
  ];

  for (const p of candidates) {
    if (fs.existsSync(p)) {
      try {
        return JSON.parse(fs.readFileSync(p, "utf8")) as IntelligenceSeedData;
      } catch {
        // Continue to next candidate
      }
    }
  }
  return null;
}

export function seedIntelligence(db: DatabaseSync): void {
  const data = loadIntelligenceSeedData();
  if (!data) return;

  const insGp = db.prepare(`
    INSERT OR REPLACE INTO government_projects (
      id, canonical_id, name, description, state, lga, agency, sector, status,
      progress_percent, contract_sum_kobo, expended_kobo, start_date,
      expected_completion_date, actual_completion_date, risk_level,
      risk_indicators_json, source_count, last_verified_at, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const p of data.government_projects || []) {
    insGp.run(
      p.id,
      p.canonical_id,
      p.name,
      p.description,
      p.state,
      p.lga,
      p.agency,
      p.sector,
      p.status,
      p.progress_percent,
      p.contract_sum_kobo,
      p.expended_kobo,
      p.start_date,
      p.expected_completion_date,
      p.actual_completion_date,
      p.risk_level,
      p.risk_indicators_json,
      p.source_count,
      p.last_verified_at,
      p.created_at,
      p.updated_at,
    );
  }

  const insPs = db.prepare(`
    INSERT OR REPLACE INTO project_sources (
      id, project_id, publisher, source_url, original_project_id, document_title,
      page_number, publication_date, retrieval_timestamp, source_type, confidence,
      raw_payload_json, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const s of data.project_sources || []) {
    insPs.run(
      s.id,
      s.project_id,
      s.publisher,
      s.source_url,
      s.original_project_id,
      s.document_title,
      s.page_number,
      s.publication_date,
      s.retrieval_timestamp,
      s.source_type,
      s.confidence,
      s.raw_payload_json,
      s.created_at,
    );
  }

  const insPfr = db.prepare(`
    INSERT OR REPLACE INTO project_financial_records (
      id, project_id, record_type, amount_kobo, currency, fiscal_year,
      source_id, description, verified, verified_by, date_recorded, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const f of data.project_financial_records || []) {
    insPfr.run(
      f.id,
      f.project_id,
      f.record_type,
      f.amount_kobo,
      f.currency,
      f.fiscal_year,
      f.source_id,
      f.description,
      f.verified,
      f.verified_by,
      f.date_recorded,
      f.created_at,
    );
  }

  const insJob = db.prepare(`
    INSERT OR REPLACE INTO ingestion_jobs (
      id, source_name, status, started_at, completed_at, records_retrieved,
      records_created, records_updated, records_rejected, error_details,
      source_availability, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const j of data.ingestion_jobs || []) {
    insJob.run(
      j.id,
      j.source_name,
      j.status,
      j.started_at,
      j.completed_at,
      j.records_retrieved,
      j.records_created,
      j.records_updated,
      j.records_rejected,
      j.error_details,
      j.source_availability,
      j.created_at,
    );
  }

  const insDa = db.prepare(`
    INSERT OR REPLACE INTO decision_analyses (
      id, title, proposed_budget_kobo, priority_weights_json, selected_lga,
      selected_sector, allocation_results_json, rationale, evidence_citations_json,
      created_by, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const a of data.decision_analyses || []) {
    insDa.run(
      a.id,
      a.title,
      a.proposed_budget_kobo,
      a.priority_weights_json,
      a.selected_lga,
      a.selected_sector,
      a.allocation_results_json,
      a.rationale,
      a.evidence_citations_json,
      a.created_by,
      a.created_at,
    );
  }
}
