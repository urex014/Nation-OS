/** Project service indicators year by year using explicit scenario inputs. Coefficients are illustrative, not fitted causal effects. */
(function (root) {
  const definitions = {
    food: {
      name: "Food affordability",
      metric: "Food-pressure population share",
      unit: "%",
      higher: false,
      target: 20,
      cost: 14,
      drift: 0.3,
    },
    education: {
      name: "Education",
      metric: "School attendance",
      unit: "%",
      higher: true,
      target: 90,
      cost: 12,
      drift: -0.2,
    },
    transport: {
      name: "Transport",
      metric: "Essential-service journey time",
      unit: "min",
      higher: false,
      target: 30,
      cost: 10,
      drift: 0.4,
    },
    health: {
      name: "Healthcare",
      metric: "Primary care access",
      unit: "%",
      higher: true,
      target: 90,
      cost: 15,
      drift: -0.2,
    },
    energy: {
      name: "Energy",
      metric: "Electricity access",
      unit: "%",
      higher: true,
      target: 95,
      cost: 13,
      drift: -0.2,
    },
    water: {
      name: "Water & sanitation",
      metric: "Safe-water access",
      unit: "%",
      higher: true,
      target: 95,
      cost: 11,
      drift: -0.2,
    },
  };
  const clamp = (x, key) => Math.max(0, Math.min(key === "transport" ? 240 : 100, x));
  function recommend(states) {
    return states
      .flatMap((s) =>
        Object.entries(definitions).map(([sector, d]) => {
          const baseline = s.baselines[sector],
            gap = Math.max(0, d.higher ? d.target - baseline : baseline - d.target);
          return {
            state: s.name,
            stateId: s.id,
            sector,
            baseline,
            gap,
            score: (gap / (sector === "transport" ? 90 : 100)) * Math.sqrt(s.population / 1e6),
            reason: `${d.metric}: ${baseline.toFixed(1)}${d.unit}; target ${d.target}${d.unit}. Ranked by normalized service gap × square root of state population.`,
          };
        }),
      )
      .sort((a, b) => b.score - a.score)
      .slice(0, 6);
  }
  function validate(config) {
    if (
      ![5, 10].includes(config.years) ||
      !Number.isFinite(config.growth) ||
      config.growth < 0 ||
      config.growth > 5 ||
      !Number.isFinite(config.delivery) ||
      config.delivery < 0 ||
      config.delivery > 100 ||
      !Number.isFinite(config.maintenance) ||
      config.maintenance < 0 ||
      config.maintenance > 50
    )
      throw Error("Invalid planning assumptions");
    for (const key of Object.keys(definitions))
      if (
        !Number.isFinite(config.budgets[key]) ||
        config.budgets[key] < 0 ||
        config.budgets[key] > 2000
      )
        throw Error("Annual sector budgets must be between 0 and 2,000 million A₦.");
  }
  // Retain baseline and intervention paths separately so incremental effects remain inspectable.
  function project(states, config) {
    validate(config);
    if (config.scope !== "all" && !states.some((s) => s.id === config.scope))
      throw Error("Unknown state scope");
    const keys = Object.keys(definitions),
      annual = Object.values(config.budgets).reduce((a, b) => a + b, 0),
      scopeStates = states.filter((s) => config.scope === "all" || s.id === config.scope),
      scopePopulation = scopeStates.reduce((a, s) => a + s.population, 0),
      totalPopulation = states.reduce((a, s) => a + s.population, 0);
    let current = states.map((s) => ({
      id: s.id,
      no: { ...s.baselines },
      with: { ...s.baselines },
      low: { ...s.baselines },
      high: { ...s.baselines },
    }));
    const years = [];
    for (let year = 0; year <= config.years; year++) {
      const growthFactor = (1 + config.growth / 100) ** year;
      if (year) {
        current = current.map((row, i) => {
          const state = states[i],
            active = config.scope === "all" || config.scope === state.id,
            newRow = { id: row.id, no: {}, with: {}, low: {}, high: {} };
          for (const key of keys) {
            const d = definitions[key],
              direction = d.higher ? 1 : -1;
            newRow.no[key] = clamp(row.no[key] + d.drift * (1 + config.growth / 2), key);
            for (const [path, delivery] of [
              ["with", config.delivery],
              ["low", Math.max(0, config.delivery - 20)],
              ["high", Math.min(100, config.delivery + 20)],
            ]) {
              const last = row[path][key],
                remaining = d.higher
                  ? (100 - last) / 100
                  : last / (key === "transport" ? 120 : 100);
              const share = active ? state.population / scopePopulation : 0;
              const gross = config.budgets[key] * share;
              const investment = gross * (1 - config.maintenance / 100);
              const gain =
                (investment / Math.max(0.001, (state.population / 1e6) * growthFactor) / d.cost) *
                (delivery / 100) *
                Math.max(0, Math.min(1, remaining));
              const retained =
                Math.max(0, d.higher ? last - row.no[key] : row.no[key] - last) *
                (1 - (config.maintenance >= 20 ? 0.99 : 0.95));
              newRow[path][key] = clamp(
                last + d.drift * (1 + config.growth / 2) + direction * (gain - retained),
                key,
              );
            }
          }
          return newRow;
        });
      }
      const national = {};
      for (const key of keys) {
        national[key] = {};
        for (const variant of ["no", "with", "low", "high"])
          national[key][variant] =
            current.reduce((a, row, i) => a + row[variant][key] * states[i].population, 0) /
            totalPopulation;
      }
      years.push({
        year: 2026 + year,
        population: Math.round(totalPopulation * growthFactor),
        annualCost: year ? annual : 0,
        cumulativeCost: annual * year,
        national,
        states: current.map((row) => ({
          id: row.id,
          no: { ...row.no },
          with: { ...row.with },
          low: { ...row.low },
          high: { ...row.high },
        })),
      });
    }
    return {
      version: "aderin-long-term-rules-v1",
      dataset: "aderin-state-sectors-q3-v2",
      config: JSON.parse(JSON.stringify(config)),
      annualCost: annual,
      totalCost: annual * config.years,
      scopePopulation,
      years,
      limitations: [
        "Illustrative coefficients, not calibrated forecasts",
        "No causal cross-sector multipliers",
        "Constant annual budgets in real 2026 A₦; excludes inflation, financing and detailed operating costs",
        "Population growth scales demand uniformly; no migration or age-cohort transitions",
        "Religion and individual identity are not used by scoring or allocation",
      ],
      assumptions: {
        baselineYear: 2026,
        budgetUnit: "million real 2026 A₦ per year",
        allocation: "Population share within selected scope",
        maintenance:
          "Share of annual budget reserved for upkeep; upkeep >=20% retains 99% of accumulated gains annually, otherwise 95%",
        formula:
          "Annual gain = investment per million projected residents / cost coefficient × delivery × remaining capacity. Baseline drift applies to all paths.",
        coefficients: definitions,
      },
    };
  }
  const api = { definitions, recommend, project };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.PlanningEngine = api;
})(globalThis);
