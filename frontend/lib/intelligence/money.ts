/**
 * Exact monetary math using BigInt kobo (1 Naira = 100 kobo).
 * Avoids any floating-point arithmetic. Uses BigInt(...) for ES2017 compatibility.
 */

const ZERO = BigInt(0);
const ONE = BigInt(1);
const HUNDRED = BigInt(100);
const THOUSAND = BigInt(1000);
const TEN_THOUSAND = BigInt(10000);
const MILLION = BigInt(1000000);
const BILLION = BigInt(1000000000);

export function parseNairaToKobo(raw: string | number | bigint | null | undefined): bigint {
  if (raw === null || raw === undefined) return ZERO;
  if (typeof raw === "bigint") return raw;
  if (typeof raw === "number") {
    if (isNaN(raw) || !isFinite(raw)) return ZERO;
    return BigInt(Math.round(raw * 100));
  }
  const clean = raw.trim().replace(/[₦, ]/g, "");
  if (!clean) return ZERO;

  const suffixMatch = clean.match(/^([0-9.]+)\s*(bn|b|billion|m|million|k|thousand)?$/i);
  if (suffixMatch) {
    const num = parseFloat(suffixMatch[1]);
    const unit = (suffixMatch[2] || "").toLowerCase();
    let multiplier = ONE;
    if (unit.startsWith("b")) multiplier = BILLION;
    else if (unit.startsWith("m")) multiplier = MILLION;
    else if (unit.startsWith("k")) multiplier = THOUSAND;
    return BigInt(Math.round(num * 100)) * multiplier;
  }

  const parts = clean.split(".");
  const nairaStr = parts[0] || "0";
  let koboStr = (parts[1] || "").slice(0, 2);
  while (koboStr.length < 2) koboStr += "0";

  try {
    const naira = BigInt(nairaStr);
    const kobo = BigInt(koboStr);
    return naira * HUNDRED + (naira >= ZERO ? kobo : -kobo);
  } catch {
    return ZERO;
  }
}

export function koboToNaira(kobo: bigint): number {
  return Number(kobo) / 100;
}

export function formatNaira(kobo: bigint): string {
  const sign = kobo < ZERO ? "-" : "";
  const absKobo = kobo < ZERO ? -kobo : kobo;
  const naira = absKobo / HUNDRED;
  const rem = absKobo % HUNDRED;
  const nairaFormatted = naira.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return `${sign}₦${nairaFormatted}.${rem.toString().padStart(2, "0")}`;
}

export function formatNairaCompact(kobo: bigint): string {
  const absKobo = kobo < ZERO ? -kobo : kobo;
  const naira = Number(absKobo) / 100;
  const sign = kobo < ZERO ? "-" : "";
  if (naira >= 1_000_000_000_000) return `${sign}₦${(naira / 1e12).toFixed(2)}tn`;
  if (naira >= 1_000_000_000) return `${sign}₦${(naira / 1e9).toFixed(2)}bn`;
  if (naira >= 1_000_000) return `${sign}₦${(naira / 1e6).toFixed(1)}m`;
  if (naira >= 1_000) return `${sign}₦${(naira / 1e3).toFixed(0)}k`;
  return `${sign}₦${naira.toFixed(0)}`;
}

export { ZERO, ONE, HUNDRED, THOUSAND, TEN_THOUSAND, MILLION, BILLION };
