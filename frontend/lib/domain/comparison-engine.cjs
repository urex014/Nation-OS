/** Normalize six service indicators against targets. Scores explain indicator arithmetic, never governance quality or causal effectiveness. */
(function (root) {
  const metrics = {
    food: {
      name: "Food affordability",
      label: "Food-pressure share",
      unit: "%",
      target: 20,
      higher: false,
    },
    education: {
      name: "Education",
      label: "School attendance",
      unit: "%",
      target: 90,
      higher: true,
    },
    transport: {
      name: "Transport",
      label: "Essential-service journey",
      unit: "min",
      target: 30,
      higher: false,
    },
    health: {
      name: "Healthcare",
      label: "Primary care access",
      unit: "%",
      target: 90,
      higher: true,
    },
    energy: { name: "Energy", label: "Electricity access", unit: "%", target: 95, higher: true },
    water: {
      name: "Water & sanitation",
      label: "Safe-water access",
      unit: "%",
      target: 95,
      higher: true,
    },
  };
  const defaults = Object.fromEntries(Object.keys(metrics).map((k) => [k, 1]));
  function score(key, value) {
    const d = metrics[key];
    if (!Number.isFinite(value) || value < 0) throw Error("Invalid comparison indicator");
    return Math.min(
      100,
      d.higher ? (value / d.target) * 100 : value === 0 ? 100 : (d.target / value) * 100,
    );
  }
  function rank(states, weights = defaults, metric = "overall", includeCapital = true) {
    if (metric !== "overall" && !metrics[metric]) throw Error("Unknown comparison metric");
    const keys = Object.keys(metrics),
      total = keys.reduce((n, k) => n + weights[k], 0);
    if (
      !Number.isFinite(total) ||
      total <= 0 ||
      keys.some((k) => !Number.isFinite(weights[k]) || weights[k] < 0)
    )
      throw Error("At least one comparison weight must be positive.");
    const rows = states
      .filter((s) => includeCapital || s.type !== "Capital territory")
      .map((s) => {
        const components = Object.fromEntries(keys.map((k) => [k, score(k, s.baselines[k])])),
          overall = keys.reduce((n, k) => n + (components[k] * weights[k]) / total, 0);
        return {
          ...s,
          components,
          overall,
          score: metric === "overall" ? overall : components[metric],
          contributions: Object.fromEntries(
            keys.map((k) => [k, (components[k] * weights[k]) / total]),
          ),
        };
      })
      .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name));
    let previous = null,
      previousRank = 0;
    rows.forEach((s, i) => {
      s.rank = previous !== null && Math.abs(s.score - previous) < 1e-9 ? previousRank : i + 1;
      previous = s.score;
      previousRank = s.rank;
    });
    return rows;
  }
  function improvements(states, stateId, weights = defaults) {
    const rows = rank(states, weights),
      state = rows.find((s) => s.id === stateId);
    if (!state) throw Error("Unknown state");
    return Object.keys(metrics)
      .map((k) => {
        const d = metrics[k],
          gap = Math.max(
            0,
            d.higher ? d.target - state.baselines[k] : state.baselines[k] - d.target,
          ),
          better = rows.filter(
            (s) => s.id !== state.id && s.components[k] > state.components[k] + 1e-9,
          ),
          peers = better.filter(
            (s) =>
              s.zone === state.zone &&
              s.population / state.population >= 0.5 &&
              s.population / state.population <= 2,
          ),
          pool = peers.length ? peers : better;
        const peer =
          [...pool].sort(
            (a, b) => b.components[k] - a.components[k] || a.name.localeCompare(b.name),
          )[0] || null;
        return {
          sector: k,
          baseline: state.baselines[k],
          target: d.target,
          gap,
          score: state.components[k],
          priority: (100 - state.components[k]) * weights[k],
          peer: peer
            ? {
                id: peer.id,
                name: peer.name,
                baseline: peer.baselines[k],
                sameZone: peer.zone === state.zone,
              }
            : null,
        };
      })
      .filter((r) => r.gap > 0 && weights[r.sector] > 0)
      .sort((a, b) => b.priority - a.priority || a.sector.localeCompare(b.sector));
  }
  const api = {
    metrics,
    defaults,
    score,
    rank,
    improvements,
    version: "aderin-state-comparison-v1",
  };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.ComparisonEngine = api;
})(globalThis);
