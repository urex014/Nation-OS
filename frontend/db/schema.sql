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
