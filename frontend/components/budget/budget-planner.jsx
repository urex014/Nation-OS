"use client";
import React, { useState } from "react";
import { fiscalApi } from "../../lib/api/client.mjs";
import {
  formatCurrency,
  formatPercent,
  SECTOR_KEYS,
  ALLOCATION_STRATEGIES,
} from "../../lib/api/types.mjs";
import { InvestigationPanel } from "./investigation-panel.jsx";

const sectorLabels = {
  education: "Education & Literacy",
  health: "Healthcare & Primary Clinics",
  transport: "Infrastructure & Transport",
  food: "Agriculture & Food Security",
  energy: "Energy & Rural Grid",
  water: "Water & Sanitation",
};

export function BudgetPlanner() {
  const [totalBudget, setTotalBudget] = useState(1000);
  const [horizon, setHorizon] = useState(5);
  const [strategy, setStrategy] = useState("balanced");
  const [analystQuestion, setAnalystQuestion] = useState(
    "How should we distribute ₦100 billion to improve healthcare, education and infrastructure while prioritizing underserved states?",
  );

  const [budgets, setBudgets] = useState({
    education: 180,
    health: 180,
    transport: 180,
    food: 160,
    energy: 150,
    water: 150,
  });

  const [lockedSectors, setLockedSectors] = useState({});
  const [aiReport, setAiReport] = useState(null);
  const [isInvestigating, setIsInvestigating] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const allocatedTotal = Object.values(budgets).reduce((a, b) => a + Number(b || 0), 0);
  const variance = totalBudget - allocatedTotal;
  const isBudgetValid = Math.abs(variance) < 1;

  async function handleRunInvestigation() {
    setIsInvestigating(true);
    setSaveSuccess(false);
    try {
      const rec = await fiscalApi.recommendBudget({
        question: analystQuestion,
        budget: totalBudget,
        horizon,
        strategy,
      });
      setAiReport(rec);
      setBudgets(rec.budgets);
    } catch (err) {
      alert(`Investigation failed: ${err.message}`);
    } finally {
      setIsInvestigating(false);
    }
  }

  function handleBudgetChange(sector, value) {
    if (lockedSectors[sector]) return;
    setBudgets((prev) => ({ ...prev, [sector]: Math.max(0, Number(value) || 0) }));
  }

  function toggleLock(sector) {
    setLockedSectors((prev) => ({ ...prev, [sector]: !prev[sector] }));
  }

  async function handleSaveDraft() {
    if (!isBudgetValid) return;
    await fiscalApi.saveDecision({
      title: analystQuestion || "Strategic Budget Proposal 2026",
      budgetAmount: totalBudget,
      horizonYears: horizon,
      strategy,
      allocations: budgets,
      assumptions: aiReport?.assumptions || ["Baseline economic indicators maintained"],
      risks: aiReport?.risks || [],
      tradeoffs: aiReport?.tradeoffs || [],
      status: "Draft",
    });
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 4000);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
        <div>
          <h2 className="text-base font-semibold text-stone-900">
            AI-Assisted Budget Planning Workspace
          </h2>
          <p className="text-xs text-stone-500">
            Formulate multi-year capital commitments and evaluate evidence-backed trade-offs
          </p>
        </div>
        <div className="flex items-center space-x-3 text-xs">
          <span className="font-medium text-stone-500">Planning Horizon:</span>
          <select
            value={horizon}
            onChange={(e) => setHorizon(Number(e.target.value))}
            className="rounded border border-stone-300 bg-stone-50 px-2.5 py-1 font-semibold text-stone-800"
          >
            <option value={5}>5-Year Framework</option>
            <option value={10}>10-Year Framework</option>
          </select>
        </div>
      </div>

      <div className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-stone-100 pb-3">
          <div>
            <span className="text-[11px] font-bold tracking-wider uppercase text-emerald-800">
              Analyst Policy Directive
            </span>
            <p className="text-xs text-stone-500">
              Specify policy aims, targeted vulnerable regions, and budgetary constraints
            </p>
          </div>
          <span className="text-[10px] rounded bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 font-mono">
            Structured Model Handoff
          </span>
        </div>

        <textarea
          value={analystQuestion}
          onChange={(e) => setAnalystQuestion(e.target.value)}
          rows={2}
          className="w-full rounded-md border border-stone-300 p-3 text-sm text-stone-900 focus:outline-none focus:ring-1 focus:ring-stone-400"
          placeholder="Describe policy goals, targeted sectors and regional priorities..."
        />

        <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center space-x-4">
            <div>
              <span className="text-stone-500 font-medium mr-2">Target Envelope:</span>
              <input
                type="number"
                value={totalBudget}
                onChange={(e) => setTotalBudget(Number(e.target.value))}
                className="w-24 rounded border border-stone-300 px-2 py-1 font-mono font-bold text-stone-900"
              />
              <span className="text-stone-400 ml-1 font-mono">A₦M</span>
            </div>

            <div>
              <span className="text-stone-500 font-medium mr-2">Strategy:</span>
              <select
                value={strategy}
                onChange={(e) => setStrategy(e.target.value)}
                className="rounded border border-stone-300 bg-stone-50 px-2 py-1 font-medium text-stone-800"
              >
                {ALLOCATION_STRATEGIES.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <button
            onClick={handleRunInvestigation}
            disabled={isInvestigating}
            className="rounded-md bg-stone-900 px-4 py-2 font-medium text-white shadow-sm hover:bg-stone-800 disabled:opacity-50 transition flex items-center space-x-2"
          >
            {isInvestigating && (
              <span className="w-3 h-3 rounded-full border-2 border-white border-t-transparent animate-spin" />
            )}
            <span>{isInvestigating ? "Executing Investigation..." : "Run AI Investigation"}</span>
          </button>
        </div>
      </div>

      <InvestigationPanel report={aiReport} />

      <div className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-100 pb-3">
          <div>
            <h3 className="text-sm font-semibold text-stone-900">
              Interactive Sector Allocation Controls
            </h3>
            <p className="text-xs text-stone-500">
              Adjust sector ceilings, lock prioritized envelopes, and balance total commitments
            </p>
          </div>
          <div
            className={`rounded px-3 py-1 text-xs font-mono font-semibold border ${
              isBudgetValid
                ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                : "bg-rose-50 text-rose-800 border-rose-200"
            }`}
          >
            {isBudgetValid
              ? "Budget Reconciled: 100%"
              : `Variance: ${variance > 0 ? `Unallocated +${formatCurrency(variance)}` : `Overrun ${formatCurrency(variance)}`}`}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {SECTOR_KEYS.map((key) => {
            const isLocked = lockedSectors[key];
            const amount = budgets[key] || 0;
            const share = totalBudget ? (amount / totalBudget) * 100 : 0;
            return (
              <div
                key={key}
                className={`rounded-lg border p-4 transition ${isLocked ? "bg-stone-50/80 border-stone-300" : "bg-white border-stone-200"}`}
              >
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className="font-semibold text-stone-900">{sectorLabels[key]}</span>
                  <button
                    onClick={() => toggleLock(key)}
                    className={`rounded px-2 py-0.5 text-[10px] font-medium border ${
                      isLocked
                        ? "bg-stone-800 text-white border-stone-800"
                        : "bg-white text-stone-600 border-stone-300"
                    }`}
                  >
                    {isLocked ? "Locked" : "Lock Sector"}
                  </button>
                </div>
                <div className="flex items-center space-x-3">
                  <input
                    type="range"
                    min={0}
                    max={totalBudget}
                    step={10}
                    disabled={isLocked}
                    value={amount}
                    onChange={(e) => handleBudgetChange(key, e.target.value)}
                    className="flex-1 h-2 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-stone-900 disabled:opacity-40"
                  />
                  <div className="w-24 text-right">
                    <span className="font-mono font-bold text-stone-900 text-sm">
                      {formatCurrency(amount)}
                    </span>
                    <span className="text-[10px] text-stone-400 block">{formatPercent(share)}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-stone-100 pt-4">
          <div className="text-xs text-stone-500">
            {isBudgetValid ? (
              <span className="text-emerald-700 font-medium">
                Valid statutory proposal. Ready for decision archival.
              </span>
            ) : (
              <span className="text-rose-600 font-medium">
                Invalid allocation total. Adjust sector amounts to match target.
              </span>
            )}
          </div>
          <div className="flex items-center space-x-3">
            {saveSuccess && (
              <span className="text-xs font-semibold text-emerald-700">
                Proposal saved to Decision Records.
              </span>
            )}
            <button
              onClick={handleSaveDraft}
              disabled={!isBudgetValid}
              className="rounded-md bg-emerald-800 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-40 transition"
            >
              Save Decision Proposal
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
