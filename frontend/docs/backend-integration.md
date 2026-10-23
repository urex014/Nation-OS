# Backend Integration Guide and API Specification

This document defines the proposed REST API contracts required by the NationOS frontend. All endpoints use standard HTTP methods, JSON payloads, consistent error envelopes, and ISO-8601 timestamps.

## Global Conventions

- Base URL: `NEXT_PUBLIC_API_BASE_URL` (e.g., `http://localhost:8000/api/v1`).
- Currencies: ISO-4217 code `NGN` (symbol `₦`) or demonstration code `AND` (`A₦`).
- Monetary precision: Decimal string or integer minor units to eliminate floating-point drift.
- Authentication: Bearer token in `Authorization: Bearer <token>` for institutional access.
- Role-based scopes: `fiscal:read`, `budget:write`, `decision:review`, `admin:all`.
- Error envelope: `{ "error": { "code": "STRING", "message": "STRING", "details": {} } }`.

## Required Endpoints Matrix

| Method | Endpoint                          | Purpose                               | Consuming Component                  |
| :----- | :-------------------------------- | :------------------------------------ | :----------------------------------- |
| GET    | `/api/v1/fiscal/overview`         | National fiscal summary               | `FiscalOverview`                     |
| GET    | `/api/v1/fiscal/revenue`          | Gross revenue receipts & breakdown    | `FiscalOverview`, `RevenueWorkspace` |
| GET    | `/api/v1/fiscal/revenue/trends`   | Historical receipts over time         | `RevenueWorkspace`                   |
| GET    | `/api/v1/allocations/revenue`     | Vertical & horizontal distribution    | `RevenueWorkspace`                   |
| GET    | `/api/v1/allocations/formulas`    | Mandated & scenario sharing formulas  | `RevenueWorkspace`                   |
| GET    | `/api/v1/jurisdictions`           | Active subnational territories        | `CountryMap`, `FiscalOverview`       |
| GET    | `/api/v1/jurisdictions/:id`       | Territory-specific accounts           | `FiscalOverview`                     |
| GET    | `/api/v1/sectors`                 | Baseline sector performance & needs   | `BudgetPlanner`, `FiscalOverview`    |
| POST   | `/api/v1/budgets/recommend`       | Structured AI policy investigation    | `BudgetPlanner`                      |
| POST   | `/api/v1/budgets/calculate`       | Deterministic capital plan projection | `BudgetPlanner`                      |
| POST   | `/api/v1/scenarios/simulate`      | Multi-scenario stress projection      | `ScenarioLab`                        |
| POST   | `/api/v1/scenarios/compare`       | Side-by-side alternative analysis     | `ScenarioLab`                        |
| GET    | `/api/v1/decisions`               | Preserved decision proposal catalog   | `DecisionMemory`                     |
| POST   | `/api/v1/decisions`               | Store immutable proposal revision     | `BudgetPlanner`, `DecisionMemory`    |
| GET    | `/api/v1/decisions/:id`           | Retrieve decision audit record        | `DecisionMemory`                     |
| PATCH  | `/api/v1/decisions/:id`           | Update lifecycle review status        | `DecisionMemory`                     |
| GET    | `/api/v1/decisions/:id/revisions` | Revision lineage and diff history     | `DecisionMemory`                     |

## Endpoint Specifications

### 1. Fiscal Summary: `GET /api/v1/fiscal/overview`

- Auth: `fiscal:read`
- Query Params: `fiscalYear` (int, default 2026), `jurisdictionId` (string, default "all").
- Response: `{ "fiscalYear": 2026, "jurisdiction": { "id": "all", "name": "National" }, "metrics": { "totalRevenue": "270000.0", "totalSpending": "315000.0", "deficit": "45000.0", "debt": "810000.0" } }`.
- Errors: `400 Invalid year`, `404 Jurisdiction not found`.

### 2. Revenue Sources: `GET /api/v1/fiscal/revenue`

- Auth: `fiscal:read`
- Query Params: `fiscalYear` (int).
- Response: `{ "fiscalYear": 2026, "sources": [{ "id": "vat", "name": "VAT", "amount": "72000.0", "statutoryPool": true }] }`.

### 3. Historical Trends: `GET /api/v1/fiscal/revenue/trends`

- Auth: `fiscal:read`
- Query Params: `startYear` (int), `endYear` (int).
- Response: `{ "trends": [{ "year": 2024, "revenue": "235000.0" }, { "year": 2025, "revenue": "252000.0" }] }`.

### 4. Revenue Distribution: `GET /api/v1/allocations/revenue`

- Auth: `fiscal:read`
- Query Params: `fiscalYear` (int), `formulaId` (string, e.g. "statutory-v1").
- Response: `{ "distributablePool": "229500.0", "distributionTiers": { "federal": "120900.6", "states": "61322.4", "local": "47277.0" }, "stateAllocations": [{ "id": "AD-01", "allocationAmount": "1650.0" }] }`.

### 5. Distribution Formulas: `GET /api/v1/allocations/formulas`

- Auth: `fiscal:read`
- Response: `{ "formulas": [{ "id": "statutory-v1", "isStatutory": true, "legalBasis": "Act Cap F26 LFN 2004", "weights": { "equality": 0.4, "population": 0.3 } }] }`.

### 6. Jurisdictions: `GET /api/v1/jurisdictions`

- Auth: `fiscal:read`
- Response: `{ "jurisdictions": [{ "id": "AD-01", "name": "Kainji", "type": "State", "population": 620000 }] }`.

### 7. Jurisdiction Detail: `GET /api/v1/jurisdictions/:id`

- Auth: `fiscal:read`
- Response: `{ "id": "AD-01", "revenue": "4200.0", "spending": "5100.0", "deficit": "900.0" }`.

### 8. Sectors: `GET /api/v1/sectors`

- Auth: `fiscal:read`
- Response: `{ "sectors": [{ "id": "health", "name": "Healthcare", "baselineIndex": 72.4, "target": 90.0 }] }`.

### 9. AI Recommendation: `POST /api/v1/budgets/recommend`

- Auth: `budget:write`
- Request: `{ "question": "string", "budget": 1000, "horizon": 5, "scope": "all", "strategy": "needs" }`.
- Response: `{ "budgets": { "health": 220, "education": 220, "transport": 140, "food": 200, "energy": 110, "water": 110 }, "investigationStages": [{ "stage": 1, "status": "completed" }], "tradeoffs": ["string"], "risks": ["string"] }`.

### 10. Budget Calculation: `POST /api/v1/budgets/calculate`

- Auth: `budget:write`
- Request: `{ "years": 5, "scope": "all", "growth": 2.0, "delivery": 80, "maintenance": 20, "budgets": { "health": 180 } }`.
- Response: `{ "annualCost": 980, "cumulativeCost": 4900, "fiscal": { "years": [{ "deficit": "4200.0" }] } }`.

### 11. Scenario Simulation: `POST /api/v1/scenarios/simulate`

- Auth: `fiscal:read`
- Request: `{ "budget": 1000, "horizon": 5, "scope": "all" }`.
- Response: `{ "baseline": { "id": "balanced", "annualCost": 1000 }, "alternatives": [{ "id": "needs", "annualCost": 1000 }] }`.

### 12. Scenario Comparison: `POST /api/v1/scenarios/compare`

- Auth: `fiscal:read`
- Request: `{ "scenarioIds": ["balanced", "growth"], "shock": "revenueDrop" }`.
- Response: `{ "comparison": [{ "scenarioId": "balanced", "adjustedAnnual": 850 }] }`.

### 13. Decision List: `GET /api/v1/decisions`

- Auth: `decision:read`
- Query Params: `status` (optional), `limit` (int, default 20), `offset` (int, default 0).
- Response: `{ "decisions": [{ "id": "DEC-001", "title": "Health Plan", "status": "Draft", "budgetAmount": 1000 }] }`.

### 14. Save Decision: `POST /api/v1/decisions`

- Auth: `budget:write`
- Request: `{ "title": "string", "budgetAmount": 1000, "horizonYears": 5, "allocations": {}, "status": "Draft" }`.
- Response: `{ "id": "DEC-002", "created": "2026-10-23T21:00:00Z", "status": "Draft" }`.

### 15. Decision Detail: `GET /api/v1/decisions/:id`

- Auth: `decision:read`
- Response: `{ "id": "DEC-001", "title": "Health Plan", "allocations": {}, "assumptions": [], "risks": [] }`.

### 16. Update Decision: `PATCH /api/v1/decisions/:id`

- Auth: `decision:review`
- Request: `{ "status": "Reviewed", "notes": "Approved by analyst panel" }`.
- Response: `{ "id": "DEC-001", "status": "Reviewed", "updated": "2026-10-23T21:30:00Z" }`.

### 17. Decision Revisions: `GET /api/v1/decisions/:id/revisions`

- Auth: `decision:read`
- Response: `{ "revisions": [{ "revisionNumber": 1, "timestamp": "ISO", "changedBy": "Analyst-4", "diff": {} }] }`.

## Mock vs Live Execution

When `NEXT_PUBLIC_USE_MOCK_API=true`, all calls route through `lib/api/fiscal-adapter.mjs`. Live requests failing return structured error notifications without silent mock fallback.
