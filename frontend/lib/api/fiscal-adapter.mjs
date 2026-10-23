/**
 * NationOS Fiscal Mock Adapter
 * Bridges verified local numerical models to standardized API contracts.
 */

import countryData from "../country-data.mjs";
import economyEngine from "../domain/economy-engine.cjs";
import planningEngine from "../domain/planning-engine.cjs";
import { reviewProposal } from "../proposal-review.mjs";
import {
  STATUTORY_FORMULA,
  HYPOTHETICAL_FORMULA,
  SECTOR_KEYS,
  ALLOCATION_STRATEGIES,
} from "./types.mjs";
import {
  MOCK_REVENUE_SOURCES,
  MOCK_INVESTIGATION_STAGES,
  MOCK_TRADEOFFS,
  MOCK_ASSUMPTIONS,
} from "./mock-data.mjs";

const { states, sectors } = countryData;
const baseline = economyEngine.baseline;
const accounts = economyEngine.stateAccounts(states);

function getPlanningStates() {
  return states.map((s, i) => ({
    id: s.id,
    name: s.name,
    population: s.citizenCount,
    baselines: {
      food: s.food,
      ...Object.fromEntries(Object.entries(sectors).map(([k, d]) => [k, d.baseline[i]])),
    },
  }));
}

export const mockFiscalAdapter = {
  getOverviewSync({ fiscalYear = 2026, jurisdictionId = "all" } = {}) {
    const isNational = jurisdictionId === "all";
    const selectedState = !isNational
      ? accounts.states.find((s) => s.id === jurisdictionId) || accounts.states[0]
      : null;

    const totalRevenue = isNational ? baseline.revenue : selectedState.revenue;
    const totalSpending = isNational ? baseline.spending : selectedState.spending;
    const deficit = totalSpending - totalRevenue;
    const debt = isNational ? baseline.debt : selectedState.debt;
    const gdp = isNational ? baseline.gdp : selectedState.gdp;

    const sectorAllocations = SECTOR_KEYS.map((key) => {
      const sec = sectors[key] || { name: key, baseline: [100] };
      const avg = sec.baseline.reduce((a, b) => a + b, 0) / sec.baseline.length;
      return {
        key,
        name: planningEngine.definitions[key]?.name || key,
        amount: Math.round(totalSpending * 0.12 + avg * 120),
        share: 16.6,
      };
    });

    return {
      synthetic: true,
      fiscalYear: Number(fiscalYear),
      jurisdiction: isNational
        ? { id: "all", name: "Republic of Aderin (Consolidated)", type: "National" }
        : { id: selectedState.id, name: selectedState.name, type: selectedState.type },
      currency: "A₦",
      unit: "million",
      metrics: {
        totalRevenue,
        totalSpending,
        deficit,
        deficitToGdp: (deficit / gdp) * 100,
        debt,
        debtToGdp: (debt / gdp) * 100,
        realGrowth: isNational ? baseline.realGrowth : selectedState.realGrowth,
        inflation: isNational ? baseline.inflation : selectedState.inflation,
        planningEnvelope: isNational ? baseline.planningEnvelope : selectedState.planningEnvelope,
      },
      distribution: {
        federal: accounts.federal.spending,
        state: accounts.states.reduce((acc, s) => acc + s.spending, 0),
        local: accounts.states.reduce((acc, s) => acc + s.spending * 0.25, 0),
      },
      taxBreakdown: [
        { source: "Tax revenue", amount: baseline.revenueSources[0][1], share: 66.7 },
        {
          source: "Resource royalties & public dividends",
          amount: baseline.revenueSources[1][1],
          share: 20.0,
        },
        { source: "Other non-tax revenue", amount: baseline.revenueSources[2][1], share: 13.3 },
      ],
      sectorAllocations,
      states: accounts.states.map((s) => ({
        id: s.id,
        name: s.name,
        population: s.population,
        zone: s.parentZone,
        revenue: s.revenue,
        spending: s.spending,
        deficit: s.deficit,
      })),
    };
  },

  async getOverview(params = {}) {
    return this.getOverviewSync(params);
  },

  async getRevenue({ fiscalYear = 2026, formulaId = "statutory-v1" } = {}) {
    const isStatutory = formulaId === "statutory-v1";
    const formula = isStatutory ? STATUTORY_FORMULA : HYPOTHETICAL_FORMULA;
    const distributablePool = baseline.revenue * 0.85;

    const distributionTiers = {
      federal: distributablePool * formula.tiers.federal,
      states: distributablePool * formula.tiers.state,
      local: distributablePool * formula.tiers.local,
    };

    const stateAllocations = accounts.states.map((s) => {
      const popShare = s.population / baseline.population;
      const equalShare = 1 / accounts.states.length;
      const derivedFactor =
        popShare * formula.weights.population + equalShare * formula.weights.equality + 0.01;
      const allocation = distributionTiers.states * derivedFactor;
      return {
        id: s.id,
        name: s.name,
        population: s.population,
        sharePercent: derivedFactor * 100,
        allocationAmount: allocation,
        perCapita: (allocation / s.population) * 1000000,
      };
    });

    return {
      synthetic: true,
      fiscalYear: Number(fiscalYear),
      distributablePool,
      formula,
      availableFormulas: [STATUTORY_FORMULA, HYPOTHETICAL_FORMULA],
      sources: MOCK_REVENUE_SOURCES,
      distributionTiers,
      stateAllocations,
    };
  },

  async recommendBudget({
    question = "",
    budget = 1000,
    horizon = 5,
    scope = "all",
    strategy = "balanced",
  } = {}) {
    const rawWeights = {
      balanced: {
        food: 0.16,
        education: 0.18,
        transport: 0.18,
        health: 0.18,
        energy: 0.15,
        water: 0.15,
      },
      needs: {
        food: 0.2,
        education: 0.22,
        transport: 0.14,
        health: 0.22,
        energy: 0.11,
        water: 0.11,
      },
      growth: {
        food: 0.1,
        education: 0.15,
        transport: 0.25,
        health: 0.15,
        energy: 0.25,
        water: 0.1,
      },
      custom: { food: 0.15, education: 0.2, transport: 0.2, health: 0.2, energy: 0.15, water: 0.1 },
    }[strategy] || {
      food: 0.16,
      education: 0.18,
      transport: 0.18,
      health: 0.18,
      energy: 0.15,
      water: 0.15,
    };

    const budgets = {};
    for (const key of SECTOR_KEYS) budgets[key] = Math.round(budget * (rawWeights[key] || 0.16));

    const config = {
      years: Number(horizon),
      scope,
      growth: 2,
      delivery: 80,
      maintenance: 20,
      budgets,
    };
    const projection = planningEngine.project(getPlanningStates(), config);
    const review = reviewProposal({
      question: question || "Strategic budget allocation",
      proposal: {
        title: question || "Strategic Multi-Sector Allocation",
        reason: `Automated investigation under ${strategy} strategy`,
        scope,
        years: Number(horizon),
        growth: 2,
        delivery: 80,
        maintenance: 20,
        budgets,
      },
    });

    return {
      synthetic: true,
      question,
      strategy,
      budgets,
      totalBudget: budget,
      annualCost: projection.annualCost,
      investigationStages: MOCK_INVESTIGATION_STAGES,
      tradeoffs: MOCK_TRADEOFFS,
      assumptions: MOCK_ASSUMPTIONS,
      risks: review.flags || ["Delivery bottleneck risk in low-capacity jurisdictions."],
      cases: review.cases,
      monitoring: review.monitoring,
    };
  },

  async calculateBudget(config) {
    const result = planningEngine.project(getPlanningStates(), config);
    const fiscal = economyEngine.fiscalPlan(result.annualCost, config.years);
    return { synthetic: true, ...result, fiscal };
  },

  async simulateScenarios({ budget = 1000, horizon = 5, scope = "all" } = {}) {
    const scenarios = [];
    for (const strat of ALLOCATION_STRATEGIES) {
      const rec = await this.recommendBudget({
        question: `Simulation: ${strat.label}`,
        budget,
        horizon,
        scope,
        strategy: strat.id,
      });
      scenarios.push({
        id: strat.id,
        label: strat.label,
        description: strat.description,
        budgets: rec.budgets,
        annualCost: rec.annualCost,
        cases: rec.cases,
        risks: rec.risks,
      });
    }
    return {
      synthetic: true,
      budget,
      horizon,
      baseline: scenarios[0],
      alternatives: scenarios.slice(1),
    };
  },
};
