# Government Project Intelligence & Budget Decisions

NationOS integrates live Nigerian public sector project records to guide Lagos State budget decisions.

## System Architecture

```text
External Sources (Lagos PMR, Tracka, BPP OCDS, Kaduna OCDS)
                          │ (safeFetch / IPv4 / SSL fallback / Retries)
                          ▼
            Data Ingestion & Normalizer (lib/intelligence/)
                          │
          ┌───────────────┴────────────────┐
          ▼                                ▼
Durable SQLite Storage             PostgreSQL Runtime
(government_projects,              (when DATABASE_URL
 project_sources,                   is configured)
 project_financial_records)
          │
          ▼
Decision Intelligence Engine (engine.ts & ai-grounding.ts)
- Constrained budget allocations (<= budget envelope)
- Explainable risk & urgency scoring
- Citation-grounded AI analysis
          │
          ▼
Production /decisions Interface
- Decision Overview Cards
- Searchable & Paginated Project Explorer
- Interactive Budget Allocation Workspace
- AI Decision Advisor
- Source Transparency & Data Health Dashboard
```

## Verified Data Sources

| Source | Protocol & Endpoint | Live Status | Records Imported |
| :--- | :--- | :--- | :--- |
| **Lagos State PMR** | REST: `https://lybrah-api.lagosmepb.org/api/v2/web/projects` (Header: `X-State-Domain: lagos`) | Active (200 OK) | 2,733 indexed (40 in sample) |
| **BudgIT Tracka** | REST: `https://apirebuild.yourtracka.org/recent_projects_by_year_list/filter` | Active (200 OK) | 1,324 indexed (12 in sample) |
| **Tracka Documents** | REST + S3: `https://apirebuild.yourtracka.org/documents?country=nigeria` + `/usr/bin/pdftotext` | Active (200 OK) | 166 monitored PDF reports |
| **Nigeria BPP OCDS** | OCDS JSONL: `https://data.open-contracting.org/en/publication/64/download?name=2026.jsonl.gz` | Active (200 OK) | Official Federal & State awards |
| **Kaduna Open Contracting** | REST: `https://www.ocds.kdsg.gov.ng/api/mda_list` | Degraded (200 OK on MDAs, 500 on tables) | Isolated Kaduna registry |

## Database Schema & Migrations

Database tables are defined identically in `db/schema.sql` (Postgres) and `lib/db/schema.ts` (SQLite):

- `government_projects`: Canonical project identity, state, LGA, agency, sector, status, progress %, contract sum (kobo), expended (kobo), risk flags.
- `project_sources`: Publisher provenance, original project IDs, document titles, confidence, raw JSON payload.
- `project_financial_records`: Distinct financial entries (allocations, awards, disbursements, expenditures).
- `project_status_history`: Chronological status observations from independent publishers.
- `ingestion_jobs`: Operational sync logs (records retrieved, created, rejected, availability).
- `decision_analyses`: Persisted allocation scenarios and evidence citations.

All monetary amounts are stored as exact integer BigInt kobo (1 Naira = 100 kobo).

## API Contracts

- `GET /api/decisions/overview`: Key indicator metrics and verified commitment totals.
- `GET /api/decisions/projects`: Filtered project pagination (`search`, `lga`, `status`, `sector`, `riskLevel`).
- `GET /api/decisions/projects/:id`: Full evidence package (project, sources, financials, history).
- `GET /api/decisions/projects/:id/sources`: Source list for a specific project.
- `GET /api/decisions/sources`: Directory of external publishers, coverage, and data quality notes.
- `GET /api/decisions/data-health`: Operational sync status, connector freshness, and job history.
- `POST /api/decisions/allocate`: Constrained budget calculator. Never recommends spending more than the input budget.
- `POST /api/decisions/analyze`: Evidence-grounded AI query interface with verified facts and citations.
- `GET /api/decisions/analyses/:id`: Retrieves saved allocation analysis.
- `POST /api/decisions/sync`: Administrative synchronization trigger (restricted to government role).
- `GET /api/decisions/sync/:jobId`: Polling endpoint for background ingestion jobs.

## Synchronization Commands

Run live ingestion across all verified external sources:

```bash
cd frontend
npx tsx -e "import('./lib/intelligence/sync').then(m => m.runFullSync().then(console.log))"
```

Run test suite:

```bash
cd frontend
npm run check
```
