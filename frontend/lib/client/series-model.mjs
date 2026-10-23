/** A small inspectable time-series experiment, separate from canonical policy evidence. */
export function createMonthlyData(states) {
  return states.flatMap((state, index) =>
    Array.from({ length: 24 }, (_, month) => ({
      stateId: state.id,
      month: `${2025 + Math.floor(month / 12)}-${String((month % 12) + 1).padStart(2, "0")}`,
      basket: Math.round(
        15000 *
          (1 + (index % 6) * 0.025) *
          (1 + month * 0.009) *
          (month >= 21 ? 1 + state.price / 100 : 1),
      ),
      freight: Math.round(100 * (1 + month * 0.004)),
      rainfall: Math.round(95 + 45 * Math.sin((((month % 12) - 2) * Math.PI) / 6)),
    })),
  );
}
export function parseMonthlyCsv(text, states) {
  if (text.length > 1000000) throw Error("CSV must be under 1 MB.");
  const [header, ...lines] = text.trim().split(/\r?\n/);
  if (header !== "stateId,month,basket,freight,rainfall")
    throw Error("Expected header: stateId,month,basket,freight,rainfall");
  const seen = new Set();
  const rows = lines.map((line, index) => {
    const cells = line.split(",");
    const [stateId, month, basket, freight, rainfall] = cells;
    const key = `${stateId}:${month}`;
    if (
      cells.length !== 5 ||
      !states.some((state) => state.id === stateId) ||
      !/^\d{4}-(0[1-9]|1[0-2])$/.test(month) ||
      seen.has(key) ||
      [basket, freight, rainfall].some(
        (value) => !value?.trim() || !Number.isFinite(Number(value)) || Number(value) < 0,
      )
    ) {
      throw Error(`Invalid or duplicate data at row ${index + 2}.`);
    }
    seen.add(key);
    return {
      stateId,
      month,
      basket: Number(basket),
      freight: Number(freight),
      rainfall: Number(rainfall),
    };
  });
  if (!rows.length) throw Error("CSV contains no observations.");
  return rows;
}
function fit(rows) {
  const xMean = (rows.length - 1) / 2;
  const mean = rows.reduce((sum, row) => sum + row.basket, 0) / rows.length;
  const denominator = rows.reduce((sum, _, index) => sum + (index - xMean) ** 2, 0);
  const slope =
    rows.reduce((sum, row, index) => sum + (index - xMean) * (row.basket - mean), 0) / denominator;
  return (index) => mean + slope * (index - xMean);
}
export function forecastSeries(input, horizon = 6, fuel = 0) {
  const rows = [...input].sort((a, b) => a.month.localeCompare(b.month));
  if (rows.length < 9) throw Error("At least nine monthly observations are required.");
  if (![3, 6, 12].includes(horizon) || !Number.isFinite(fuel) || fuel < -50 || fuel > 100)
    throw Error("Invalid model controls.");
  const ordinal = (month) => Number(month.slice(0, 4)) * 12 + Number(month.slice(5)) - 1;
  if (
    rows.some(
      (row, index) => index > 0 && ordinal(row.month) !== ordinal(rows[index - 1].month) + 1,
    )
  )
    throw Error("Monthly observations must be unique and consecutive.");
  const train = rows.slice(0, -3),
    predict = fit(train);
  const mae =
    rows
      .slice(-3)
      .reduce((sum, row, index) => sum + Math.abs(row.basket - predict(train.length + index)), 0) /
    3;
  const full = fit(rows),
    last = ordinal(rows.at(-1).month);
  return {
    training: train.length,
    holdout: 3,
    mae,
    forecast: Array.from({ length: horizon }, (_, index) => {
      const date = new Date(
        Date.UTC(Math.floor((last + index + 1) / 12), (last + index + 1) % 12, 1),
      );
      const baseline = Math.max(0, full(rows.length + index));
      return {
        month: date.toISOString().slice(0, 7),
        baseline,
        stressed: baseline * (1 + (fuel / 100) * 0.25),
      };
    }),
  };
}
