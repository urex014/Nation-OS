-- Shared runtime data for NationOS. Safe to run more than once.
-- Published revenue, budget, ledger rows, and sources stay in SQLite.
-- unique (lower(email)) means A@b.com and a@b.com are the same person.
-- The two demonstration accounts are not stored here.

create table if not exists users (
  id text primary key,
  email text not null,
  name text not null,
  agency text not null,
  role text not null check (role in ('government', 'citizen')),
  password_hash text not null,
  created_at timestamptz not null default now()
);

create unique index if not exists users_email_lower_key on users (lower(email));

create table if not exists plan_runs (
  id text primary key,
  config_json text not null,
  result_json text not null,
  source_snapshot_json text not null,
  created_at text not null
);

create table if not exists decisions (
  id text primary key,
  title text not null,
  reason text not null,
  run_id text not null references plan_runs (id),
  status text not null default 'Draft' check (status in ('Draft', 'Under review', 'Reviewed', 'Rejected')),
  revision integer not null default 1,
  created_at text not null,
  updated_at text not null
);

create index if not exists decisions_created on decisions (created_at desc, id desc);

create table if not exists audit_events (
  id bigint generated always as identity primary key,
  decision_id text not null references decisions (id),
  action text not null,
  details_json text not null,
  created_at text not null
);

create index if not exists audit_decision on audit_events (decision_id, id);

create table if not exists ledger_decisions (
  id text primary key,
  created_at text not null,
  title text not null,
  question text not null,
  horizon integer not null,
  strategy text not null,
  assumptions text not null,
  tradeoffs text not null,
  budgets text not null,
  revisions text not null
);

-- Government Project Intelligence Models
create table if not exists government_projects (
  id text primary key,
  canonical_id text not null,
  name text not null,
  description text,
  state text not null default 'Lagos',
  lga text,
  agency text not null,
  sector text not null,
  status text not null check (status in ('Planned', 'Procurement', 'Ongoing', 'Completed', 'Stalled', 'Abandoned', 'Cancelled', 'Unknown')),
  progress_percent integer not null default 0 check (progress_percent >= 0 and progress_percent <= 100),
  contract_sum_kobo bigint not null default 0,
  expended_kobo bigint not null default 0,
  start_date text,
  expected_completion_date text,
  actual_completion_date text,
  risk_level text not null default 'Low' check (risk_level in ('Low', 'Medium', 'High', 'Critical')),
  risk_indicators_json text not null default '[]',
  source_count integer not null default 1,
  last_verified_at text not null,
  created_at text not null,
  updated_at text not null
);

create unique index if not exists idx_gov_projects_canonical on government_projects (canonical_id);
create index if not exists idx_gov_projects_lga on government_projects (lga);
create index if not exists idx_gov_projects_sector on government_projects (sector);
create index if not exists idx_gov_projects_status on government_projects (status);
create index if not exists idx_gov_projects_risk on government_projects (risk_level);

create table if not exists project_sources (
  id text primary key,
  project_id text not null,
  publisher text not null,
  source_url text not null,
  original_project_id text not null,
  document_title text,
  page_number integer,
  publication_date text,
  retrieval_timestamp text not null,
  source_type text not null check (source_type in ('api', 'portal', 'pdf', 'ocds', 'report')),
  confidence real not null default 1.0,
  raw_payload_json text,
  created_at text not null
);

create index if not exists idx_project_sources_project on project_sources (project_id);
create unique index if not exists idx_project_sources_unique on project_sources (publisher, original_project_id, source_url);

create table if not exists project_financial_records (
  id text primary key,
  project_id text not null,
  record_type text not null check (record_type in ('allocation', 'contract_award', 'disbursement', 'expenditure')),
  amount_kobo bigint not null,
  currency text not null default 'NGN',
  fiscal_year integer not null,
  source_id text,
  description text,
  verified boolean not null default false,
  verified_by text,
  date_recorded text not null,
  created_at text not null
);

create index if not exists idx_financial_project on project_financial_records (project_id);
create index if not exists idx_financial_type on project_financial_records (record_type);

create table if not exists project_status_history (
  id text primary key,
  project_id text not null,
  reported_status text not null,
  progress_percent integer,
  observation_date text not null,
  publisher text not null,
  source_id text,
  remarks text,
  conflicting boolean not null default false,
  created_at text not null
);

create index if not exists idx_status_history_project on project_status_history (project_id, observation_date desc);

create table if not exists ingestion_jobs (
  id text primary key,
  source_name text not null,
  status text not null check (status in ('pending', 'running', 'success', 'failed', 'partial')),
  started_at text not null,
  completed_at text,
  records_retrieved integer not null default 0,
  records_created integer not null default 0,
  records_updated integer not null default 0,
  records_rejected integer not null default 0,
  error_details text,
  source_availability text not null default 'online' check (source_availability in ('online', 'degraded', 'offline')),
  created_at text not null
);

create index if not exists idx_ingestion_jobs_source on ingestion_jobs (source_name, started_at desc);

create table if not exists decision_analyses (
  id text primary key,
  title text not null,
  proposed_budget_kobo bigint not null,
  priority_weights_json text not null,
  selected_lga text,
  selected_sector text,
  allocation_results_json text not null,
  rationale text not null,
  evidence_citations_json text not null,
  created_by text,
  created_at text not null
);

create index if not exists idx_decision_analyses_date on decision_analyses (created_at desc);
