# Architecture and Code Map

All paths in this guide are relative to `frontend/`. Open this directory as the editor workspace.

## Page Lifecycle and Primary Routes

NationOS is organized around five focused fiscal intelligence workspaces:

1. Overview (`/`): Implemented in `components/overview/fiscal-overview.jsx`. Displays national revenues, public debt, deficit ratios, and the 37-jurisdiction map.
2. Revenue Allocation (`/revenue`): Implemented in `components/revenue/revenue-workspace.jsx`. Manages gross receipts, statutory sharing formulas, and subnational distribution.
3. Budget Planner (`/budget`): Implemented in `components/budget/budget-planner.jsx`. Flagship AI-assisted planning workspace featuring structured investigation, sector sliders with locks, and reconciled balance enforcement.
4. Scenario Lab (`/scenarios`): Implemented in `components/scenarios/scenario-lab.jsx`. Multi-scenario financial simulation comparing baseline allocations against alternative strategies under macroeconomic shocks.
5. Decision Records (`/decisions`): Implemented in `components/decisions/decision-memory.jsx`. Context preservation workspace maintaining proposal revisions, model assumptions, and review status.

## Architecture Boundaries

| Boundary            | Location                | Rule                                                   |
| :------------------ | :---------------------- | :----------------------------------------------------- |
| Presentation        | `components/`           | React rendering and user interactions                  |
| API Layer           | `lib/api/`              | Centralized client, typed contracts, and mock adapters |
| Browser Services    | `hooks/`, `lib/client/` | Storage subscriptions and download helpers             |
| Domain Calculations | `lib/domain/`           | Pure deterministic calculation engines                 |
| Server Services     | `lib/`, `app/api/`      | Evidence retrieval and provider adapters               |

## UI Component Directory

| Folder / Component               | Responsibility                                             |
| :------------------------------- | :--------------------------------------------------------- |
| `workspace/shell.jsx`            | 5-item navigation shell, header, and demonstration notices |
| `overview/fiscal-overview.jsx`   | Consolidated fiscal metrics and subnational inspector      |
| `overview/kpi-cards.jsx`         | Revenue, spending, deficit, and debt summary cards         |
| `revenue/revenue-workspace.jsx`  | Distributable federation pool and formula toggles          |
| `revenue/distribution-table.jsx` | Jurisdiction-level allocation breakdown table              |
| `budget/budget-planner.jsx`      | Flagship budget allocation interface with locking sliders  |
| `budget/investigation-panel.jsx` | 6-stage structured AI investigation sequence               |
| `scenarios/scenario-lab.jsx`     | Comparative scenario simulation and stress test matrix     |
| `decisions/decision-memory.jsx`  | Persistent decision proposal records and export            |
| `country/country-map.jsx`        | 37 accessible SVG jurisdiction polygon cells               |
| `ui/primitives.jsx`              | Headings, buttons, and basic containers                    |

## Domain and Engine Modules

The domain engines execute pure mathematical computations without network dependency:

- `planning-engine.cjs`: Multi-year sector projections and baseline service models.
- `economy-engine.cjs`: Macroeconomic identities, state accounts, debt stocks, and deficit accounting.
- `proposal-review.mjs`: Stress-case evaluation, sensitivity analysis, and rule-based risk flags.

## Styling Principles

Tailwind CSS v4 is configured via `globals.css` with PostCSS. The visual design prioritizes information density, crisp typography, neutral backgrounds, and restrained accents inspired by modern financial dashboards.
