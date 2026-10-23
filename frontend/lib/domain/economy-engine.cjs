/** Keep annual fiscal flows separate from debt stocks. State accounts reconcile to the consolidated national baseline. */
(function (root) {
  const baseline = {
    version: "aderin-economy-v1",
    year: 2026,
    population: 24600000,
    gdp: 1800000,
    realGrowth: 3,
    inflation: 8,
    unemployment: 12,
    revenue: 270000,
    spending: 315000,
    debt: 810000,
    exports: 160000,
    imports: 195000,
    planningEnvelope: 3000,
    interest: 54000,
    spendingGrowth: 2,
    unit: "million Aderin naira (A₦)",
    revenueSources: [
      ["Tax revenue", 180000],
      ["Resource royalties & public dividends", 54000],
      ["Other non-tax revenue", 36000],
    ],
    allocations: [
      ["Public-service payroll", 105000],
      ["Operations & service delivery", 63000],
      ["Transfers & social protection", 45000],
      ["Debt financing charges", 54000],
      ["Committed capital projects", 45000],
      ["Unallocated planning envelope", 3000],
    ],
  };
  const resources = [
    {
      name: "Crude oil",
      zones: [5],
      stock: "1.2 billion barrels",
      output: "18 million barrels / year",
      revenue: 30000,
      risk: "Price volatility, spills and coastal habitat loss",
    },
    {
      name: "Natural gas",
      zones: [4, 5],
      stock: "180 billion cubic metres",
      output: "4 billion cubic metres / year",
      revenue: 14000,
      risk: "Methane leakage, infrastructure and export demand",
    },
    {
      name: "Iron ore & limestone",
      zones: [0, 2],
      stock: "240 million tonnes combined",
      output: "5 million tonnes / year",
      revenue: 6000,
      risk: "Water use, land restoration and commodity prices",
    },
    {
      name: "Commercial forests",
      zones: [1, 4],
      stock: "2.4 million hectares of forest land",
      output: "0.8 million cubic metres timber / year",
      revenue: 4000,
      risk: "Deforestation, biodiversity and community land rights",
    },
    {
      name: "Agricultural land",
      zones: [0, 1, 2],
      stock: "9.6 million cultivable hectares",
      output: "12 million tonnes crops / year",
      revenue: 0,
      risk: "Rainfall, soil degradation and irrigation access",
    },
    {
      name: "Solar & hydropower potential",
      zones: [0, 1, 4],
      stock: "8 GW technical potential",
      output: "1.2 GW installed capacity",
      revenue: 0,
      risk: "Grid access, seasonality and resettlement impacts",
    },
  ];
  // The existing investment envelope is already spent in the baseline; only excess adds borrowing.
  function fiscalPlan(annualCost, years) {
    if (!Number.isFinite(annualCost) || annualCost < 0 || ![5, 10].includes(years))
      throw Error("Invalid fiscal plan inputs");
    const supplemental = Math.max(0, annualCost - baseline.planningEnvelope),
      interestRate = baseline.interest / baseline.debt;
    let debt = baseline.debt,
      noDebt = baseline.debt;
    const rows = [];
    for (let t = 0; t <= years; t++) {
      const gdp = baseline.gdp * (1 + baseline.realGrowth / 100) ** t,
        revenue = baseline.revenue * (1 + baseline.realGrowth / 100) ** t,
        nonInterest =
          (baseline.spending - baseline.interest - baseline.planningEnvelope) *
            (1 + baseline.spendingGrowth / 100) ** t +
          baseline.planningEnvelope;
      const interest = t ? debt * interestRate : baseline.interest,
        noInterest = t ? noDebt * interestRate : baseline.interest,
        spending = nonInterest + interest + (t ? supplemental : 0),
        noSpending = nonInterest + noInterest,
        deficit = spending - revenue,
        noDeficit = noSpending - revenue;
      if (t) {
        debt = Math.max(0, debt + deficit);
        noDebt = Math.max(0, noDebt + noDeficit);
      }
      rows.push({
        year: 2026 + t,
        gdp,
        revenue,
        spending,
        deficit,
        debt,
        debtToGDP: (debt / gdp) * 100,
        noPlanDebt: noDebt,
        extraDebt: debt - noDebt,
        incrementalFunding: t ? supplemental : 0,
      });
    }
    return {
      version: "aderin-fiscal-rules-v1",
      baselineVersion: baseline.version,
      annualCost,
      available: baseline.planningEnvelope,
      utilization: (annualCost / baseline.planningEnvelope) * 100,
      supplemental,
      remaining: Math.max(0, baseline.planningEnvelope - annualCost),
      rows,
      assumptions: {
        currency: "million real 2026 A₦",
        gdpGrowth: baseline.realGrowth,
        revenueGrowth: baseline.realGrowth,
        nonInterestSpendingGrowth: baseline.spendingGrowth,
        financingRate: interestRate * 100,
        financing:
          "Existing planning envelope is already in the budget; only costs above it add borrowing. Annual deficits increase debt. GDP growth is exogenous, with no policy return assumed.",
        scope:
          "National treasury comparison for all scopes; state own-source revenue and debt are not modelled.",
      },
    };
  }
  function stateAccounts(states) {
    const zoneShares = [0.14, 0.18, 0.15, 0.24, 0.12, 0.17],
      population = states.reduce((n, s) => n + s.citizenCount, 0);
    const rows = states.map((s, i) => ({
      ...s,
      population: s.citizenCount,
      productivity: 0.8 + (i % 6) * 0.095,
      taxWeight: s.citizenCount * (0.7 + (i % 7) * 0.11),
      spendWeight: s.citizenCount * (1.3 - (i % 6) * 0.08),
      debtWeight: s.citizenCount * (0.8 + (i % 5) * 0.13),
      tradeWeight: s.citizenCount * (0.7 + (i % 6) * 0.17),
    }));
    const sum = (k) => rows.reduce((n, s) => n + s[k], 0);
    const tax = sum("taxWeight"),
      spend = sum("spendWeight"),
      debt = sum("debtWeight"),
      trade = sum("tradeWeight");
    for (const r of rows) {
      const zone = rows.filter((s) => s.parentZone === r.parentZone),
        zoneWeight = zone.reduce((n, s) => n + s.population * s.productivity, 0);
      r.gdp =
        (baseline.gdp * zoneShares[r.parentZone] * r.population * r.productivity) / zoneWeight;
      r.revenue = (baseline.revenue * 0.6 * r.taxWeight) / tax;
      r.spending = (baseline.spending * 0.65 * r.spendWeight) / spend;
      r.debt = (baseline.debt * 0.55 * r.debtWeight) / debt;
      r.exports = (baseline.exports * r.tradeWeight) / trade;
      r.imports = (baseline.imports * r.taxWeight) / tax;
      r.growthRaw = 1.4 + (rows.indexOf(r) % 9) * 0.42;
      r.inflationRaw = 6.2 + (rows.indexOf(r) % 8) * 0.47;
      r.unemploymentRaw = 8 + (rows.indexOf(r) % 10) * 0.9;
    }
    const avg = (key, weight) =>
      rows.reduce((n, s) => n + s[key] * s[weight], 0) / rows.reduce((n, s) => n + s[weight], 0);
    const growthShift = baseline.realGrowth - avg("growthRaw", "gdp"),
      inflationShift = baseline.inflation - avg("inflationRaw", "population"),
      unemploymentShift = baseline.unemployment - avg("unemploymentRaw", "population");
    for (const r of rows) {
      r.realGrowth = r.growthRaw + growthShift;
      r.inflation = r.inflationRaw + inflationShift;
      r.unemployment = r.unemploymentRaw + unemploymentShift;
      r.deficit = r.spending - r.revenue;
      r.planningEnvelope = (baseline.planningEnvelope * 0.65 * r.spendWeight) / spend;
    }
    return {
      version: "aderin-state-accounts-v2",
      states: rows,
      federal: {
        revenue: baseline.revenue * 0.4,
        spending: baseline.spending * 0.35,
        debt: baseline.debt * 0.45,
        planningEnvelope: baseline.planningEnvelope * 0.35,
      },
      notes:
        "Synthetic state accounts. National GDP and trade sum across states; state plus federal revenue, spending and debt reconcile to consolidated totals. State output uses population and productivity weights within fixed zone shares. State fiscal weights differ for revenue, spending and debt. Growth is GDP-weighted; inflation and unemployment use population weights as illustrative proxies.",
    };
  }
  const api = { baseline, resources, fiscalPlan, stateAccounts };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.EconomyEngine = api;
})(globalThis);
