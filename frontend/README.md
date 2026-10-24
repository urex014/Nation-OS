# NationOS — Nigeria planning workspace

NationOS connects public Nigerian observations with explainable investment planning and decision history. It is a local research and hackathon workspace, not an official government information system.

This rebuild replaces the fictional Aderin dataset. It runs entirely in this `frontend/` folder: **Next.js 16.4.3, React 19.3.0, Tailwind CSS 4.3.3, Next.js API routes and SQLite**. There is no separate Python server or Supabase requirement. The advisor can call Grok through the Vercel AI Gateway. With no gateway token and no xAI key, it stays on the rule-based answers.

## Run locally

Use **Node.js 24 LTS** and npm. SQLite uses Node's built-in `node:sqlite`; do not install a database server.

```powershell
cd frontend
npm ci
npm run db:init
npm run dev
```

Open **http://127.0.0.1:4173**. The first screen is the public landing page. **Sign in** opens one authentication page. Checked-in normalized data is sufficient; downloading the original datasets again is optional. The first database connection also initializes an absent database automatically.

Copy `.env.example` to `.env.local` before any shared or production run and set `NATIONOS_SESSION_SECRET` to a random string of at least 32 characters. A local `npm run dev` signs the session with a built-in development value when that variable is unset. Do not deploy that fallback.

## Sign in

`main` does not define accounts or roles. This workspace adds two demonstration seats. Passwords are hashed with bcrypt. A signed `httpOnly` cookie is checked on the server, and both roles open the country overview. Self-serve registration creates a **citizen** only. A government seat is seeded, not chosen on the form. A step-by-step tour is in [HOW_IT_WORKS.md](../HOW_IT_WORKS.md). Design rules are in [DESIGN_PRINCIPLES.md](../DESIGN_PRINCIPLES.md).

| Role                | Lands on    | Email                      | Password                |
| ------------------- | ----------- | -------------------------- | ----------------------- |
| Government official | `/overview` | `government@nationos.demo` | `Government-Demo-2026!` |
| Citizen             | `/overview` | `citizen@nationos.demo`    | `Citizen-Demo-2026!`    |

These passwords are for the local hackathon demo. They are not production credentials.

For a production-style local run:

```powershell
npm run build
npm start
```

Both commands bind to your local computer. Stop a running dev server before starting production on the same port. Run all npm commands from this folder because database and schema paths resolve against the current working directory.

## What each page does

| Route                   | Purpose                                                                                                 |
| ----------------------- | ------------------------------------------------------------------------------------------------------- |
| `/`                     | Public landing page: transparency for citizens, decision support for government                         |
| `/sign-in`              | Sign in, or create a citizen account                                                                    |
| `/overview`             | Country indicators, approved federal budget, actual state boundaries, observed state revenue. Both roles land here. |
| `/dashboard`, `/dashboard/government`, `/dashboard/citizen` | Old desk addresses. They redirect to `/overview`. |
| `/revenue`              | Compare any two jurisdictions and reporting years; all 37 state/FCT rows                                |
| `/budget`               | Tax slider from the old government desk, then chat, plans, and the decision builder. Government only. |
| `/scenarios`            | Compare four conditional cases using the current unsaved planner configuration                          |
| `/decisions`            | Real government project intelligence, budget allocation engine, discrepancy inspection, AI advisor and audit history |
| `/sources`              | Publishers, source periods, attribution, checksums and coverage gaps                                    |

The sidebar and restrained green/white dashboard follow the existing fiscal workspace layout. Draft inputs survive navigation within the open application but reset on reload. Saved runs and decisions persist in SQLite.

## Data included

Primary sources were used instead of a secondary Kaggle repackaging:

- **NBS:** 259 jurisdiction/year IGR rows, covering 36 states plus FCT for 2019–2025.
- **World Bank:** 11 national indicators over 2015–2025, 121 rows including missing observations.
- **geoBoundaries / GRID3:** 37 simplified state/FCT boundary geometries representing 2022.
- **State House:** the approved 2025 federal budget headline, ₦54.99 trillion, explicitly distinguished from spending.

Each indicator keeps its reporting year. National observations are not copied into state records. Source artifacts, normalization rules and limitations are documented in [Data and models](docs/data-and-models.md). Original publisher links appear in the application and source manifest.

There is no invented citizen registry, religion data, company register, bank register, current state GDP or money-in-circulation estimate. Missing observations remain missing. Combined state IGR excludes federal transfers and is not an available investment fund.

## Explainable modelling

Project Intelligence retrieves SQLite observations, handles state/year follow-ups, cites sources, and can calculate the current investment draft. With no AI credentials this path is rule-based. With the AI Gateway or a direct xAI key, Grok may answer, but only with numbers a tool returned. The badge names the path. See [Chat behaviour and API](docs/chat.md).

The model uses explicit arithmetic rather than hidden AI-generated forecasts. You enter an investment envelope, six sector allocations, inflation, budget growth, IGR growth, delivery and maintenance assumptions.

Results show annual nominal budgets, purchasing power, maintenance and a delivery-adjusted monetary proxy. They **do not claim to predict GDP, jobs, school attendance, health outcomes or completed projects**. Allocation starting points express editable policy preferences, not an algorithm's claim about the best policy.

Formulas, scenario changes, flags and a review roadmap are visible alongside each result. See [Model definitions](docs/data-and-models.md#planning-arithmetic).

## Government Project Intelligence & Decisions (`/decisions`)

The Decision Intelligence system ingests real public project records, reconciles conflicting observations, infers explainable delivery risks, and drives evidence-grounded budget allocations for Lagos State:

- **Verified Ingestion Connectors**: Live ingestion adapters for Lagos State PMR (`lybrah-api.lagosmepb.org`), BudgIT Tracka (`apirebuild.yourtracka.org` and S3 PDF documents via `pdftotext`), Nigeria BPP NOCOPO (OCDS releases), and Kaduna Open Contracting (strictly partitioned).
- **Deterministic Matcher & Discrepancy Tracking**: Matches records across official IDs and normalized titles. Never merges conflicting observations silently; highlights source discrepancies.
- **Explainable Risk Assessment**: Inferred delivery risks (schedule slips, stalled reporting, funding gaps, abandoned status) strictly require explicit citation evidence.
- **Constrained Budget Allocation Engine**: Deterministic optimization distributing any user-defined envelope (e.g. ₦100B) across ongoing completion, essential services, regional equity, and new projects without exceeding budget caps.
- **Grounded AI Advisor**: Natural language decision intelligence backed strictly by database evidence and cited source records.

See [Government Project Intelligence System](docs/decisions-intelligence.md) for full architectural specifications, data contracts, and operational guides.

## Code map

```text
app/api/decisions/           Decision intelligence endpoints (projects, allocate, sync, sources)
components/intelligence/     Project explorer, budget workspace, evidence modal, AI advisor
components/nigeria/          Page components, forms, tables, map and presentation
components/workspace/        Persistent sidebar and page frame
lib/intelligence/            Ingestion connectors, matcher, risk engine, budget engine, repository
lib/nigeria/                 SQLite, repositories, validation and pure calculations
data/nigeria/raw/            Original publisher artifacts
data/nigeria/normalized/     Reproducible NDJSON and source manifest
scripts/nigeria/             Data download and offline normalization
scripts/init-db.mjs          Non-destructive observation import
tests/                       Isolated database/model/API tests and HTTP smoke check
docs/                        Detailed architecture, intelligence contracts, and guides
```

Source files contain comments explaining boundaries and non-obvious decisions. Maintained code/docs are limited to 300 lines per file. Generated lockfiles and publisher/generated data artifacts are exempt.

## Backend handover

The backend is already implemented in Next API routes. A developer extending or replacing it should start with [Backend integration](docs/backend-integration.md), which specifies request/response formats, validation, table relationships, units, persistence and missing production controls. [Architecture](docs/architecture.md) explains the complete request/data flow.

No database credentials belong in browser code. Local development can sign sessions without a configured secret. Set `NATIONOS_SESSION_SECRET` before any shared or production run.

## Configuration and storage

Copy `.env.example` to `.env.local` only if overriding defaults:

| Variable                  | Default                            | Meaning                                                                       |
| ------------------------- | ---------------------------------- | ----------------------------------------------------------------------------- |
| `NATIONOS_DB_PATH`        | `data/nigeria/nationos.sqlite`     | Read-only published figures. Built by `next build` and `npm run db:init`      |
| `NATIONOS_SOURCE_DIR`     | `data/nigeria/normalized`          | Normalized input directory                                                    |
| `DATABASE_URL`            | required for writes                | Pooled Postgres for accounts, plans, decisions, audit                         |
| `DATABASE_URL_UNPOOLED`   | unset                              | Direct Postgres used to create those tables                                   |
| `POSTGRES_URL`            | unset                              | Used when `DATABASE_URL` is empty                                             |
| `AI_TIMEOUT_MS`           | `12000`                            | Model call limit before the data answer is used                               |
| `NATIONOS_SESSION_SECRET` | development fallback               | HMAC secret; required in production, 32+ characters                           |
| `NATIONOS_BCRYPT_COST`    | `12`                               | Password hash cost                                                            |
| `NATION_DB_PATH`          | `data/nationos.sqlite`             | Read-only fiscal file for the `main` routes. Built with the published figures |
| `AI_MODEL`                | `spacexai/grok-4.20-non-reasoning` | Gateway model. The catalog has no `xai/grok-4-fast`                           |
| `AI_GATEWAY_API_KEY`      | unset                              | Local AI Gateway key. Optional                                                |
| `VERCEL_OIDC_TOKEN`       | not a project variable             | Request header when OIDC is on. Do not create it                              |
| `XAI_API_KEY`             | unset                              | Direct xAI key. When set, this is used instead of the gateway                 |
| `XAI_MODEL`               | `grok-4.20-non-reasoning`          | Model id for that direct key                                                  |

Next reads `.env.local`; standalone Node scripts use process environment variables. For a script override in PowerShell, set `$env:NATIONOS_DB_PATH='your-path.sqlite'` first.

SQLite files, WAL files, environment files and local recovery archives are ignored by Git. Shut down all app processes before copying the database for backup; copying only the main file while WAL writes are active can lose recent transactions. Keep your backup outside this working folder.

Locally, the published money databases live under `data/`. `next build` writes both SQLite files before file tracing and includes them in every server function that reads them. `npm run db:init` writes the same files. The running app opens them read-only (`immutable=1`) from that bundled path. If that open fails, it copies the bytes once to `/tmp/nationos-ro` and opens the copy read-only. That copy is not a place anything is saved. Sign-in does not use that file. The cookie is a signed note with the person, the seat, and a 12-hour expiry. Demo passwords are bcrypt cost 10. A new account is hashed at cost 12.

Accounts, saved plans, decisions, and the audit trail are the rows people write. They go to Postgres when `DATABASE_URL` or `POSTGRES_URL` is set, and the tables in `db/schema.sql` are created on the first request. `DATABASE_URL_UNPOOLED` is used for that create when Neon provides it. With no database URL, those requests return 503 and nothing is saved on the computer. The two demo sign-ins still work. Citizens read the same decision rows the official wrote, with no static cache. Set `DATABASE_URL` for local development too.

## Deploy to Vercel

The Vercel project root is this `frontend/` folder, not the repository root.

1. Import the Git repository. Set **Root Directory** to `frontend`. Use the Node.js 24 runtime.
2. Set `NATIONOS_SESSION_SECRET` to a random string of at least 32 characters. Production will not start sessions without it.
3. Leave `AI_MODEL` unset unless you want another gateway model. The default is `spacexai/grok-4.20-non-reasoning`.
4. In the Vercel project, open **Storage** and add **Neon** from the Marketplace. Vercel sets `DATABASE_URL` for you. The app creates the account and decision tables the first time they are needed. You can also run `npm run db:init` on your own computer after the URL is in the environment.
5. Set `XAI_API_KEY` for production and preview when the team AI Gateway has no card on file. That key calls api.x.ai directly. Leave `XAI_MODEL` unset to use `grok-4.20-non-reasoning`. Do not put the key in the browser.
6. Deploy. Open the site, sign in with either demo account, and ask one question. The badge should say the answer was checked by AI. With no `XAI_API_KEY`, no gateway key, and OIDC off, the badge says the AI is not configured and the answer is still rule-based.
7. The gateway is the path only when `XAI_API_KEY` is unset. Then turn on **Project Settings → Security → OIDC**, or set `AI_GATEWAY_API_KEY`. Locally, `vercel link` and `vercel env pull` can supply the gateway token. The request still forwards `x-vercel-oidc-token` on that path.

Do not commit `.env.local` or a pulled token. Names and comments are in `.env.example`.

The fiscal routes from `main` are also mounted here: `GET /api/v1/fiscal/overview`, `GET /api/v1/fiscal/revenue`, `POST /api/v1/budgets/recommend`, `GET` and `POST /api/v1/decisions`, `GET /api/v1/scenarios`, and `POST /api/allocate`. `POST /api/chat` accepts `{ "message" }` or `{ "question" }`. The JSON includes `aiStatus`: `ok`, `not_configured`, or `error`. A body with `{ "query" }` follows the `main` contract and returns `{ "answer" }`. Those routes require a signed-in session, as the rest of `/api` does.

## Refresh observations

Internet is needed only for refreshing source artifacts. Python 3 is used solely as an offline standard-library XLSX parser.

```powershell
npm run data:fetch
npm run data:normalize
npm run db:init
```

Review changed publisher schemas, source terms and normalized diffs before importing. The importer checks row coverage and safe integer amounts. It upserts observations without deleting saved decisions; those retain their original model and source snapshots. Updating the fixed federal budget headline requires reviewing the official statement and changing the normalizer deliberately.

Source periods are intentional snapshots, not a claim that every dataset is the newest available. See the Sources page before presenting a figure.

## Verification

```powershell
npm run check
npm run test:ui
npm run lint
npm run format:check
npm run build
# With the app running:
npm run check:http
```

Domain tests use a temporary SQLite file. They verify source coverage, missing values, revenue reconciliation, allocation rounding, model direction, persisted decision snapshots, optimistic review revisions, sign-in, role redirects, and the `main` fiscal sentences. React/jsdom tests exercise keyboard selection and planner buttons against a real temporary database/API handler. The HTTP smoke check signs in against the running app, then reads the pages and APIs.

A complete pre-rebuild local source archive remains ignored in `.recovery/` for recovery only. It is not imported or served. No original synthetic observations remain in the active application.
