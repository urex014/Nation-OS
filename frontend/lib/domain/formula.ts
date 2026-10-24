/** Statutory FAAC vertical weights from NBS disbursement notes. They sum to 1. */
export const FEDERAL_SHARE = 0.5268;
export const STATE_SHARE = 0.2672;
export const LOCAL_SHARE = 0.206;

export type VerticalSplit = {
  pool: number;
  federal: number;
  states: number;
  local: number;
};

/** Derive the pool from the states tier so federal + states + local equals the pool. */
export function verticalSplit(statesAmount: number): VerticalSplit {
  const pool = statesAmount / STATE_SHARE;
  const federal = pool * FEDERAL_SHARE;
  const local = pool - federal - statesAmount;
  return { pool, federal, states: statesAmount, local };
}

export function round1(value: number): number {
  return Math.round(value * 10) / 10;
}
