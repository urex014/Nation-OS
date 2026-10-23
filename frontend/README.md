# NationOS Frontend: National Fiscal Intelligence Platform

NationOS is an AI-assisted fiscal intelligence and budget allocation platform designed to help public institutions formulate evidence-based financial decisions with mathematical determinism and transparency.

## 1. Product Overview & Figma Alignment

NationOS bridges the gap between public policy objectives and fiscal execution. Built for ministry planners, budget analysts, and public oversight teams, the platform answers three foundational questions:

1. How much government revenue is available, and where does it originate?
2. How should available funds be distributed across jurisdictions and essential sectors?
3. What are the financial implications, risks, and trade-offs of different allocation strategies?

The interface reflects the visual design system established in the Figma Government Platform Prototype:

- Theme: Deep forest green (`#0B3B2C`) with emerald accents (`#10754A`) and mint badges (`#E8F5EE`).
- Data Presentation: Strict Nigerian Naira formatting (`₦54.99tn`, `₦14.0tn`, `₦420bn`) with contextual annotations.
- Deterministic Math: Numbers and totals are derived from deterministic financial algorithms, never generated text.

## 2. Core Workspaces (Five Primary Routes)

1. National Overview (`/`): National fiscal dashboard summarizing approved federal budget, projected/collected revenue, total expenditure, capital outlays, active project counts, macro trend sparklines, quarterly revenue curve, national priorities, 37-jurisdiction map, and project execution snapshot.
2. Budget & Revenue (`/revenue`): Statutory federation receipts (VAT, CIT, PIT, Customs, Resource Royalties), vertical tier allocation (Federal, State, Local), statutory FAAC sharing formulas, and subnational per-capita distributions.
3. Project Intelligence (`/budget`): Flagship AI-assisted planning workspace. Analysts formulate policy requests, inspect 6-stage investigation evidence, adjust sector allocations with locks, and save draft proposals.
4. Scenario Lab (`/scenarios`): Macroeconomic simulation laboratory comparing baseline allocations against alternative strategies (Balanced, Needs-based, Growth-oriented) under multi-horizon stress shocks.
5. Decision & Audit Records (`/decisions`): Decision memory workspace preserving proposal snapshots, model assumptions, trade-offs, and human revision diffs with formal review lifecycle tracking.

## 3. What the Frontend Needs From the Backend

The frontend communicates through `lib/api/client.mjs` and falls back to `lib/api/fiscal-adapter.mjs` when mock mode is enabled. When connecting to a live backend (FastAPI / Python), the backend must satisfy the following REST endpoints.

### API Contract Matrix

| Method | Endpoint                        | Query / Body Payload                                                              | Response Fields Required by Frontend                                                                                                                                                                                                                                                                                                                                                              |
| :----- | :------------------------------ | :-------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `GET`  | `/api/v1/fiscal/overview`       | `fiscalYear` (int), `jurisdictionId` (str)                                        | `metrics` (approvedBudget, projectedRevenue, actualRevenue, totalExpenditure, capitalExpenditure, activeProjects), `indicators` (inflation, gdpGrowth, exchangeRate, publicDebt with sparklines), `revenueTrajectory` (quarters Q1-Q4 target vs collected), `priorities` (sector budgets, project counts, percentage shares), `projects` (id, name, agency, approved, progress, expected, status) |
| `GET`  | `/api/v1/fiscal/revenue`        | `fiscalYear` (int), `formulaId` (str)                                             | `sources` (list of id, name, amount, statutoryPool), `distributablePool` (float), `tiers` (federal, state, local), `stateAllocations` (id, name, population, sharePercent, allocationAmount)                                                                                                                                                                                                      |
| `GET`  | `/api/v1/fiscal/revenue/trends` | `startYear` (int), `endYear` (int)                                                | `trends` (list of year, grossRevenue, nonTaxRevenue, statutoryTotal)                                                                                                                                                                                                                                                                                                                              |
| `GET`  | `/api/v1/jurisdictions`         | None                                                                              | `jurisdictions` (list of 37 states: id, name, zone, population, baselineRevenue, baselineSpending, deficit)                                                                                                                                                                                                                                                                                       |
| `POST` | `/api/v1/budgets/recommend`     | `question` (str), `budget` (float), `horizon` (int), `strategy` (str)             | `budgets` (education, health, transport, food, energy, water), `investigationStages` (stage 1-6 with notes & status), `tradeoffs` (list of str), `risks` (list of str), `confidence` (float)                                                                                                                                                                                                      |
| `POST` | `/api/v1/budgets/calculate`     | `years` (int), `scope` (str), `budgets` (dict), `deliveryEfficiency` (float)      | `annualCost` (float), `cumulativeCost` (float), `deficitTrajectory` (list of yearly deficit and debt-to-gdp ratios)                                                                                                                                                                                                                                                                               |
| `POST` | `/api/v1/scenarios/simulate`    | `budget` (float), `horizon` (int), `shocks` (inflationDelta, revenueDeltaPercent) | `baseline` (annualCost, sectorDistribution), `alternatives` (balanced, needsBased, growthOriented with variance analysis)                                                                                                                                                                                                                                                                         |
| `GET`  | `/api/v1/decisions`             | `limit` (int), `status` (str)                                                     | `records` (list of proposal records: id, title, fiscalYear, budgetAmount, status, reviewed, createdAt, diff)                                                                                                                                                                                                                                                                                      |
| `POST` | `/api/v1/decisions`             | `title` (str), `budget` (float), `allocations` (dict), `reason` (str)             | `record` (stored record with generated UUID and timestamp)                                                                                                                                                                                                                                                                                                                                        |
| `POST` | `/api/chat`                     | `query` (str)                                                                     | `answer` (str formatted with Naira values from Lagos/Nigeria budget data)                                                                                                                                                                                                                                                                                                                         |
| `POST` | `/api/allocate`                 | `revenue_drop_percentage` (int)                                                   | `simulation_result` (str detailing proportional overhead cuts)                                                                                                                                                                                                                                                                                                                                    |

### Data Representation Requirements

1. Currency: All monetary amounts must be transmitted in Nigerian Naira (`₦`) or decimal floating-point numbers in millions/billions as specified in the schema.
2. Statutory Sharing vs. Expenditure: Statutory revenue distribution must be clearly segregated from discretionary budget allocations.
3. Separation of Concerns: Generative LLM responses must never calculate budgetary totals; financial calculations must come from deterministic backend functions or Pandas queries.

## 4. Technology Stack & Running Locally

- Framework: Next.js 16 (App Router) with React 19
- Styling: Tailwind CSS 4 with custom institutional green tokens
- State & Mocking: Built-in deterministic simulation adapters with offline execution
- Testing: Node test runner (`node:test`), JSDOM, and ESLint

```bash
cd frontend
npm install

# Start local workspace server on http://127.0.0.1:4173
npm run dev

# Run comprehensive verification suite
npm run check:lines    # Verifies all files maintain <= 300 physical lines
npm run lint           # Verifies zero ESLint warnings or errors
npm run format:check   # Verifies Prettier conformity
npm run check          # Runs 10 domain numerical invariant suites
npm run test:ui        # Runs JSDOM React component integration tests
npm run build          # Builds production Next.js release
```
