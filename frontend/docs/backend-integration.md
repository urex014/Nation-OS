# Backend contract and SQLite handover

This application already has a backend: Next.js route handlers in `app/api/`. The following contract describes the current implementation, not a future service that must be supplied separately.

## Runtime and conventions

- Node.js 24; native `node:sqlite`; Next App Router route handlers use `runtime = "nodejs"`.
- Responses are JSON. Successful responses are HTTP 200, including creation.
- Errors are `{"error":"human-readable message"}`.
- Client requests use the same origin. Explicit foreign Origin headers are rejected for writes.
- The origin check recognizes Next's request URL, the browser-facing Host header and browser-protected Sec-Fetch-Site: same-origin metadata (which survives preview proxies). Same-site/cross-site metadata does not bypass the check; forwarded headers cannot authorize writes. For a trusted proxy whose client omits Fetch Metadata, set NATIONOS_ALLOWED_ORIGINS to its exact public origin (comma-separated for multiple origins); restart after changing configuration.
- Writes require application/json and a body of at most 16,000 streamed bytes.
- There is no authentication or authorization. This is a loopback-bound single-operator workspace.
- Unknown data is null; zero is a measured/calculated zero. Do not silently replace one with the other.
- Units are part of the contract: API money is naira; revenue storage is integer kobo; national GDP is current USD.
- Dates are ISO UTC strings; reporting years are integers.
- Reads use no-store. Generic unexpected server errors do not expose internal database paths.

## Read endpoints

The conversational endpoint is documented separately in [Project Intelligence chat](chat.md): POST `/api/chat` accepts a message, validated follow-up context and optional planning configuration. It returns sourced paragraphs, optional tables and optional plan calculations without persisting a decision.

| Method/path            | Input                                                           | Response                                                                           |
| ---------------------- | --------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| GET /api/overview      | None                                                            | Country, indicators, federal budget, combined revenue, history, map paths, sources |
| GET /api/revenue       | year optional, scope optional ISO/all, compare optional ISO/all | revenue, scope, compare, history, comparison                                       |
| GET /api/sources       | None                                                            | sources and coverage counts                                                        |
| GET /api/decisions     | limit 1–100 (default 20), offset ≥0                             | records, total, limit, offset, hasMore                                             |
| GET /api/decisions/:id | Existing UUID                                                   | Complete decision, original result/source snapshots and ordered audit events       |

A revenue response contains:

```json
{
  "revenue": {
    "year": 2025,
    "years": [2025, 2024, 2023, 2022, 2021, 2020, 2019],
    "coverage": 37,
    "sourceId": "nbs-igr-2019-2025",
    "states": []
  },
  "scope": "NG-LA",
  "compare": "NG-RI",
  "history": [],
  "comparison": []
}
```

The abbreviated revenue object also includes combined totalNaira, taxNaira, otherNaira and a scope warning. Each state row has id, name, type, rank, totalNaira, taxNaira, otherNaira, otherLabel, sourceName, sourceId, components, growthPercent, nationalSharePercent and reconciliationKobo. Each component has label and naira (nullable). Histories contain year/totalNaira pairs.

Rank uses total nominal IGR, with SQL competition ranking for ties. Annual growth is null without a positive preceding observation. It is not real growth or causal evidence.

Indicator objects have code, label, unit, note, value, year, sourceId and series. Series contain available non-null year/value pairs. Federal budget includes year, scope, approvedNaira, classification, note and sourceId. Map entries contain ISO id, name, SVG path and sourceId.

Coverage returns jurisdictions, stateYearRows, indicatorRows and missingIndicatorValues.

## Planning input

POST /api/plans and POST /api/scenarios accept `{"config": ...}`:

```json
{
  "config": {
    "scope": "NG-LA",
    "years": 5,
    "startYear": 2027,
    "annualBudgetNaira": 6000000000,
    "inflation": 15,
    "budgetGrowth": 0,
    "revenueGrowth": 0,
    "delivery": 80,
    "maintenance": 20,
    "allocations": {
      "education": 1000000000,
      "health": 1000000000,
      "transport": 1000000000,
      "agriculture": 1000000000,
      "energy": 1000000000,
      "water": 1000000000
    }
  }
}
```

| Field             | Validation/meaning                                                                   |
| ----------------- | ------------------------------------------------------------------------------------ |
| scope             | all or a known Nigerian state/FCT ISO identifier                                     |
| years             | Exactly 5 or 10                                                                      |
| startYear         | Integer 2026–2040                                                                    |
| annualBudgetNaira | Positive safe integer, at most ₦100tn                                                |
| allocations       | Exactly the six sector keys, non-negative whole naira, sum exactly annualBudgetNaira |
| inflation         | Finite percent 0–100                                                                 |
| budgetGrowth      | Finite percent −20–25                                                                |
| revenueGrowth     | Finite percent −20–25                                                                |
| delivery          | Finite percent 0–100                                                                 |
| maintenance       | Finite percent 0–50                                                                  |

The model strips unknown top-level configuration fields. All rates are assumptions. The observed IGR baseline comes from SQLite, never from a client-supplied context.

POST /api/plans returns `{runId,result,sources}` and persists a run. Result contains:

- version, validated config and context (scope, name, revenueYear, referenceRevenueNaira, sourceId, warning).
- annual rows: year, nominalNaira, constantPriceNaira, maintenanceNaira, deliveryAdjustedCapitalNaira, constantPriceCapitalNaira, projectedIgrNaira, investmentToIgrPercent.
- totals: nominalNaira, constantPriceNaira, deliveryAdjustedCapitalNaira.
- flags, formulas, limitations and roadmap, each an array of strings.

POST /api/scenarios returns `{scenarios:[{id,label,change,result}]}`. It calculates the four documented cases without storing them as decision records.

## Allocation preferences

POST /api/allocations:

```json
{ "annualBudgetNaira": 6000000000, "strategy": "balanced" }
```

Strategies: balanced, social, infrastructure. Output: allocations, strategy, label, fractional weights and explanation. Total rounding uses largest remainders so the sum remains exact. See constants.mjs for declared weights. The response is a preference aid, not a learned policy recommendation.

## Save a decision

POST /api/decisions:

```text
{
  title: nonempty string, at most 160 characters,
  reason: nonempty string, at most 4000 characters,
  config: the complete planning configuration
}
```

The server validates and recomputes the configuration. Any supplied run result is ignored. A single transaction inserts a plan run, Draft decision and creation event. It returns the full decision:

```text
{
  id, title, reason, status, revision, createdAt, updatedAt,
  result: original model result,
  sources: original source metadata array,
  audit: [{action, details, createdAt}]
}
```

Run/source snapshots are immutable through this API. Review does not recalculate historical data.

## Review a decision

PATCH /api/decisions/:id:

```json
{ "status": "Under review", "expectedRevision": 1 }
```

Allowed statuses: Draft, Under review, Reviewed, Rejected. The API permits any allowed status transition; it is a record of a local review, not a statutory workflow. A transaction updates status, increments revision and appends an audit event.

A stale revision returns HTTP 409. Reload the record and let the operator inspect it before retrying. There are no delete or bulk overwrite endpoints.

Other errors: 400 validation, 403 origin, 404 unknown record, 413 body too large, 415 content type, 500 unexpected internal failure.

## SQLite schema

The complete executable DDL is `lib/nigeria/schema.sql`.

| Table           | Key             | Content/relationships                                             |
| --------------- | --------------- | ----------------------------------------------------------------- |
| sources         | id              | JSON publisher metadata, checksum, period, terms                  |
| jurisdictions   | id              | Unique name, state/territory type, GeoJSON; source FK             |
| indicators      | code + year     | Value nullable, name, source FK                                   |
| state_revenue   | state_id + year | Integer kobo totals, components JSON, source name/FK              |
| federal_budgets | year            | Integer approved naira, original metadata JSON, source FK         |
| plan_runs       | UUID id         | Validated configuration, computed result and source snapshot JSON |
| decisions       | UUID id         | Title, reason, run FK, status, revision, UTC timestamps           |
| audit_events    | integer id      | Decision FK, action, details JSON, UTC timestamp                  |

Foreign keys and JSON validity checks are enabled. Revenue year/total and audit decision/id indexes support page queries. All user inputs are parameterized SQL values; they are not concatenated into SQL statements.

The import is one transaction. Observations upsert on stable keys; decisions, runs and audit events are never wiped during refresh. Source metadata updates for current observations do not mutate previously saved JSON snapshots.

## Import data interface

`NATIONOS_SOURCE_DIR` supplies five normalized files:

| File                | Format          | Required fields                                                                                                |
| ------------------- | --------------- | -------------------------------------------------------------------------------------------------------------- |
| sources.json        | Array           | id and publisher metadata                                                                                      |
| states.ndjson       | One object/line | id, name, type, geometry, sourceId                                                                             |
| revenue.ndjson      | One object/line | stateId, year, totalKobo, taxKobo, otherKobo, otherLabel, components, reconciliationKobo, sourceName, sourceId |
| indicators.ndjson   | One object/line | code, name, year, value, sourceId                                                                              |
| federal-budget.json | Object          | year, approvedNaira, sourceId, scope/classification/note                                                       |

The current importer expects exactly 37 states, 259 revenue rows and four sources. Changing coverage requires an intentional importer/test update. Amounts must fit JavaScript safe integers; don't use floating-point decimal parsing for source money.

Running db:init again refreshes observations without deleting decisions. Removing a normalized row does not delete an already-imported observation: implement an explicit, reviewed dataset-version replacement if changing coverage.

## Extending/replacing the backend

Keep frontend request/response names and units stable, or update components and tests together. The browser adapter is `lib/nigeria/client.mjs`; server pages also call repository functions directly, so replacing fetch URLs alone will not move every read to a remote service.

Recommended boundaries:

1. Keep pure arithmetic and validation in planning.mjs.
2. Replace repository/database implementations while preserving DTOs.
3. Move decision transactions and optimistic revision checking atomically.
4. Preserve source and model snapshots when migrating records.
5. Add explicit migrations and restore testing before changing deployed schemas.

## Controls needed before shared deployment

Local origin checks are not authentication. Before exposing the app, implement identity, authorization by institution/role, authenticated reviewers, CSRF/session controls, transport security, rate limits, backup/restore procedures and monitored migrations.

Accounts, plans, decisions, and audit rows are written only to Postgres. The sourced SQLite file is read-only at run time. With no `DATABASE_URL` or `POSTGRES_URL`, those writes return 503.

The audit table records application events. It is not a tamper-proof legal archive. No real citizen data should be added without a separate privacy and access design.
