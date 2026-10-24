-- Money from NBS is integer kobo. Analytical observations retain their original units.
pragma foreign_keys = on;
create table if not exists sources (
  id text primary key,
  metadata_json text not null check (json_valid(metadata_json))
);
create table if not exists jurisdictions (
  id text primary key,
  name text not null unique,
  type text not null check (type in ('state', 'territory')),
  geometry_json text not null check (json_valid(geometry_json)),
  source_id text not null references sources(id)
);
create table if not exists indicators (
  code text not null,
  year integer not null,
  name text not null,
  value real,
  source_id text not null references sources(id),
  primary key (code, year)
);
create table if not exists state_revenue (
  state_id text not null references jurisdictions(id),
  year integer not null,
  total_kobo integer not null check (total_kobo >= 0),
  tax_kobo integer,
  other_kobo integer,
  other_label text not null,
  components_json text not null check (json_valid(components_json)),
  reconciliation_kobo integer,
  source_name text not null,
  source_id text not null references sources(id),
  primary key (state_id, year)
);
create index if not exists revenue_year_total on state_revenue(year, total_kobo desc);
create table if not exists federal_budgets (
  year integer primary key,
  approved_naira integer not null check (approved_naira > 0),
  metadata_json text not null check (json_valid(metadata_json)),
  source_id text not null references sources(id)
);
create table if not exists plan_runs (
  id text primary key,
  config_json text not null check (json_valid(config_json)),
  result_json text not null check (json_valid(result_json)),
  source_snapshot_json text not null check (json_valid(source_snapshot_json)),
  created_at text not null default (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
create table if not exists decisions (
  id text primary key,
  title text not null,
  reason text not null,
  run_id text not null references plan_runs(id),
  status text not null default 'Draft' check (status in ('Draft','Under review','Reviewed','Rejected')),
  revision integer not null default 1,
  created_at text not null default (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at text not null default (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
create index if not exists decisions_created on decisions(created_at desc, id);
create table if not exists audit_events (
  id integer primary key autoincrement,
  decision_id text not null references decisions(id),
  action text not null,
  details_json text not null check (json_valid(details_json)),
  created_at text not null default (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
create index if not exists audit_decision on audit_events(decision_id, id);
