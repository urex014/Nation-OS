export type YearPoint = {
  year: number;
  baseline: number;
  stressed: number;
  overhead: number;
  capital: number;
};

export function projectHorizon(input: {
  horizon: number;
  drop: number;
  baseRevenue: number;
  capital: number;
  overhead: number;
  growth: number;
  startYear: number;
}): YearPoint[] {
  const points: YearPoint[] = [];
  const keep = 1 - input.drop / 100;
  for (let index = 0; index < input.horizon; index += 1) {
    const baseline = input.baseRevenue * (1 + input.growth) ** index;
    points.push({
      year: input.startYear + index,
      baseline,
      stressed: baseline * keep,
      overhead: input.overhead * keep,
      capital: input.capital,
    });
  }
  return points;
}
