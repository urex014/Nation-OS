import raw from "@/data/cited/ledger.json";

export const FISCAL_YEAR = raw.fiscalYear;
export const GDP_GROWTH = raw.gdpGrowthRate;
export const CITED = raw;

export function billionToMillion(billion: number): number {
  return Math.round(billion * 1000);
}

export function trillionToNaira(trillion: number): number {
  return Math.round(trillion * 1e12);
}

export function billionToNaira(billion: number): number {
  return Math.round(billion * 1e9);
}

export const SNAPSHOT = {
  approvedNaira: trillionToNaira(raw.snapshot.approvedTrillion),
  statutoryNaira: trillionToNaira(raw.snapshot.statutoryTrillion),
  recurrentNaira: trillionToNaira(raw.snapshot.recurrentTrillion),
  debtNaira: trillionToNaira(raw.snapshot.debtServiceTrillion),
  capitalNaira: trillionToNaira(raw.snapshot.capitalTrillion),
  revenueTargetNaira: trillionToNaira(raw.snapshot.revenueTargetTrillion),
};

export const INDICATORS = raw.indicators.map((row) => ({
  title: row.title,
  value: row.value,
  period: row.period,
  source: row.source,
  bars: [] as number[],
}));

export const RECEIPTS = raw.receiptsToStates.map((row) => ({
  id: row.id,
  name: row.name,
  amountMillion: Math.round(trillionToNaira(row.trillion) / 1e6),
}));

export const PROJECTS = raw.projects.map((row) => ({
  id: row.id,
  jurisdictionId: row.jurisdictionId,
  name: row.name,
  agency: row.agency,
  approvedNaira: billionToNaira(row.billion),
  expected: row.expected,
  status: row.status,
}));

export const PUBLISHED_MILLION: Record<string, number> = Object.fromEntries(
  raw.faac.states.map((row) => [row.id, billionToMillion(row.billion)]),
);

export const STATES_TIER_MILLION = Object.values(PUBLISHED_MILLION).reduce(
  (sum, value) => sum + value,
  0,
);

export const FAAC_HEADLINE_MILLION = billionToMillion(raw.faac.headlineTrillion * 1000);

export type Citation = {
  id: string;
  publisher: string;
  title: string;
  date: string;
  url: string;
  also?: string;
  note: string;
};

export function listCitations(): Citation[] {
  return Object.entries(raw.citations).map(([id, row]) => ({ id, ...row }));
}
