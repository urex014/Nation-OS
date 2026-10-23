"use client";
import React, { useEffect, useState } from "react";
import { fiscalApi } from "../../lib/api/client.mjs";
import { formatCurrency, SECTOR_KEYS } from "../../lib/api/types.mjs";

export function ScenarioLab() {
  const [budget, setBudget] = useState(1000);
  const [horizon, setHorizon] = useState(5);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedShock, setSelectedShock] = useState("none");

  useEffect(() => {
    let ignore = false;
    fiscalApi
      .simulateScenarios({ budget, horizon })
      .then((res) => {
        if (!ignore) {
          setData(res);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!ignore) {
          console.error("Scenario load failed:", err);
          setLoading(false);
        }
      });
    return () => {
      ignore = true;
    };
  }, [budget, horizon]);

  const shockMultipliers = {
    none: { label: "Baseline Projections", factor: 1.0, costAdj: 0 },
    revenueDrop: { label: "Revenue Contraction (-15%)", factor: 0.85, costAdj: 0 },
    inflation: { label: "High Inflation Shock (+4pp)", factor: 1.0, costAdj: 120 },
    lowDelivery: { label: "Procurement Slippage (-20% delivery)", factor: 0.8, costAdj: -50 },
  };

  const currentShock = shockMultipliers[selectedShock];

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
        <div>
          <h2 className="text-base font-semibold text-stone-900">
            Scenario Simulation & Stress Lab
          </h2>
          <p className="text-xs text-stone-500">
            Compare alternative multi-year allocation models against macroeconomic stress scenarios
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-xs">
          <div>
            <label className="text-stone-500 mr-2">Budget Envelope:</label>
            <input
              type="number"
              value={budget}
              onChange={(e) => setBudget(Number(e.target.value))}
              className="w-24 rounded border border-stone-300 px-2 py-1 font-mono font-bold text-stone-900"
            />
          </div>

          <div>
            <label className="text-stone-500 mr-2">Horizon:</label>
            <select
              value={horizon}
              onChange={(e) => setHorizon(Number(e.target.value))}
              className="rounded border border-stone-300 bg-stone-50 px-2 py-1 font-semibold text-stone-800"
            >
              <option value={5}>5-Year Horizon</option>
              <option value={10}>10-Year Horizon</option>
            </select>
          </div>

          <div>
            <label className="text-stone-500 mr-2">Macro Stress Case:</label>
            <select
              value={selectedShock}
              onChange={(e) => setSelectedShock(e.target.value)}
              className="rounded border border-amber-300 bg-amber-50 px-2.5 py-1 font-semibold text-amber-950"
            >
              <option value="none">Baseline Scenario (Nominal)</option>
              <option value="revenueDrop">Revenue Contraction (-15%)</option>
              <option value="inflation">High Inflation Shock (+4pp)</option>
              <option value="lowDelivery">Procurement Slippage (-20%)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Analytical Callout */}
      <div className="rounded-lg border border-stone-200 bg-stone-50 p-4 text-xs text-stone-600">
        <span className="font-semibold text-stone-800 block mb-1">
          Deterministic Scenario Principles:
        </span>
        Simulated projections are calculated using versioned mathematical models. Projected funding
        does not guarantee automatic economic growth; models illustrate relative trade-offs under
        specified assumptions.
      </div>

      {/* Scenarios Comparison Grid */}
      {loading || !data ? (
        <div className="rounded-lg border border-stone-200 bg-white p-12 text-center text-sm text-stone-500">
          Calculating deterministic scenario trajectories...
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[data.baseline, ...data.alternatives].map((sc) => {
              const adjustedAnnual = Math.round(
                (sc.annualCost + currentShock.costAdj) * currentShock.factor,
              );
              return (
                <div
                  key={sc.id}
                  className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm space-y-4 flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex justify-between items-start">
                      <span className="rounded bg-stone-100 px-2 py-0.5 text-[10px] font-mono text-stone-600 uppercase border border-stone-200">
                        {sc.id}
                      </span>
                      <span className="text-[11px] font-mono font-bold text-stone-900">
                        {horizon} YRS
                      </span>
                    </div>

                    <h3 className="text-sm font-semibold text-stone-900">{sc.label}</h3>
                    <p className="text-xs text-stone-500 leading-snug">{sc.description}</p>

                    <div className="pt-2 border-t border-stone-100 space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-stone-500">Adjusted Annual Outlay:</span>
                        <span className="font-mono font-bold text-stone-900">
                          {formatCurrency(adjustedAnnual)}
                        </span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-stone-500">Cumulative Commitment:</span>
                        <span className="font-mono font-bold text-stone-900">
                          {formatCurrency(adjustedAnnual * horizon)}
                        </span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-stone-100 space-y-1.5">
                      <span className="text-[11px] font-semibold text-stone-700 uppercase tracking-wider block">
                        Sector Allocations
                      </span>
                      {SECTOR_KEYS.map((k) => (
                        <div key={k} className="flex justify-between text-[11px]">
                          <span className="capitalize text-stone-600">{k}</span>
                          <span className="font-mono text-stone-900">
                            {formatCurrency(sc.budgets[k] || 0)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-stone-100">
                    <span className="text-[10px] font-semibold uppercase text-stone-400 block mb-1">
                      Primary Trade-off
                    </span>
                    <p className="text-[11px] text-stone-600 italic">
                      {sc.risks?.[0] ||
                        "Balanced resource dispersion across subnational beneficiaries."}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm space-y-4">
            <div className="border-b border-stone-100 pb-3">
              <h3 className="text-sm font-semibold text-stone-900">
                Stress Case Trajectory Summary
              </h3>
              <p className="text-xs text-stone-500">
                Sensitivity comparison across alternative macroeconomic shocks
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-stone-200 text-stone-500 font-semibold uppercase tracking-wider text-[10px]">
                    <th className="py-2.5 px-3">Scenario</th>
                    <th className="py-2.5 px-3">Annual Outlay</th>
                    <th className="py-2.5 px-3">Maintenance (20%)</th>
                    <th className="py-2.5 px-3">Shock Sensitivity</th>
                    <th className="py-2.5 px-3">Fiscal Feasibility</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 font-mono">
                  {[data.baseline, ...data.alternatives].map((sc) => (
                    <tr key={sc.id} className="hover:bg-stone-50/60">
                      <td className="py-2 px-3 font-sans font-medium text-stone-900">{sc.label}</td>
                      <td className="py-2 px-3 font-bold text-stone-900">
                        {formatCurrency(sc.annualCost)}
                      </td>
                      <td className="py-2 px-3 text-stone-600">
                        {formatCurrency(sc.annualCost * 0.2)}
                      </td>
                      <td className="py-2 px-3 text-stone-600 font-sans">
                        {selectedShock === "none" ? "Nominal baseline" : currentShock.label}
                      </td>
                      <td className="py-2 px-3">
                        <span className="rounded bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 text-[10px] font-sans font-semibold">
                          Reconciled
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
