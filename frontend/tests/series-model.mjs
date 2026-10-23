import assert from "node:assert/strict";
import { createMonthlyData, forecastSeries, parseMonthlyCsv } from "../lib/client/series-model.mjs";
import { states } from "../lib/client/country.mjs";
const rows = createMonthlyData(states).filter((row) => row.stateId === states[0].id);
const result = forecastSeries(rows);
assert.equal(result.training, 21);
assert.equal(result.holdout, 3);
assert.equal(result.forecast[0].month, "2027-01");
assert.equal(result.forecast.length, 6);
assert(forecastSeries(rows, 6, 10).forecast[0].stressed > result.forecast[0].baseline);
assert.throws(() => forecastSeries(rows.slice(1, 8)));
assert.throws(() => forecastSeries(rows.filter((_, index) => index !== 3)));
assert.throws(() => parseMonthlyCsv("bad header", states));
const csv = "stateId,month,basket,freight,rainfall\nAD-11,2026-01,100,100,90";
assert.equal(parseMonthlyCsv(csv, states).length, 1);
assert.throws(() => parseMonthlyCsv(csv + "\nAD-11,2026-01,100,100,90", states));
console.log(
  "Passed: trend holdout, monthly continuity, fuel sensitivity and strict experimental CSV validation.",
);
