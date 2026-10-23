# NationOS: AI-Native Fiscal Intelligence & Public Decision Platform

NationOS is an AI-first civic technology platform designed to bring transparency, evidence-based simulation, and mathematical determinism to public budget allocation and expenditure analysis.

The platform aligns policy objectives with public expenditure realities across subnational and federal tiers, featuring a Next.js 16 frontend styled after the Figma National Planning & Intelligence design specification and a FastAPI / LlamaIndex computational engine.

---

## 1. System Architecture

```
                       ┌────────────────────────────────────────────────────────┐
                       │            NationOS Frontend (Next.js 16)             │
                       │  - National Overview (KPIs, Trends, Priorities, Map)   │
                       │  - Revenue Allocation (Statutory FAAC Distribution)    │
                       │  - Budget Planner (AI Investigation & Allocation)      │
                       │  - Scenario Lab (Stress-Testing & Multi-Horizon Sim)   │
                       │  - Decision Records (Immutable Audit Trail)            │
                       └───────────────────────────┬────────────────────────────┘
                                                   │
                                                   ▼ REST / JSON Contracts
                       ┌────────────────────────────────────────────────────────┐
                       │           NationOS Backend Service (FastAPI)           │
                       │  - /api/v1/fiscal/* (Overview, Revenue, Trends)        │
                       │  - /api/v1/allocations/* (FAAC Formula Engine)         │
                       │  - /api/allocate (Deterministic Overhead Simulation)   │
                       │  - /api/chat (Citizen Transparency Query Engine)       │
                       └───────────────────────────┬────────────────────────────┘
                                                   │
                            ┌──────────────────────┴──────────────────────┐
                            ▼                                             ▼
             ┌─────────────────────────────┐               ┌─────────────────────────────┐
             │   LlamaIndex AI Engine      │               │     Ground Truth Data       │
             │ - OpenRouter (Llama 3.1 8B) │               │ - lagos_budget_2026.csv     │
             │ - PandasQueryEngine         │               │ - 500 Realistic Line Items  │
             │ - Strict Auditor Persona    │               │ - Capital vs Recurrent      │
             └─────────────────────────────┘               └─────────────────────────────┘
```

---

## 2. Frontend Workspaces (Figma Specification)

The frontend interface adheres strictly to the Figma Government Platform design system:
- **Palette**: Deep forest green (`#0B3B2C`), emerald accents (`#10754A`), and mint indicators (`#E8F5EE`).
- **Typography & Currency**: Formal financial hierarchy with Nigerian Naira values (`₦54.99tn`, `₦14.0tn`, `₦420bn`).
- **Core Workspaces**:
  1. **National Overview (`/`)**: 6-card KPI summary, macro indicators (Inflation, GDP, FX, Public Debt), quarterly revenue curve, national priorities, 37-jurisdiction map, and project execution snapshot.
  2. **Revenue Allocation (`/revenue`)**: Federation receipts, vertical splits (Federal, State, Local), and statutory formula distribution.
  3. **Budget Planner (`/budget`)**: AI-assisted policy investigation with 6-stage evidence trail, sector priorities, and allocation locks.
  4. **Scenario Lab (`/scenarios`)**: Macroeconomic stress simulations across 5-year and 10-year horizons.
  5. **Decision Records (`/decisions`)**: Preserved context, assumptions, trade-offs, and human revision diffs.

---

## 3. What the Frontend Needs From the Backend

The frontend communicates with the backend via `lib/api/client.mjs`. In production, the backend must supply the following endpoints:

### Endpoint Contracts

#### 1. National Overview: `GET /api/v1/fiscal/overview`
- **Query Parameters**: `fiscalYear` (int, default 2026), `jurisdictionId` (string, default "all")
- **Required Response Structure**:
```json
{
  "fiscalYear": 2026,
  "currency": "NGN",
  "unit": "million",
  "metrics": {
    "approvedBudget": "₦54.99tn",
    "projectedRevenue": "₦14.0tn",
    "actualRevenue": "₦3.28tn",
    "totalExpenditure": "₦3.01tn",
    "capitalExpenditure": "₦1.16tn",
    "activeProjects": 128
  },
  "indicators": [
    { "title": "Inflation", "value": "24.2%", "period": "Feb 2026", "bars": [30, 42, 55, 68, 78, 88] },
    { "title": "GDP growth", "value": "3.84%", "period": "Q4 2025", "bars": [25, 32, 45, 50, 62, 70] },
    { "title": "Exchange rate", "value": "₦1,536/$", "period": "21 Mar 2026", "bars": [45, 55, 65, 80, 85, 90] },
    { "title": "Public debt", "value": "₦152.4tn", "period": "Sep 2025", "bars": [35, 48, 58, 65, 75, 85] }
  ],
  "revenueTrajectory": {
    "quarters": ["Q1", "Q2", "Q3", "Q4"],
    "collected": [0.8, 1.6, 2.4, 3.28],
    "target": [0.9, 1.9, 2.9, 4.0]
  },
  "priorities": [
    { "name": "Infrastructure & Transport", "amount": "₦2.84tn", "projects": 32, "percent": 75 },
    { "name": "Education", "amount": "₦1.92tn", "projects": 24, "percent": 60 },
    { "name": "Healthcare", "amount": "₦1.41tn", "projects": 18, "percent": 50 },
    { "name": "Agriculture & Food Security", "amount": "₦1.03tn", "projects": 21, "percent": 40 },
    { "name": "Energy", "amount": "₦1.22tn", "projects": 14, "percent": 45 }
  ],
  "projects": [
    {
      "id": "NGA-INF-024",
      "name": "North Central Agricultural Logistics Corridor",
      "agency": "Federal Ministry of Works",
      "approved": "₦420bn",
      "progress": 34,
      "expected": "Dec 2027",
      "status": "Active"
    }
  ]
}
```

#### 2. Revenue Distribution: `GET /api/v1/fiscal/revenue`
- **Query Parameters**: `fiscalYear` (int), `formulaId` (string)
- **Required Response Structure**:
```json
{
  "fiscalYear": 2026,
  "distributablePool": 229500.0,
  "tiers": {
    "federal": 120900.6,
    "states": 61322.4,
    "local": 47277.0
  },
  "sources": [
    { "id": "vat", "name": "Value Added Tax (VAT)", "amount": 72000.0, "statutoryPool": true },
    { "id": "cit", "name": "Company Income Tax (CIT)", "amount": 58000.0, "statutoryPool": true },
    { "id": "resource", "name": "Natural Resource Royalties", "amount": 54000.0, "statutoryPool": true }
  ],
  "stateAllocations": [
    { "id": "NG-LA", "name": "Lagos", "population": 12550000, "sharePercent": 8.4, "allocationAmount": 5150.0 }
  ]
}
```

#### 3. AI Budget Recommendation: `POST /api/v1/budgets/recommend`
- **Request Body**:
```json
{
  "question": "Distribute ₦100bn to improve healthcare and education while prioritizing underserved states",
  "budget": 100000.0,
  "horizon": 5,
  "strategy": "needs"
}
```
- **Required Response Structure**:
```json
{
  "budgets": {
    "education": 28000.0,
    "health": 32000.0,
    "transport": 18000.0,
    "food": 10000.0,
    "energy": 7000.0,
    "water": 5000.0
  },
  "investigationStages": [
    { "stage": 1, "name": "Interpreting policy question", "status": "completed", "note": "Parsed target priorities" },
    { "stage": 2, "name": "Retrieving fiscal baseline data", "status": "completed", "note": "Queried demographics" },
    { "stage": 3, "name": "Comparing cross-sector needs", "status": "completed", "note": "Evaluated marginal utility" },
    { "stage": 4, "name": "Evaluating fiscal constraints", "status": "completed", "note": "Verified statutory debt caps" },
    { "stage": 5, "name": "Calculating deterministic allocation", "status": "completed", "note": "Simulated capital trajectory" },
    { "stage": 6, "name": "Synthesizing recommendations", "status": "completed", "note": "Formulated policy trade-offs" }
  ],
  "tradeoffs": [
    "Prioritizing healthcare and education moderates immediate physical capital multipliers.",
    "Underserved state targeting requires rigorous procurement monitoring."
  ],
  "risks": [
    "Inflation above 24% could erode recurrent maintenance budgets."
  ]
}
```

#### 4. Citizen Transparency Query: `POST /api/chat`
- **Request Body**: `{"query": "How much was spent on education in Ikeja?"}`
- **Response**: `{"answer": "In Ikeja LGA, the Ministry of Education disbursed ₦1,250,000,000 across 4 capital and recurrent projects in 2026."}`

#### 5. Government Shortfall Allocation: `POST /api/allocate`
- **Request Body**: `{"revenue_drop_percentage": 15}`
- **Response**: `{"simulation_result": "A 15% revenue drop requires cutting ₦3,450,000,000 from Recurrent - Overhead across all 8 MDAs while leaving Capital expenditures untouched."}`

---

## 4. Getting Started

### Prerequisites
- Node.js >= 20.x
- Python >= 3.10

### Frontend Execution
```bash
cd frontend
npm install
npm run dev
# The workspace is accessible at http://127.0.0.1:4173
```

### Verification & Test Suites
```bash
cd frontend
npm run check:lines    # Verifies all files <= 300 physical lines
npm run lint           # Verifies ESLint compliance
npm run format:check   # Verifies Prettier compliance
npm run check          # Runs 10 numerical invariant domain test suites
npm run test:ui        # Runs JSDOM React component integration tests
npm run build          # Compiles production Next.js release
```
