# Architecture and code map

All paths in this guide are relative to `frontend/`. Open this directory as the editor workspace. Its package, Next configuration, environment example, scripts and documentation form a self-contained application.

## Page lifecycle

1. `app/layout.jsx` imports Tailwind styles and renders the persistent proposal provider and shell.
2. Each `app/<section>/page.jsx` selects its feature component through normal Next file-system routing.
3. Unknown paths use Next's 404 handling; the food simulator is nested at `/sectors/food`.
4. Feature components use React state, shared UI components and browser-safe model adapters.
5. Next links change pages while the root proposal provider survives.
6. Page-specific imports, reports, filters and result selections reset when that feature unmounts.

This is a React implementation. There is no generated DOM runtime, renderer override chain, manually bound HTML or `innerHTML` interpolation.

## Four boundaries

| Boundary            | Location                     | Rule                                                             |
| ------------------- | ---------------------------- | ---------------------------------------------------------------- |
| Presentation        | `components/`                | React rendering and user interactions                            |
| Browser services    | `hooks/`, `lib/client/`      | Fetch lifecycle, storage subscriptions and browser-safe adapters |
| Domain calculations | `lib/domain/`                | Pure engines; no HTTP, storage, database or UI dependency        |
| Server services     | Remaining `lib/`, `app/api/` | Evidence retrieval, provider access and request validation       |

Do not import `ai-service.mjs`, `http-api.mjs` or provider credentials into a client component. The evidence server page passes only aggregate source records into its client view.

## UI components

| Folder / file                       | Responsibility                                                      |
| ----------------------------------- | ------------------------------------------------------------------- |
| `ui/primitives.jsx`                 | Heading, Panel, Button, Field, Note, Stats and semantic DataTable   |
| `workspace/shell.jsx`               | Responsive navigation, route highlighting, header and footer        |
| `workspace/provider.jsx`            | Current proposal inputs and provenance across route changes         |
| `country/overview.jsx`              | Landing page and selected geographic scope                          |
| `country/country-map.jsx`           | 37 accessible SVG jurisdiction cells                                |
| `country/economic-accounts.jsx`     | National or selected-state economic table                           |
| `states/state-register.jsx`         | Query/zone filters and read-only state profile selection            |
| `citizens/citizen-register.jsx`     | State ranges, paging, citizen lookup, inspection and sample export  |
| `commerce/commerce-workspace.jsx`   | Business/bank/money tabs and national balances                      |
| `commerce/business-register.jsx`    | Ownership/state filters, paging and business details                |
| `comparisons/state-comparisons.jsx` | Rankings, metric selection, pair comparison and draft handoff       |
| `sectors/sector-planning.jsx`       | Sector data and unified investment-package inputs                   |
| `planning/planner.jsx`              | Calculation orchestration, suggestions and explicit browser save    |
| `planning/plan-form.jsx`            | Controlled title/reason/configuration inputs                        |
| `planning/plan-results.jsx`         | Endpoint table, annual roadmap and fiscal table                     |
| `planning/projection-chart.jsx`     | Native SVG baseline/investment plot                                 |
| `decisions/decision-memory.jsx`     | Snapshot retrieval, review state, legacy records and archive export |
| `analyst/analyst-workspace.jsx`     | Questions, modes, guided prompts and planner handoff                |
| `analyst/analyst-report.jsx`        | Escaped narrative, citations, source details and proposal export    |
| `analyst/review-results.jsx`        | Stress-case table and monitoring suggestions                        |
| `data/data-workspace.jsx`           | Session-only CSV experiments and forecast controls                  |
| `evidence/evidence-explorer.jsx`    | Filterable canonical source catalog                                 |
| `households/household-profiles.jsx` | Generated household circumstances and navigation                    |

## Hooks and browser adapters

`useSavedRecords` subscribes to native storage events and an app-specific same-tab event. Its external snapshot is the raw JSON string, avoiding a new array on every snapshot read. It parses only when that string changes. The server snapshot is an empty array, preventing a browser-storage access during SSR.

Writes are explicit and can throw. Callers show errors; they do not report success before localStorage confirms a write. This is still local persistence, not a database transaction or authenticated approval.

`useAnalyst` checks capabilities, owns one active request and cancels fetches on unmount. A 70-second browser timeout bounds interaction. Reports and provider errors stay in component state.

| Adapter            | Responsibility                                                              |
| ------------------ | --------------------------------------------------------------------------- |
| `country.mjs`      | Join planning inputs, expose formatting and combine service/fiscal models   |
| `commerce.mjs`     | Initialize the deterministic business/bank model once per module instance   |
| `geography.mjs`    | Clip fixed state sites to the invented outline                              |
| `series-model.mjs` | Monthly fixtures, CSV validation, holdout OLS and explicit fuel sensitivity |
| `download.mjs`     | Local JSON blob downloads and object-URL cleanup                            |

## Domain modules

The `.cjs` modules export functions usable by Node and Next's browser bundler. Their small UMD wrappers preserve compatibility with existing invariant tests; they do not build the UI.

| Engine                  | Main exports                                          |
| ----------------------- | ----------------------------------------------------- |
| `citizen-engine.cjs`    | prepare, citizen, version                             |
| `planning-engine.cjs`   | definitions, recommend, project                       |
| `economy-engine.cjs`    | baseline, resources, fiscalPlan, stateAccounts        |
| `commerce-engine.cjs`   | build, version                                        |
| `comparison-engine.cjs` | metrics, defaults, score, rank, improvements, version |

## Server modules

| Module                 | Responsibility                                                          |
| ---------------------- | ----------------------------------------------------------------------- |
| `country-data.mjs`     | Stable state ordering and aggregate JSON imports                        |
| `knowledge.mjs`        | Canonical catalog, planning states and authoritative computeProposal    |
| `retrieval.mjs`        | Keyword/synonym matching and bounded jurisdiction-aware retrieval       |
| `analysis-intents.mjs` | Sector vocabulary and state-name/scope interpretation                   |
| `local-analyst.mjs`    | Supported-intent analysis and draft packages without an LLM             |
| `proposal-review.mjs`  | Four numerical stress cases, risk flags and monitoring evidence         |
| `ai-service.mjs`       | Optional provider call, structured output and citation/input validation |
| `http-api.mjs`         | JSON/body/origin validation, process limiter and safe JSON errors       |

The API routes delegate to a process singleton. It limits concurrency inside one server process only. See the backend guide before introducing multiple instances.

## Data ownership

`data/country/` and `data/citizens/` are maintained canonical shards. They are not regenerated by a prebuild script. Keep state ordering aligned with sector arrays and citizen offsets.

Country population, citizen ranges, fiscal identities and rank bounds have regression tests. Dataset changes must update versions and preserve old saved snapshots. Imported experiments never replace published evidence.

## Styling

`globals.css` imports Tailwind v4 and declares paper, ink and accent tokens with `@theme`. Most styling lives in JSX utility classes. Global base rules cover common inputs, table cells, body typography and visible focus outlines.

Use existing UI primitives before adding another visual convention. Breakpoint utilities provide desktop sidebar/mobile menu and responsive grids. The project uses local system fonts and code-native SVG graphics.

The PostCSS setup follows [Tailwind's installation guide](https://tailwindcss.com/docs/installation/using-postcss). The installed Next documentation is available in `node_modules/next/dist/docs/`; read it before changing framework behaviour.
