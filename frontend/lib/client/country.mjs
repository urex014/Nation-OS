/** Browser-safe aggregate data. Never import server analyst modules into a client component. */
import data from "../country-data.mjs";
import planning from "../domain/planning-engine.cjs";
import economy from "../domain/economy-engine.cjs";
import comparisons from "../domain/comparison-engine.cjs";

export const { states, zones, sectors } = data;
export const definitions = planning.definitions;
export const planningStates = states.map((state, index) => ({
  id: state.id,
  name: state.name,
  population: state.citizenCount,
  type: state.type,
  zone: state.zone,
  baselines: {
    food: state.food,
    ...Object.fromEntries(
      Object.entries(sectors).map(([key, sector]) => [key, sector.baseline[index]]),
    ),
  },
}));
export const accounts = economy.stateAccounts(states);
export const rankings = comparisons.rank(planningStates);
export const defaultPlan = {
  years: 5,
  scope: "all",
  growth: 2,
  delivery: 80,
  maintenance: 20,
  budgets: { food: 120, education: 160, transport: 180, health: 160, energy: 140, water: 140 },
};
export function calculatePlan(config) {
  const result = planning.project(planningStates, config);
  return { ...result, fiscal: economy.fiscalPlan(result.annualCost, config.years) };
}
export const suggestions = () => planning.recommend(planningStates);
export const number = (value, digits = 0) =>
  Number(value).toLocaleString("en-GB", { maximumFractionDigits: digits });
export const money = (value) => `A₦ ${number(value, 1)}M`;
