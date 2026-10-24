/** A missing param uses the fallback. A blank or non-whole value is rejected. */
export function readWhole(raw: string | null, fallback: number): number | null {
  if (raw == null) return fallback;
  const text = raw.trim();
  if (!/^\d+$/.test(text)) return null;
  const value = Number(text);
  if (!Number.isSafeInteger(value)) return null;
  return value;
}

/** A missing param uses the fallback. A blank value is rejected. `15.5` is allowed. */
export function readDecimal(raw: string | null, fallback: number): number | null {
  if (raw == null) return fallback;
  const text = raw.trim();
  if (!/^\d+(\.\d+)?$/.test(text)) return null;
  const value = Number(text);
  if (!Number.isFinite(value)) return null;
  return value;
}
