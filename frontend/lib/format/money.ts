/** Compact figure for KPI cards: ₦68.3tn, ₦420bn. */
export function formatNaira(naira: number): string {
  const sign = naira < 0 ? "-" : "";
  const abs = Math.abs(naira);
  if (abs >= 1e12) return `${sign}₦${trim(abs / 1e12)}tn`;
  if (abs >= 1e9) return `${sign}₦${trim(abs / 1e9)}bn`;
  if (abs >= 1e6) return `${sign}₦${trim(abs / 1e6)}m`;
  return `${sign}₦${Math.round(abs).toLocaleString("en-NG")}`;
}

/** Full grouping for sentences that quote a ledger total. */
export function formatGroupedNaira(naira: number): string {
  const grouped = Math.round(Math.abs(naira))
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return `${naira < 0 ? "-" : ""}₦${grouped}`;
}

export function millionToNaira(million: number): number {
  return million * 1_000_000;
}

function trim(value: number): string {
  const whole = Math.abs(value - Math.round(value)) < 1e-9;
  if (value >= 100) return whole ? String(Math.round(value)) : value.toFixed(1);
  const fixed = value.toFixed(2);
  if (fixed.endsWith("00")) return value.toFixed(1);
  return fixed.replace(/0$/, "");
}
