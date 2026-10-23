# NationOS frontend

NationOS helps public-sector analysts turn a shared picture of a country into reviewable investment proposals. The demonstration uses the fictional Republic of Aderin: 24.6 million residents, 36 unequal states and one capital territory.

The workflow is: **inspect country data → investigate a need → compare jurisdictions → draft an investment → calculate five-/ten-year scenarios → review risks → preserve the decision context**.

Every person, firm, resource record and economic figure is synthetic. The platform supports human judgment; it does not establish causal policy effectiveness or approve spending.

## Working directory and installation

Everything needed to develop, run, test and document the application is inside this `frontend/` directory. The parent contains only this directory and Git metadata. Always run npm here, not in the repository root.

```powershell
cd C:\Users\USER\Documents\Nation-OS\frontend
npm.cmd ci
npm.cmd run dev
```

Open **http://localhost:4173**. On macOS/Linux, use `npm` in place of `npm.cmd`.

Use Node.js 24, the verified runtime for the app and its test tools. Commit `package-lock.json` so installs reproduce the dependency tree.

```powershell
npm.cmd run build
npm.cmd start
```

These build and run production. Development and production share port 4173; stop one before starting the other. Both bind to loopback. No command deploys or pushes to GitHub.

## Stack and version choices

| Layer           | Choice                              | Responsibility                                                   |
| --------------- | ----------------------------------- | ---------------------------------------------------------------- |
| Framework       | Next.js **16.4.3**                  | Existing installed version, App Router and route handlers        |
| UI              | React / React DOM **19.3.0**        | Existing frontend scaffold versions, actual JSX components       |
| Styling         | Tailwind CSS **4.3.3**              | Responsive utilities, theme tokens and small global base styles  |
| CSS integration | `@tailwindcss/postcss`              | Compiles Tailwind in Next's build                                |
| Source          | JavaScript / JSX; TypeScript config | Explicit modules; no generated HTML controller runtime           |
| Models          | Pure CommonJS engines               | Reproducible numerical scenarios shared by browser and server    |
| Tests           | Node assertions, jsdom, tsx         | Domain invariants, API validation and mounted React interactions |
| Quality         | ESLint and Prettier                 | React rules, readable formatting and a 300-line policy           |

The Next configuration uses webpack and one build worker to reduce resource pressure. No remote fonts or image services are required.

## Developer documentation

| Guide                                             | Read it for                                                                 |
| ------------------------------------------------- | --------------------------------------------------------------------------- |
| [Architecture and code map](docs/architecture.md) | Each folder/component, routing, state boundaries and request flows          |
| [Backend contract](docs/backend-integration.md)   | Existing APIs, exact inputs/outputs, future endpoints, schema and migration |
| [Data and models](docs/data-and-models.md)        | Synthetic assumptions, units, service formulas and accounting identities    |
| [Contributing](docs/contributing.md)              | Adding features, comments, verification and module size rules               |

This README is the starting point. The linked guides keep the documentation descriptive while each maintained file stays within 300 physical lines.

## Directory map

```text
frontend/
  app/
    layout.jsx                   Persistent React provider and application shell
    <section>/page.jsx          Small route modules selecting React features
    api/ai/status/route.js       Analyst configuration endpoint
    api/ai/analyze/route.js      Analysis and proposal review endpoint
    globals.css                 Tailwind import, tokens and base element styling
  components/
    ui/                         Shared headings, panels, buttons, tables and notes
    workspace/                  Navigation shell and transient proposal context
    country/                    Country overview, SVG map and economic accounts
    states/                     Filterable jurisdiction register and profiles
    citizens/                   Generated population browse, lookup and export
    commerce/                   Business register, banks and monetary accounts
    comparisons/                Rankings, pair comparison and improvement drafts
    sectors/                    Sector baselines and investment draft inputs
    planning/                   Inputs, charts, annual results and proposal saves
    decisions/                  Saved snapshots, reviews and handover export
    analyst/                    Questions, report sources and stress-case results
    data/                       Experimental CSV and trend modelling workspace
    evidence/                   Searchable canonical evidence records
    households/                 Generated household circumstances
  hooks/                        Analyst requests and reactive localStorage access
  lib/client/                   Browser-safe adapters, map geometry and trend model
  lib/domain/                   Shared citizen, service, economy and scoring engines
  lib/                          Canonical data, retrieval and server analyst services
  data/country/                 Small canonical state/zone/sector JSON shards
  data/citizens/                Small citizen range/baseline shards
  docs/                         Detailed developer guides
  scripts/                      Maintained-file policy and domain test runner
  tests/                        Domain, API, React interaction and HTTP checks
```

There is no `dist/`, generated workspace bundle, `innerHTML` view system or second custom web server. React owns the rendered interface.

## Pages and their responsibilities

| URL                | What users can do                                                                                              |
| ------------------ | -------------------------------------------------------------------------------------------------------------- |
| `/`                | Read the country profile, select one of 37 map regions, inspect distinct state/national accounts and resources |
| `/states`          | Search/filter every jurisdiction and inspect population, services and economic accounts                        |
| `/citizens`        | Browse 20 generated records per page, filter by state, find an ID and download a sample                        |
| `/businesses`      | Filter domestic/foreign/joint firms, inspect profiles, banks and monetary stocks                               |
| `/comparisons`     | Rank service indicators, compare two states, investigate peers and draft an improvement package                |
| `/sectors`         | Explore education, transport, healthcare, electricity and water indicators                                     |
| `/sectors/food`    | Explore food-pressure baselines and prepare a food investment scenario                                         |
| `/recommendations` | Edit assumptions and budgets; calculate, export and save five-/ten-year plans                                  |
| `/decisions`       | Retrieve saved snapshots, mark them reviewed and export a handover archive                                     |
| `/analyst`         | Ask supported questions, search evidence, request optional live AI and stress-review current inputs            |
| `/evidence`        | Search the exact canonical evidence catalog used by the analyst                                                |
| `/data`            | Import experimental monthly CSV, inspect observations and test a held-out trend/fuel scenario                  |
| `/households`      | Inspect reproducible fictional households and service-access circumstances                                     |

## How the frontend is coded

Each route module exports the appropriate React feature component using Next file-system routing; unknown URLs use Next's 404 handling. The root layout holds `WorkspaceProvider` and `WorkspaceShell`, so changing routes preserves the current proposal draft.

Each feature composes shared UI primitives instead of constructing HTML strings. React escapes source/provider text. Tables have semantic headers, forms have labels, the mobile menu exposes its state and map cells support Enter/Space selection.

`lib/client/country.mjs` assembles browser-safe data and connects the numerical engines. Server analyst modules remain outside client imports; provider keys are read only on the server. The evidence page passes aggregate source records as serializable props.

`useAnalyst` owns status, fetch cancellation, busy states and errors. `useSavedRecords` uses `useSyncExternalStore` so storage changes update views without unsafe hydration-time browser reads.

## What persists

| Data                            | Storage                              | Lifetime                                      |
| ------------------------------- | ------------------------------------ | --------------------------------------------- |
| Country and service baselines   | Canonical JSON shards                | Version controlled                            |
| Citizens / firms                | Deterministic generators             | Reproducible from index and version           |
| Current proposal draft          | Shared React context                 | Route changes; lost on refresh                |
| Long-term plans                 | `nationos-plans` in localStorage     | Same browser and origin                       |
| Earlier short-horizon decisions | `nationos-decisions`                 | Preserved and exportable in Decision memory   |
| CSV experiments                 | Data page React state                | Lost when the page unmounts or refreshes      |
| Analyst report                  | Analyst page React state             | Lost when the page unmounts unless downloaded |
| Provider key                    | `frontend/.env` / server environment | Server configuration only                     |

Keep using the same hostname and port to retain browser records: `localhost:4173` and `127.0.0.1:4173` have different storage origins. Clearing browser data removes local records; export important snapshots.

## Analyst capabilities and AI boundaries

- **Analyse question:** supported-intent matching and canonical data calculations, with no API key or model download.
- **Search evidence:** bounded local keyword retrieval; no generated interpretation.
- **Ask live AI:** optional OpenAI response grounded in selected aggregate records; structured output and source references are validated.
- **Review risks & stress-test plan:** reruns current inputs with lower delivery, higher population growth and zero maintenance. Flags implementation/fiscal risks and suggests monitoring evidence.

Review and local modes are explicit rules, not language models. Generative text never supplies the numerical projections: shared engines calculate those results. A generated proposal opens in the planner for human review and is not automatically saved.

To enable live AI, copy `.env.example` to `.env` **inside frontend**, set `OPENAI_API_KEY`, optionally set `OPENAI_MODEL`, and restart Next. The default model is `gpt-4.1-mini`. Never use `NEXT_PUBLIC` for secrets. Live access is optional and is not verified merely because a key exists.

## Backend contract summary

The project already includes a small Next.js backend for the analyst. It has **no database, account sessions, authorization roles or institution-shared persistence**. A backend developer should extend those route handlers and add repositories rather than replacing the React UI.

Only these application API endpoints exist today:

| Method / route         | Input                                           | Response                                                                                 |
| ---------------------- | ----------------------------------------------- | ---------------------------------------------------------------------------------------- |
| `GET /api/ai/status`   | No body                                         | `configured`, `model`, `evidenceSearch`, `automatedAnalysis`, `provider`, `liveVerified` |
| `POST /api/ai/analyze` | JSON question, scope, mode; proposal for review | Cited report; optional proposal/numerical result or review cases                         |

```json
{
  "question": "Draft a 10-year education plan with 120 million per year",
  "scope": "all",
  "mode": "local"
}
```

`question` must contain 1–4,000 characters. `scope` is `all` or a canonical ID such as `AD-11`. Modes: `local`, `evidence`, `ai`, `review`. Body limit: 12,000 bytes. Errors return `{ "error": "message" }` with a non-success status. Same-origin checks and a process-local throttle are prototype controls, not authentication.

A successful report contains `question`, `scope`, `mode`, `created`, `summary`, `findings` (`text`, `sourceIds`), `gaps`, `assumptions`, `sources`, `proposal` and `modelResult`. Proposal/results may be null. Review mode additionally returns `review` containing input, flags, stress cases, monitoring entries and versions.

### Proposal configuration

```json
{
  "years": 10,
  "scope": "all",
  "growth": 2,
  "delivery": 80,
  "maintenance": 20,
  "budgets": {
    "food": 0,
    "education": 120,
    "transport": 0,
    "health": 0,
    "energy": 0,
    "water": 0
  }
}
```

Years are 5 or 10; annual growth 0–5%; delivery 0–100%; maintenance 0–50%; each of the six budgets 0–2,000. Budgets are **millions of real 2026 Aderin naira per year**, not whole currency units or total programme cost. Analyst proposals also include `title` and `reason`.

A future backend must supply versioned country/indicator data, paginated citizen and business queries, authenticated institutional records, durable proposals/revisions/model runs, decision reviews, milestones, observed outcomes and audit events. These are requirements, not existing endpoints. See the [full backend contract](docs/backend-integration.md) for exact integration points and proposed API/data shapes.

Server saves must validate inputs, authorize the actor and recompute authoritative results using `computeProposal` in `lib/knowledge.mjs`. Store engine/dataset/source versions with immutable snapshots. Never trust a browser-supplied score, approval flag or projected result.

## Verification and maintenance

```powershell
npm.cmd run check:lines
npm.cmd run format:check
npm.cmd run lint
npm.cmd run check
npm.cmd run test:ui
npm.cmd run build
# With production listening:
npm.cmd run check:http
```

The domain checks verify population totals, financial identities, scoring, projections, source validation, stress review and monthly experiments. React tests exercise map selection, citizen pagination, saving/reviewing plans and analyst handoff. HTTP tests exercise all 13 pages, compiled Tailwind, 37 map polygons and live local API requests.

Every maintained code, configuration, canonical data and documentation file must be **at most 300 physical lines**, including comments and blank lines. Split by responsibility before reaching the limit; do not compress readable code. `check:lines` scans the project recursively. Dependency files, build output, generated lockfiles, type stubs and exports are excluded because tools own them.

Comments explain units, modelling assumptions, state ownership and non-obvious boundaries. The contribution guide explains how to add a feature and the tests it needs.

## Limits of the demonstration

State scores describe synthetic target attainment, not governance quality. Service coefficients are illustrative and uncalibrated. The fiscal model assumes no policy-generated GDP/job returns. Religion is never a scoring or allocation input. Monetary stocks, government flows and GDP are different measures and must not be added together.

For operational use, replace fictional evidence, validate models, add identity/durable storage, and collect actual outcomes separately from forecasts. See the backend guide before handling any real citizen information.
