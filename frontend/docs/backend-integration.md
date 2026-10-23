# Backend contract and integration guide

The Next.js server currently supports analyst requests only. Country/state data comes from maintained fixtures; saved plans live in browser storage. No account, database, durable institution record or approval service exists.

All paths below are relative to `frontend/`. The root README includes startup commands and complete planning inputs.

## Existing HTTP API

### GET /api/ai/status

```json
{
  "configured": false,
  "model": null,
  "evidenceSearch": true,
  "automatedAnalysis": true,
  "provider": "OpenAI",
  "liveVerified": false
}
```

Configured means a key exists, not that billing/model access works. No user identity is returned.

### POST /api/ai/analyze

```json
{
  "question": "Draft a 10-year education plan with 120 million per year",
  "scope": "all",
  "mode": "local"
}
```

- Content-Type must start with `application/json`.
- Question is a non-empty string of at most 4,000 characters.
- Scope is `all` or a canonical jurisdiction ID, e.g. `AD-11` or `AD-CT`.
- Mode is `local`, `evidence`, `ai` or `review`. Defaults: scope `all`, mode `ai`; clients should send both explicitly.
- Body limit is 12,000 bytes, checked while reading the body as well as against Content-Length.
- An Origin header, when supplied, must match the request origin.
- One active request and 20 accepted attempts per rolling minute are allowed per process.

### Report envelope

| Field                       | Type / meaning                                                                    |
| --------------------------- | --------------------------------------------------------------------------------- |
| question, scope, mode       | Echoed/normalized request context                                                 |
| created                     | ISO server timestamp                                                              |
| summary                     | Short narrative string                                                            |
| findings                    | Array of `{ text, sourceIds: string[] }`                                          |
| gaps, assumptions           | Arrays of strings                                                                 |
| sources                     | Array of source records described below                                           |
| proposal                    | Null or `{ title, reason, scope, years, growth, delivery, maintenance, budgets }` |
| modelResult                 | Null or deterministic service projection with fiscal attachment                   |
| model                       | Provider model name or null                                                       |
| engine, provider, retrieval | Mode-specific provenance; clients must tolerate optional fields                   |
| review                      | Present for review mode only                                                      |

Source records have `id`, `title`, `summary`, `values`, `scope`, `sector`, `period` and `synthetic`. IDs are stable catalog references, not database authorization tokens. Preserve source content revisions with future saved analyses.

### Review mode

Send a non-empty question, `mode: "review"` and `proposal` containing the six-budget planning configuration from the README. Exactly six supported budget keys are required. The numerical scope comes from `proposal.scope`; request scope must still be valid.

The report sets proposal/modelResult to null so a critique cannot accidentally become an executable draft. `review` contains:

| Field            | Shape                                                       |
| ---------------- | ----------------------------------------------------------- |
| input            | Validated planning configuration                            |
| flags            | String array of rule-based risks                            |
| cases            | `{ label, config, annualCost, end }[]`                      |
| monitoring       | `{ sector, indicator, unit, cadence, evidence, trigger }[]` |
| version, dataset | Review engine and dataset identifiers                       |

Each case's `end` contains national endpoint indicators with `no`, `with`, `low` and `high` values. Cases rerun current inputs, delivery minus 20 percentage points, growth plus 1 percentage point and zero maintenance. Bounds still apply. Each changes one assumption, not a probability distribution.

### Errors

Errors return `{ "error": "message" }`. Codes include 400 invalid input, 403 origin, 413 body size, 415 content type, 422 provider refusal, 429 process throttle, 503 missing live-AI key and 502 provider/structured-output failure. Unexpected failures return a generic 500 message. Next returns 405 for unsupported methods.

Responses use no-store and nosniff headers. Same-origin checks are not authentication. Repeated failed requests can still consume the prototype rate limit.

## Numerical inputs and outputs

`computeProposal` in `lib/knowledge.mjs` combines PlanningEngine.project with EconomyEngine.fiscalPlan. It is the server entry point for authoritative results.

Configuration: years 5 or 10; scope canonical ID/all; growth 0–5; delivery 0–100; maintenance 0–50; six annual budgets each 0–2,000. Budget units are millions of real 2026 Aderin naira per year.

The result includes `version`, `dataset`, `config`, `annualCost`, `totalCost`, `scopePopulation`, `years`, `limitations`, `assumptions` and `fiscal`. Each annual row includes year, population, annual/cumulative cost, national indicators and per-state no/with/low/high paths. The baseline row has no new investment cost.

Store input, immutable output and all engine/dataset versions. Never accept a client-calculated outcome as authoritative. Forecasts and measured observations are different entity types.

## What each frontend feature needs from a future backend

| Feature          | Required service/data                                                                     |
| ---------------- | ----------------------------------------------------------------------------------------- |
| Country/map      | Versioned jurisdiction hierarchy, geography, capitals, population and reporting period    |
| State profiles   | Same-version public-service baselines, state accounts and definitions/units               |
| Citizens         | Cursor-paginated authorized records, state filters, ID lookup and streaming export        |
| Businesses       | Ownership/control, operating location, sector, employment and turnover                    |
| Banks/money      | Bank balance sheets, branches and explicitly defined national monetary aggregates         |
| Comparisons      | Canonical indicator provider, target definitions, scoring method/version and peer context |
| Plans            | Owned drafts, optimistic revisions and authoritative model-run snapshots                  |
| Decision memory  | Durable records, review events, permissions and administration handover access            |
| Evidence/imports | Source revisions, dataset ingestion validation and publication workflow                   |
| Monitoring       | Responsible owner, milestones, dated measured observations and evidence provenance        |

Keep separate state own-source accounts and consolidated national fiscal projections. Do not infer state money supply from national monetary stocks or bank branch counts.

## Proposed REST resources — not implemented

| Method / route                                  | Contract direction                                                               |
| ----------------------------------------------- | -------------------------------------------------------------------------------- |
| GET /api/session                                | Authenticated user, institution memberships and capabilities                     |
| GET /api/jurisdictions?datasetVersion=...       | Stable ID/name/type/zone/population/geography plus version                       |
| GET /api/indicators?scope=...&period=...        | Versioned metric/value/unit/source records                                       |
| GET /api/citizens?scope=...&cursor=...&limit=20 | `{ items, nextCursor, total, datasetVersion }`                                   |
| GET /api/citizens/:id                           | Authorized synthetic/real record with appropriate access policy                  |
| GET /api/businesses?scope=...&ownership=...     | Paginated ownership/location data                                                |
| GET /api/banks and /api/monetary-accounts       | Versioned national stocks, units and definitions                                 |
| GET /api/sources?scope=...&query=...            | Paginated source revisions                                                       |
| POST /api/proposals                             | Create institution-owned draft from title/reason/config                          |
| PATCH /api/proposals/:id                        | Update using expectedRevision; conflict returns 409                              |
| POST /api/proposals/:id/model-runs              | Calculate/persist an immutable run against a published dataset                   |
| GET /api/proposals/:id                          | Draft, revision and permitted saved runs                                         |
| POST /api/decisions                             | Save a selected proposal revision with human reasoning                           |
| GET /api/decisions?cursor=...                   | Permitted institution-owned archive                                              |
| POST /api/decisions/:id/reviews                 | Append an authorized review; do not overwrite history                            |
| POST /api/milestones/:id/observations           | Actual value, period, source and evidence method                                 |
| POST /api/imports                               | Validate an experimental upload; publish through a separate authorized operation |

These are design requirements, not callable endpoints. Define a common error envelope and pagination contract before wiring them into the React hooks. Retain no-store for private data.

## Suggested relational schema — not implemented

| Entity              | Key fields / relationship                                                |
| ------------------- | ------------------------------------------------------------------------ |
| organizations       | id, name, jurisdiction_id                                                |
| users / memberships | external identity, organization_id, role                                 |
| jurisdictions       | stable id, name, type, parent_id, geometry revision                      |
| dataset_versions    | id, source, period, checksum, publication state                          |
| indicators          | dataset_version_id, jurisdiction_id, metric, value, unit                 |
| source_revisions    | source_id, immutable revision, content, provenance                       |
| proposals           | id, organization_id, owner_id, title, current_revision                   |
| proposal_versions   | proposal_id, revision, reason, config, created_by                        |
| model_runs          | proposal_revision, dataset/engine versions, inputs and immutable outputs |
| decisions           | proposal_revision, selected_run_id, reasoning, status                    |
| review_events       | decision_id, reviewer_id, event, timestamp                               |
| milestones          | decision_id, owner_id, due_date, intended_metric                         |
| observations        | milestone_id, measured_value, period, source_revision, method            |
| audit_events        | actor_id, entity, revision, operation, server_timestamp                  |

Use explicit decimal money units. Preserve source snapshots or immutable revision references. Do not store only a URL that may later change.

## Integration points in the current code

- Replace fixture reads in `lib/client/country.mjs` with one versioned indicator/data provider.
- Replace client generation/paging in CitizenRegister and BusinessRegister with query hooks.
- Replace `useSavedRecords` at Planner and DecisionMemory with asynchronous repositories/API hooks.
- Keep draft inputs in WorkspaceProvider; committed saves must return a server ID and revision.
- Keep numerical functions pure. Add server-only `lib/repositories/` and application services.
- Add loading/error/retry states. Show saved success only after the transaction commits.

For a proposal save: resolve actor → authorize scope/organization → validate request → load published data → recompute model → transactionally store revision/run/source context → append audit event → return ID/revision. Do not hold a database transaction open during an external provider call.

## Importing browser history

Current long-term records contain id (new records), title, reason, origin, date, reviewed, result and optional AI/comparison provenance. Older records may lack IDs or use display-formatted dates. `nationos-decisions` contains earlier short-horizon snapshots with varying shapes.

Offer explicit, idempotent migration with a batch ID. Validate every record, return per-record failures, preserve historical model snapshots and add authoritative server timestamps. Recompute new runs separately. Do not clear browser copies until the server confirms a durable copy.

Legacy JSON is untrusted. Rendering it safely does not make it a valid institutional record or approval.

## Security and deployment expectations

Add sessions, institution/jurisdiction permissions, CSRF protection appropriate to the chosen session model, distributed rate limiting and audit trails before multi-user deployment. Authorize reads as well as writes. Client-hidden controls do not enforce permissions.

Keep provider/database secrets server-only. Configure secure environment injection, migrations, backups, restore tests, monitoring and request tracing. Use a recoverable job queue for long calculations/imports. Do not expose provider error bodies or secrets in logs.

Real person data needs a separate privacy/access design. The current generator and full client-side synthetic dataset are not a ready-made sensitive-person registry.

## Acceptance tests for a real backend

Verify isolation between institutions, forbidden workflow transitions, optimistic revision conflicts, duplicate import handling, transaction rollback, reproducible model runs, historical snapshot retrieval and save failures in the UI. Begin with one durable proposal save/retrieve workflow, then add reviews, observations and ingestion.
