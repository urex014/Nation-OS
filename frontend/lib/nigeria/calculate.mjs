import { SECTORS } from "./constants.mjs";
import {
  amountToKobo,
  compoundKobo,
  describeNaira,
  divRound,
  formatExactNaira,
  koboToSafeNaira,
  largestRemainder,
  percentOfKobo,
} from "./money.mjs";

function fail(message) {
  throw Object.assign(Error(message), { status: 400 });
}

function taken(value, unit = "naira") {
  return amountToKobo(value, unit);
}

function moneyResult(kobo, formula, inputs, extra = {}) {
  const shown = formatExactNaira(kobo);
  return {
    formula,
    inputs,
    resultNaira: koboToSafeNaira(kobo),
    resultKobo: shown.kobo,
    display: shown.short,
    displayFull: shown.full,
    source: extra.source || null,
    enteredByUser: Boolean(extra.enteredByUser),
    ...extra,
  };
}

function labelled(amount, unit, source, enteredByUser) {
  const shown = formatExactNaira(taken(amount, unit));
  return {
    label: source || (enteredByUser ? "Amount" : "Amount"),
    display: shown.short,
    displayFull: shown.full,
    naira: shown.naira,
    enteredByUser: Boolean(enteredByUser),
  };
}

/** Deterministic arithmetic. The model quotes this result; it does not invent one. */
export function calculate(input = {}) {
  const operation = input.operation;
  const source = input.source || (input.enteredByUser ? "the amount you typed" : "the figure supplied");
  const enteredByUser = Boolean(input.enteredByUser);
  const unit = input.unit || "naira";
  if (operation === "percentOf") {
    if (input.amount == null || input.percent == null) fail("Percent needs an amount and a percent.");
    const base = taken(input.amount, unit);
    const result = percentOfKobo(base, input.percent);
    const baseShown = formatExactNaira(base);
    return moneyResult(
      result,
      `${input.percent}% of ${baseShown.short} (${baseShown.full})`,
      [labelled(input.amount, unit, source, enteredByUser), { label: "Percent", display: `${input.percent}%`, enteredByUser }],
      { operation, source, enteredByUser },
    );
  }
  if (operation === "share") {
    if (input.amount == null || input.other == null) fail("A share needs a part and a whole.");
    const part = taken(input.amount, unit);
    const whole = taken(input.other, input.otherUnit || unit);
    if (whole === 0n) fail("Cannot share by zero.");
    const hundredths = (part * 10000n) / whole;
    const percent = Number(hundredths) / 100;
    return {
      operation,
      formula: `${formatExactNaira(part).short} / ${formatExactNaira(whole).short} × 100`,
      inputs: [
        labelled(input.amount, unit, "Part", enteredByUser),
        labelled(input.other, input.otherUnit || unit, "Whole", enteredByUser),
      ],
      resultPercent: percent,
      display: `${percent}%`,
      displayFull: `${percent}%`,
      source,
      enteredByUser,
    };
  }
  if (operation === "sum" || operation === "difference") {
    const values = operation === "sum" ? input.values : [input.amount, input.other];
    if (!Array.isArray(values) || values.length < 2) fail("Add or subtract at least two amounts.");
    const kobo = values.map((value) => taken(value, unit));
    const total =
      operation === "sum"
        ? kobo.reduce((acc, item) => acc + item, 0n)
        : kobo.slice(1).reduce((acc, item) => acc - item, kobo[0]);
    const shown = values.map((value) => formatExactNaira(taken(value, unit)).short);
    return moneyResult(
      total,
      operation === "sum" ? shown.join(" + ") : `${shown[0]} − ${shown.slice(1).join(" − ")}`,
      values.map((value, index) => labelled(value, unit, `Amount ${index + 1}`, enteredByUser)),
      { operation, source, enteredByUser },
    );
  }
  if (operation === "growth" || operation === "inflationAdjust") {
    if (input.amount == null || input.percent == null || input.years == null) {
      fail("Growth needs an amount, a rate, and a number of years.");
    }
    const base = taken(input.amount, unit);
    const result = compoundKobo(
      base,
      input.percent,
      input.years,
      operation === "inflationAdjust" ? "discount" : "grow",
    );
    const verb = operation === "inflationAdjust" ? "adjusted for inflation" : "grown";
    return moneyResult(
      result,
      `${formatExactNaira(base).short} ${verb} at ${input.percent}% for ${input.years} years`,
      [
        labelled(input.amount, unit, source, enteredByUser),
        { label: "Rate", display: `${input.percent}%`, enteredByUser: false },
        { label: "Years", display: String(input.years), enteredByUser: false },
      ],
      { operation, source, enteredByUser },
    );
  }
  if (operation === "perCapita") {
    if (input.amount == null || !Number.isInteger(input.people) || input.people <= 0) {
      fail("Per person needs an amount and a whole number of people.");
    }
    const result = divRound(taken(input.amount, unit), BigInt(input.people));
    return moneyResult(
      result,
      `${formatExactNaira(taken(input.amount, unit)).short} / ${input.people.toLocaleString("en-NG")} people`,
      [
        labelled(input.amount, unit, source, enteredByUser),
        { label: "People", display: input.people.toLocaleString("en-NG"), enteredByUser: false },
      ],
      { operation, source, enteredByUser },
    );
  }
  if (operation === "split") {
    if (input.amount == null || !Array.isArray(input.splits) || input.splits.length < 1) {
      fail("A split needs an amount and percentages.");
    }
    const total = koboToSafeNaira(taken(input.amount, unit));
    const shares = largestRemainder(
      total,
      input.splits.map((item) => item.percent),
    );
    const rows = input.splits.map((item, index) => ({
      label: item.label || `Share ${index + 1}`,
      percent: item.percent,
      ...describeNaira(shares[index]),
      naira: shares[index],
    }));
    return {
      operation,
      formula: `Split ${describeNaira(total).short} by the percentages you gave, largest remainder`,
      inputs: [
        labelled(input.amount, unit, source, enteredByUser),
        ...rows.map((row) => ({ label: row.label, display: `${row.percent}%`, enteredByUser: false })),
      ],
      rows,
      resultNaira: total,
      display: describeNaira(total).short,
      displayFull: describeNaira(total).full,
      source,
      enteredByUser,
    };
  }
  if (operation === "convert") {
    if (input.amount == null || !input.toUnit) fail("Convert needs an amount and a target unit.");
    const kobo = taken(input.amount, unit);
    const shown = formatExactNaira(kobo);
    return moneyResult(kobo, `${input.amount} ${unit} = ${shown.short} (${shown.full})`, [
      labelled(input.amount, unit, source, enteredByUser),
    ], { operation, source, enteredByUser, toUnit: input.toUnit });
  }
  fail("Unknown calculation.");
}

export function splitSectors(totalNaira, percentages) {
  const keys = Object.keys(SECTORS);
  const weights = keys.map((key) => percentages?.[key]);
  if (weights.some((weight) => !Number.isFinite(weight) || weight < 0)) {
    fail("Each sector needs a percent.");
  }
  const sum = weights.reduce((acc, weight) => acc + weight, 0);
  if (Math.abs(sum - 100) > 0.05) fail("Sector percentages must add up to 100.");
  const shares = largestRemainder(totalNaira, weights);
  return Object.fromEntries(keys.map((key, index) => [key, shares[index]]));
}
