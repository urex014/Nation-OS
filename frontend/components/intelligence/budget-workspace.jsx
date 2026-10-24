"use client";
import { useState } from "react";
import { Card, Button, Field, Notice } from "../nigeria/ui";

export function BudgetWorkspace() {
  const [budget, setBudget] = useState("100000000000"); // ₦100bn
  const [completeExisting, setCompleteExisting] = useState(40);
  const [essentialServices, setEssentialServices] = useState(30);
  const [geographicEquity, setGeographicEquity] = useState(15);
  const [economicGrowth, setEconomicGrowth] = useState(15);
  const [targetLga, setTargetLga] = useState("");
  const [targetSector, setTargetSector] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  async function handleCalculate() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/decisions/allocate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          proposedBudget: budget,
          completeExisting: Number(completeExisting),
          essentialServices: Number(essentialServices),
          geographicEquity: Number(geographicEquity),
          economicGrowth: Number(economicGrowth),
          lga: targetLga || undefined,
          sector: targetSector || undefined,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to calculate budget allocation.");
      }

      const data = await res.json();
      setResult(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <Card title="Budget Allocation Scenario Parameters">
        <p className="mb-4 text-xs text-stone-500">
          Configure a proposed capital envelope and strategic policy weights. The engine mathematically constrains total recommendations within the available envelope while prioritizing verifiable incomplete projects.
        </p>

        {error && <Notice error>{error}</Notice>}

        {/* Budget Input & Presets */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="sm:col-span-2">
            <Field label="Proposed Budget Allocation (₦ Naira)">
              <input
                type="text"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                placeholder="100000000000"
                className="w-full rounded-md border border-stone-300 p-2 text-sm font-mono"
              />
            </Field>
            <div className="mt-2 flex gap-2">
              <button
                type="button"
                onClick={() => setBudget("50000000000")}
                className="rounded border border-stone-200 px-2 py-1 text-xs hover:bg-stone-50"
              >
                ₦50bn
              </button>
              <button
                type="button"
                onClick={() => setBudget("100000000000")}
                className="rounded border border-stone-200 px-2 py-1 text-xs hover:bg-stone-50"
              >
                ₦100bn
              </button>
              <button
                type="button"
                onClick={() => setBudget("250000000000")}
                className="rounded border border-stone-200 px-2 py-1 text-xs hover:bg-stone-50"
              >
                ₦250bn
              </button>
            </div>
          </div>

          <Field label="Target Geographic Focus (Optional)">
            <select
              value={targetLga}
              onChange={(e) => setTargetLga(e.target.value)}
              className="w-full rounded-md border border-stone-300 p-2 text-sm bg-white"
            >
              <option value="">All 20 LGAs</option>
              <option value="Ikeja">Ikeja</option>
              <option value="Eti-Osa">Eti-Osa</option>
              <option value="Lagos Island">Lagos Island</option>
              <option value="Alimosho">Alimosho</option>
              <option value="Kosofe">Kosofe</option>
            </select>
          </Field>

          <Field label="Target Sector Focus (Optional)">
            <select
              value={targetSector}
              onChange={(e) => setTargetSector(e.target.value)}
              className="w-full rounded-md border border-stone-300 p-2 text-sm bg-white"
            >
              <option value="">All Sectors</option>
              <option value="Infrastructure & Works">Infrastructure & Works</option>
              <option value="Healthcare">Healthcare</option>
              <option value="Education">Education</option>
              <option value="Transportation">Transportation</option>
            </select>
          </Field>
        </div>

        {/* Priority Weight Sliders */}
        <div className="mt-6 border-t border-stone-200 pt-5">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-stone-500 mb-3">
            Policy Weights (% Relative Priority)
          </h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span>Complete Existing Projects</span>
                <span className="font-semibold">{completeExisting}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={completeExisting}
                onChange={(e) => setCompleteExisting(e.target.value)}
                className="w-full"
              />
            </div>
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span>Essential Services (Health/Edu)</span>
                <span className="font-semibold">{essentialServices}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={essentialServices}
                onChange={(e) => setEssentialServices(e.target.value)}
                className="w-full"
              />
            </div>
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span>Geographic Equity (Outer LGAs)</span>
                <span className="font-semibold">{geographicEquity}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={geographicEquity}
                onChange={(e) => setGeographicEquity(e.target.value)}
                className="w-full"
              />
            </div>
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span>Economic Growth & Works</span>
                <span className="font-semibold">{economicGrowth}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={economicGrowth}
                onChange={(e) => setEconomicGrowth(e.target.value)}
                className="w-full"
              />
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <Button onClick={handleCalculate} disabled={loading}>
            {loading ? "Calculating Constrained Allocation..." : "Calculate Constrained Allocation"}
          </Button>
        </div>
      </Card>

      {/* Allocation Results */}
      {result && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Card>
              <p className="text-xs text-stone-500">Proposed Envelope</p>
              <p className="mt-1 text-2xl font-semibold text-stone-900">{result.proposedBudgetFormatted}</p>
              <p className="mt-1 text-xs text-stone-500">Available Cap</p>
            </Card>
            <Card>
              <p className="text-xs text-stone-500">Total Allocated</p>
              <p className="mt-1 text-2xl font-semibold text-emerald-800">{result.results.totalAllocatedFormatted}</p>
              <p className="mt-1 text-xs text-stone-500">{result.results.existingProjectsCount} incomplete projects funded</p>
            </Card>
            <Card>
              <p className="text-xs text-stone-500">Unallocated Reserve</p>
              <p className="mt-1 text-2xl font-semibold text-stone-700">{result.results.unallocatedFormatted}</p>
              <p className="mt-1 text-xs text-stone-500">Preserved contingency</p>
            </Card>
          </div>

          {/* Recommended Projects Breakdown */}
          <Card title="Recommended Evidence-Based Project Allocations">
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-xs">
                <thead className="border-b border-stone-200 bg-stone-50 text-stone-600">
                  <tr>
                    <th className="p-3">Project & LGA</th>
                    <th className="p-3">Sector</th>
                    <th className="p-3">Progress</th>
                    <th className="p-3">Recommended Allocation</th>
                    <th className="p-3">Remaining Need</th>
                    <th className="p-3">Justification</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {result.results.recommendedProjects.slice(0, 10).map((p, idx) => (
                    <tr key={idx} className="hover:bg-stone-50">
                      <td className="p-3 max-w-xs">
                        <strong className="block text-stone-900 truncate">{p.name}</strong>
                        <span className="text-stone-500">{p.lga} LGA</span>
                      </td>
                      <td className="p-3">{p.sector}</td>
                      <td className="p-3">{p.progressPercent}%</td>
                      <td className="p-3 font-semibold text-emerald-800">{p.allocatedFormatted}</td>
                      <td className="p-3 text-stone-600">{p.remainingCostFormatted}</td>
                      <td className="p-3 text-stone-500 max-w-sm">{p.rationale}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Sector & LGA Breakdown */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <Card title="Allocation by Sector">
              <div className="space-y-3">
                {Object.entries(result.results.sectorBreakdown).map(([sector, data]) => (
                  <div key={sector}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-medium text-stone-800">{sector}</span>
                      <span className="text-stone-600">{data.amountFormatted} ({data.percent}%)</span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-stone-100">
                      <div className="h-1.5 rounded-full bg-emerald-700" style={{ width: `${Math.min(data.percent, 100)}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card title="Allocation by Local Government Area (LGA)">
              <div className="space-y-3">
                {Object.entries(result.results.lgaBreakdown).slice(0, 8).map(([lgaName, data]) => (
                  <div key={lgaName}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-medium text-stone-800">{lgaName}</span>
                      <span className="text-stone-600">{data.amountFormatted} ({data.percent}%)</span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-stone-100">
                      <div className="h-1.5 rounded-full bg-stone-700" style={{ width: `${Math.min(data.percent, 100)}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
