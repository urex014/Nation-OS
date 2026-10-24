/** Split an integer total by positive weights. The parts sum to `total`. */
export function splitInteger(
  total: number,
  weights: Record<string, number>,
): Record<string, number> {
  if (!Number.isInteger(total)) throw new Error("total must be an integer");
  const keys = Object.keys(weights);
  if (keys.length === 0) throw new Error("weights are required");
  const weightSum = keys.reduce((sum, key) => sum + weights[key], 0);
  if (weightSum <= 0) throw new Error("weights must be positive");

  const base = keys.map((key) => {
    const raw = (total * weights[key]) / weightSum;
    const value = Math.floor(raw);
    return { key, value, frac: raw - value };
  });
  let left = total - base.reduce((sum, row) => sum + row.value, 0);
  const order = [...base].sort((a, b) => b.frac - a.frac || a.key.localeCompare(b.key));
  const bonus = new Set<string>();
  for (const row of order) {
    if (left <= 0) break;
    bonus.add(row.key);
    left -= 1;
  }

  const out: Record<string, number> = {};
  for (const row of base) out[row.key] = row.value + (bonus.has(row.key) ? 1 : 0);
  return out;
}

/** Split a naira amount. Result is in naira and sums to the rounded input. */
export function splitNaira(total: number, weights: Record<string, number>): Record<string, number> {
  const units = Math.round(total);
  return splitInteger(units, weights);
}
