/**
 * Static Demonstration Constants and Stages for Fiscal Mock Adapters
 */

export const MOCK_REVENUE_SOURCES = [
  { id: "vat", name: "Value Added Tax (VAT)", amount: 72000, statutoryPool: true },
  { id: "cit", name: "Company Income Tax (CIT)", amount: 58000, statutoryPool: true },
  { id: "pit", name: "Personal Income Tax", amount: 28000, statutoryPool: false },
  { id: "customs", name: "Customs & Excise Duties", amount: 22000, statutoryPool: true },
  { id: "resource", name: "Natural Resource Royalties", amount: 54000, statutoryPool: true },
  { id: "other", name: "Government Fees & Service Charges", amount: 36000, statutoryPool: false },
];

export const MOCK_INVESTIGATION_STAGES = [
  {
    stage: 1,
    name: "Interpreting policy question",
    status: "completed",
    note: "Parsed target sectors, spending ceilings, and jurisdiction scope.",
  },
  {
    stage: 2,
    name: "Retrieving fiscal baseline data",
    status: "completed",
    note: "Extracted demographic distributions and baseline service indicators.",
  },
  {
    stage: 3,
    name: "Comparing cross-sector funding needs",
    status: "completed",
    note: "Evaluated marginal utility across health, education, transport, and energy.",
  },
  {
    stage: 4,
    name: "Evaluating fiscal and delivery constraints",
    status: "completed",
    note: "Verified statutory debt-service and recurrent absorption caps.",
  },
  {
    stage: 5,
    name: "Calculating deterministic allocation scenarios",
    status: "completed",
    note: "Simulated 5-year capital trajectories without generative approximation.",
  },
  {
    stage: 6,
    name: "Synthesizing policy recommendations",
    status: "completed",
    note: "Formulated human-auditable decision trade-offs.",
  },
];

export const MOCK_TRADEOFFS = [
  "Prioritizing social sectors dampens immediate physical capital multipliers.",
  "Targeting underserved states requires strong procurement monitoring to avoid delivery slippage.",
  "Allocations assume recurrent maintenance of 20% to safeguard infrastructure lifespan.",
];

export const MOCK_ASSUMPTIONS = [
  "Annual economic growth stays constant at 2.0% over the planning period.",
  "Implementation and procurement efficiency is maintained at 80%.",
  "Inflation shocks do not exceed 3.0 percentage points above baseline.",
];
