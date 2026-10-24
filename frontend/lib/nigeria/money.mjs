/** Exact money maths in kobo. 1 naira = 100 kobo. Amounts stay integers. */

const KOBO = 100n;

export function divRound(numerator, denominator) {
  if (denominator === 0n) throw Object.assign(Error("Cannot divide by zero."), { status: 400 });
  const negative = numerator < 0n !== denominator < 0n;
  const num = numerator < 0n ? -numerator : numerator;
  const den = denominator < 0n ? -denominator : denominator;
  let quote = num / den;
  if (num % den > 0n && (num % den) * 2n >= den) quote += 1n;
  return negative ? -quote : quote;
}

function decimalToScaled(text) {
  const trimmed = String(text).trim();
  const negative = trimmed.startsWith("-");
  const [whole, frac = ""] = trimmed.replace("-", "").split(".");
  const digits = `${whole || "0"}${frac}`.replace(/\D/g, "") || "0";
  return { negative, digits: BigInt(digits), scale: 10n ** BigInt(frac.length) };
}

export function nairaToKobo(value) {
  if (typeof value === "bigint") return value * KOBO;
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw Object.assign(Error("Enter a real amount."), { status: 400 });
  }
  const text = Number.isSafeInteger(value) ? String(value) : value.toFixed(6);
  const parsed = decimalToScaled(text);
  const kobo = divRound(parsed.digits * KOBO, parsed.scale);
  return parsed.negative ? -kobo : kobo;
}

const UNIT_NAIRA = {
  naira: 1n,
  million: 1_000_000n,
  billion: 1_000_000_000n,
  trillion: 1_000_000_000_000n,
};

export function amountToKobo(value, unit = "naira") {
  if (unit === "kobo") {
    if (!Number.isSafeInteger(value)) {
      throw Object.assign(Error("Kobo must be a whole number."), { status: 400 });
    }
    return BigInt(value);
  }
  const multiplier = UNIT_NAIRA[unit];
  if (!multiplier) throw Object.assign(Error("Unknown money unit."), { status: 400 });
  const parsed = decimalToScaled(Number.isSafeInteger(value) ? String(value) : String(value));
  const kobo = divRound(parsed.digits * multiplier * KOBO, parsed.scale);
  return parsed.negative ? -kobo : kobo;
}

export function koboToSafeNaira(kobo) {
  const naira = divRound(kobo, KOBO);
  const limit = BigInt(Number.MAX_SAFE_INTEGER);
  if (naira > limit || naira < -limit) {
    throw Object.assign(Error("That amount is too large to handle safely."), { status: 400 });
  }
  return Number(naira);
}

function group(value) {
  return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

export function formatExactNaira(kobo) {
  const naira = divRound(kobo, KOBO);
  const negative = naira < 0n;
  const abs = negative ? -naira : naira;
  const sign = negative ? "-" : "";
  return {
    full: `${sign}₦${group(abs)}`,
    short: `${sign}${shortScale(abs)}`,
    naira: Number(abs) * (negative ? -1 : 1),
    kobo: kobo.toString(),
  };
}

function shortScale(abs) {
  for (const [unit, label] of [
    [10n ** 12n, "tn"],
    [10n ** 9n, "bn"],
    [10n ** 6n, "m"],
  ]) {
    if (abs < unit) continue;
    const milli = divRound(abs * 1000n, unit);
    const whole = milli / 1000n;
    const frac = (milli % 1000n).toString().padStart(3, "0").replace(/0+$/, "");
    return `₦${whole}${frac ? `.${frac}` : ""}${label}`;
  }
  return `₦${group(abs)}`;
}

export function describeNaira(naira) {
  if (!Number.isSafeInteger(naira)) {
    throw Object.assign(Error("Amount must be whole naira."), { status: 400 });
  }
  return formatExactNaira(BigInt(naira) * KOBO);
}

/** Split a whole-naira total by weights. Largest remainder keeps the total exact. */
export function largestRemainder(total, weights) {
  if (!Number.isSafeInteger(total) || total < 0) {
    throw Object.assign(Error("Total must be whole naira."), { status: 400 });
  }
  const scaled = weights.map((weight) => {
    if (!Number.isFinite(weight) || weight < 0) {
      throw Object.assign(Error("Shares must be zero or more."), { status: 400 });
    }
    return decimalToScaled(String(weight));
  });
  const scale = scaled.reduce((max, item) => (item.scale > max ? item.scale : max), 1n);
  const ints = scaled.map((item) => item.digits * (scale / item.scale));
  const sum = ints.reduce((acc, item) => acc + item, 0n);
  if (sum === 0n) throw Object.assign(Error("Shares must add up to more than zero."), { status: 400 });
  const totalNaira = BigInt(total);
  const rows = ints.map((weight) => {
    const raw = totalNaira * weight;
    return { floor: raw / sum, rest: raw % sum };
  });
  let left = totalNaira - rows.reduce((acc, row) => acc + row.floor, 0n);
  const order = rows
    .map((row, index) => ({ index, rest: row.rest }))
    .sort((a, b) => (a.rest === b.rest ? 0 : a.rest > b.rest ? -1 : 1));
  const out = rows.map((row) => row.floor);
  for (const item of order) {
    if (left === 0n) break;
    out[item.index] += 1n;
    left -= 1n;
  }
  return out.map((value) => Number(value));
}

export function percentOfKobo(baseKobo, percent) {
  if (!Number.isFinite(percent)) throw Object.assign(Error("Enter a percent."), { status: 400 });
  const parsed = decimalToScaled(String(Math.abs(percent)));
  const signed = percent < 0 ? -baseKobo : baseKobo;
  return divRound(signed * parsed.digits, parsed.scale * 100n);
}

export function compoundKobo(baseKobo, ratePercent, years, direction = "grow") {
  if (!Number.isInteger(years) || years < 0 || years > 100) {
    throw Object.assign(Error("Years must be a whole number from 0 to 100."), { status: 400 });
  }
  if (!Number.isFinite(ratePercent)) throw Object.assign(Error("Enter a rate."), { status: 400 });
  const parsed = decimalToScaled(String(Math.abs(ratePercent)));
  const hundred = 100n * parsed.scale;
  const rate = (ratePercent < 0 ? -1n : 1n) * parsed.digits;
  const numerator = hundred + rate;
  if (numerator <= 0n) throw Object.assign(Error("That rate would wipe the amount out."), { status: 400 });
  let acc = baseKobo;
  for (let year = 0; year < years; year += 1) {
    acc = direction === "discount" ? divRound(acc * hundred, numerator) : divRound(acc * numerator, hundred);
  }
  return acc;
}
