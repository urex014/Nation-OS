# Contributing to NationOS

Work from `frontend/`. The parent repository root intentionally has no app files or package scripts. Do not create another root-level package or duplicate Next app.

## Before changing code

Read the root README, architecture guide and the installed Next guide relevant to the change under `node_modules/next/dist/docs/`. Next is pinned to 16.4.3; do not upgrade it as an incidental refactor.

Use `npm.cmd ci` on Windows PowerShell and `npm ci` on other shells. Keep package-lock.json in version control. Environment keys belong in frontend/.env and never in source or public variables.

## Module size

Every maintained file must have at most 300 physical lines, including comments and blank lines. `npm.cmd run check:lines` enforces the rule across source, canonical JSON and documentation.

Dependencies, `.next`, npm caches, generated lockfiles/type stubs and exported NDJSON are machine artifacts. They are excluded rather than reformatted or compressed to disguise their size.

Split by responsibility before reaching the limit. A feature controller can compose a form, results table and chart; a README can link descriptive focused guides. Do not replace readable code with dense one-line implementations to pass the checker.

## Adding a page

1. Add a feature directory under components and compose existing UI primitives.
2. Put browser hooks in hooks/ and pure calculations in lib/client or lib/domain.
3. Add a small route module at app/your-section/page.jsx that exports the feature component.
4. Add the navigation label in WorkspaceShell, if it is a top-level destination.
5. Add the URL to tests/http.mjs and the README page map.
6. Test meaningful state transitions and error behaviour in React or domain tests.

Do not add an HTML string renderer, manual document selectors or innerHTML for a React view. React must own the component subtree.

## State and persistence

Use local state for feature filters and reports. Use WorkspaceProvider for the current proposal shared between pages. Keep saved model snapshots separate from an editable draft.

Use useSavedRecords for existing browser history. Catch write failures and offer a download. Preserve prior source/model versions and do not silently recalculate historical records in place.

When adding durable persistence, follow the backend integration guide. An async save must show pending/error states and only confirm after the server commits.

## Comments and names

Explain why a boundary exists, units, modelling assumptions and non-obvious validation. A comment should help the next developer understand a decision rather than restate a line of syntax.

Use clear names. Only custom React hooks should begin with `use`; ordinary event helpers should use verbs such as applySuggestion or calculatePlan.

Explicit React imports keep JSX modules usable by both Next and the plain tsx test runner. Source remains JavaScript/JSX; the TypeScript configuration supports framework tooling and Next's typed config.

## Data/model changes

Canonical shards under data/ are maintained inputs. Keep country state counts aligned with citizen offsets and sector array order. Update dataset/model versions whenever rules or inputs change.

Preserve population sums, unique IDs, physical bounds, monetary identities and baseline/intervention separation. Religion and individual identity must not become policy ranking or allocation inputs.

Trend experiments are not canonical evidence. Do not promote an uploaded CSV into the analyst catalog without validation, provenance and a publication workflow.

## Styling and accessibility

Use Tailwind utilities and existing paper/ink/accent tokens. Extend UI primitives instead of copying another button or panel design. Keep global CSS focused on tokens and base elements.

Label controls, expose errors, retain keyboard focus indicators and use semantic table headers. New SVG interactions need keyboard support. Avoid network-dependent fonts/assets for this local demo.

## Verification

```powershell
npm.cmd run format
npm.cmd run check:lines
npm.cmd run lint
npm.cmd run check
npm.cmd run test:ui
npm.cmd run build
# Start production in another terminal, then:
npm.cmd run check:http
```

| Test                | What it protects                                                      |
| ------------------- | --------------------------------------------------------------------- |
| citizens.cjs        | Full population coverage, ranges, attributes and reproducibility      |
| planning.cjs        | Horizons, budgets, directions, bounds and state scope                 |
| economy.cjs         | Fiscal identities, debt stock flows and national/state reconciliation |
| commerce.cjs        | Firm ownership, branch counts, balance sheets and monetary identities |
| comparisons.mjs     | Scoring, ties, target shortfalls and peer selection                   |
| ai.mjs              | Retrieval, structured output, citations and request boundary          |
| proposal-review.mjs | Stress recomputation, source integrity and invalid review input       |
| series-model.mjs    | Holdout separation, continuity, fuel sensitivity and CSV validation   |
| ui.test.jsx         | Real React map, citizen, planner, archive and analyst interactions    |
| http.mjs            | Production routes, Tailwind output, map geometry and local API        |

jsdom verifies interactions, not visual browser layout. Provider tests use mocks; a successful local test does not verify live provider billing or access. Do not claim those checks as performed unless they were.

If the Windows sandbox blocks tsx's user-information lookup, run the same test command in a normal local terminal. This is a test-runner environment restriction, not an app dependency on external services.

Update docs with behaviour changes. Do not push or deploy unless explicitly requested.
