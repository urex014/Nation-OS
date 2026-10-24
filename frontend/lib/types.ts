export type Indicator = {
  title: string;
  value: string;
  period: string;
  bars: number[];
  source: string;
};

export type OverviewProject = {
  id: string;
  name: string;
  agency: string;
  approved: string;
  progress: number | null;
  expected: string;
  status: string;
};

export type Overview = {
  fiscalYear: number;
  currency: "NGN";
  unit: "million";
  jurisdictionId: string;
  jurisdictionName: string | null;
  note: string | null;
  metrics: {
    approvedExpenditure: string;
    statutoryTransfers: string;
    recurrentNonDebt: string;
    debtService: string;
    capitalExpenditure: string;
    revenueTarget: string;
  };
  indicators: Indicator[];
  revenueTrajectory: { quarters: string[]; collected: number[]; target: number[] };
  priorities: { name: string; amount: string; projects: number; percent: number }[];
  projects: OverviewProject[];
  jurisdictions: {
    id: string;
    name: string;
    zone: string;
    sharePercent: number;
    provenance: "published" | "outside";
  }[];
};

export type StateAllocation = {
  id: string;
  name: string;
  population: number | null;
  sharePercent: number;
  allocationAmount: number;
  provenance: "published";
  zone: string;
};

export type Revenue = {
  fiscalYear: number;
  distributablePool: number;
  tiers: { federal: number; states: number; local: number };
  sources: { id: string; name: string; amount: number }[];
  stateAllocations: StateAllocation[];
};

export type DecisionRecord = {
  id: string;
  createdAt: string;
  title: string;
  question: string;
  horizon: number;
  strategy: string;
  assumptions: string[];
  tradeoffs: string[];
  budgets: Record<string, number>;
  revisions: { field: string; before: string; after: string }[];
};

export type ScenarioPayload = {
  horizon: number;
  drop: number;
  growth: number;
  capital: number;
  years: { year: number; baseline: number; stressed: number; overhead: number; capital: number }[];
};
