# NationOS — Nigeria planning workspace

NationOS connects public Nigerian observations with explainable investment planning and decision history. It is a local research and hackathon workspace, not an official government information system.

This rebuild replaces the fictional Aderin dataset. It runs entirely in this `frontend/` folder: **Next.js 16.4.3, React 19.3.0, Tailwind CSS 4.3.3, Next.js API routes and SQLite**. There is no separate Python server, Supabase requirement, API key, Ollama or hosted language model.

## Run locally

Use **Node.js 24 LTS** and npm. SQLite uses Node's built-in `node:sqlite`; do not install a database server.

```powershell
cd frontend
npm ci
npm run db:init
npm run dev
```

Open **http://127.0.0.1:4173**. Checked-in normalized data is sufficient; downloading the original datasets again is optional. The first database connection also initializes an absent database automatically.

For a production-style local run:

```powershell
npm run build
npm start
```

Both commands bind to your local computer. Stop a running dev server before starting production on the same port. Run all npm commands from this folder because database and schema paths resolve against the current working directory.

## What each page does

| Route        | Purpose                                                                                                 |
| ------------ | ------------------------------------------------------------------------------------------------------- |
| `/`          | Country indicators, approved federal budget, actual state boundaries, observed state revenue            |
| `/revenue`   | Compare any two jurisdictions and reporting years; all 37 state/FCT rows                                |
| `/budget`    | Chat with the imported data, compare states, inspect sources, model plans and open the decision builder |
| `/scenarios` | Compare four conditional cases using the current unsaved planner configuration                          |
| `/decisions` | Retrieve saved reasoning, model/source snapshots, status reviews and audit events                       |
| `/sources`   | Publishers, source periods, attribution, checksums and coverage gaps                                    |

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

Project Intelligence now opens as a data chatbot. It retrieves SQLite observations, handles state/year follow-ups, provides source links and can calculate the current investment draft. This is an explicit local rule-based assistant, not an LLM; no API key is needed. The original investment form remains under “Investment assumptions & decision builder”. See [Chat behaviour and API](docs/chat.md).

The model uses explicit arithmetic rather than hidden AI-generated forecasts. You enter an investment envelope, six sector allocations, inflation, budget growth, IGR growth, delivery and maintenance assumptions.

Results show annual nominal budgets, purchasing power, maintenance and a delivery-adjusted monetary proxy. They **do not claim to predict GDP, jobs, school attendance, health outcomes or completed projects**. Allocation starting points express editable policy preferences, not an algorithm's claim about the best policy.

Formulas, scenario changes, flags and a review roadmap are visible alongside each result. See [Model definitions](docs/data-and-models.md#planning-arithmetic).

## Code map

```text
app/                         App Router pages and nine API route groups
components/nigeria/          Page components, forms, tables, map and presentation
components/workspace/        Persistent sidebar and page frame
lib/nigeria/                 SQLite, repositories, validation and pure calculations
data/nigeria/raw/            Original publisher artifacts
data/nigeria/normalized/     Reproducible NDJSON and source manifest
scripts/nigeria/             Data download and offline normalization
scripts/init-db.mjs          Non-destructive observation import
tests/                       Isolated database/model/API tests and HTTP smoke check
docs/                        Detailed architecture and backend contract
```

Source files contain comments explaining boundaries and non-obvious decisions. Maintained code/docs are limited to 300 lines per file. Generated lockfiles and publisher/generated data artifacts are exempt.

## Backend handover

The backend is already implemented in Next API routes. A developer extending or replacing it should start with [Backend integration](docs/backend-integration.md), which specifies request/response formats, validation, table relationships, units, persistence and missing production controls. [Architecture](docs/architecture.md) explains the complete request/data flow.

No database credentials belong in browser code. No secret is required for this local implementation.

## Configuration and storage

Copy `.env.example` to `.env.local` only if overriding defaults:

| Variable              | Default                        | Meaning                       |
| --------------------- | ------------------------------ | ----------------------------- |
| `NATIONOS_DB_PATH`    | `data/nigeria/nationos.sqlite` | Writable SQLite database file |
| `NATIONOS_SOURCE_DIR` | `data/nigeria/normalized`      | Normalized input directory    |

Next reads `.env.local`; standalone Node scripts use process environment variables. For a script override in PowerShell, set `$env:NATIONOS_DB_PATH='your-path.sqlite'` first.

SQLite files, WAL files, environment files and local recovery archives are ignored by Git. Shut down all app processes before copying the database for backup; copying only the main file while WAL writes are active can lose recent transactions. Keep your backup outside this working folder.

This app needs a persistent writable filesystem and the Node runtime. Ephemeral/serverless filesystems and concurrent app replicas are not suitable for this SQLite setup. There is no login, role system or formal approval authority; add those before opening it to untrusted users.

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

Domain tests use a temporary SQLite file. They verify source coverage, missing values, revenue reconciliation, allocation rounding, model direction, persisted decision snapshots, optimistic review revisions and HTTP input validation. React/jsdom tests exercise keyboard selection and planner buttons against a real temporary database/API handler. The HTTP smoke check reads the running pages and APIs without creating decisions.

A complete pre-rebuild local source archive remains ignored in `.recovery/` for recovery only. It is not imported or served. No original synthetic observations remain in the active application.
