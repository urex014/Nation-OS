import { allocateBudget } from "./planning.mjs";

/**
 * Move the published tax collection by a whole percent.
 * Other IGR stays at the published kobo. This is not a statutory tax rate.
 */
export function illustrateTax(taxKobo, otherKobo, percent) {
  if (!Number.isSafeInteger(taxKobo) || taxKobo < 0)
    throw Object.assign(Error("Published tax kobo must be a non-negative integer."), {
      status: 400,
    });
  if (!Number.isSafeInteger(otherKobo) || otherKobo < 0)
    throw Object.assign(Error("Published other IGR kobo must be a non-negative integer."), {
      status: 400,
    });
  if (!Number.isInteger(percent) || percent < -50 || percent > 50)
    throw Object.assign(Error("Choose a whole percent from -50 to 50."), { status: 400 });
  const tax = Math.round((taxKobo * (100 + percent)) / 100);
  return {
    taxKobo: tax,
    otherKobo,
    totalKobo: tax + otherKobo,
    projection:
      "Projection. Other internally generated revenue stays at the published amount. This changes the published tax collection, not a tax law, and it does not forecast what people will pay.",
  };
}

/** Split a published naira total with the planner's declared preference weights. */
export function illustrateSplit(envelopeNaira, strategy) {
  const split = allocateBudget(envelopeNaira, strategy);
  return {
    ...split,
    envelopeNaira,
    projection:
      "Projection. These weights are a chosen preference, not evidence that a sector works better. The total is published internally generated revenue rounded to the nearest naira. It is not an appropriation.",
  };
}
