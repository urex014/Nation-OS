"use client";
import React, { useEffect, useState } from "react";
import { fiscalApi } from "../../lib/api/client.mjs";
import { formatCurrency, formatPercent } from "../../lib/api/types.mjs";
import { DistributionTable } from "./distribution-table.jsx";

export function RevenueWorkspace() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [formulaId, setFormulaId] = useState("statutory-v1");

  useEffect(() => {
    let ignore = false;
    fiscalApi
      .getRevenue({ fiscalYear: 2026, formulaId })
      .then((res) => {
        if (!ignore) {
          setData(res);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!ignore) {
          setError(err.message || "Failed to load revenue data.");
          setLoading(false);
        }
      });
    return () => {
      ignore = true;
    };
  }, [formulaId]);

  if (loading && !data) {
    return (
      <div className="rounded-lg border border-stone-200 bg-white p-12 text-center text-sm text-stone-500">
        Loading revenue intelligence and distribution matrix...
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="rounded-lg border border-rose-200 bg-rose-50 p-6 text-sm text-rose-800">
        <p className="font-semibold">Revenue calculation error</p>
        <p className="mt-1">{error}</p>
        <button
          onClick={() => setFormulaId((f) => (f === "statutory-v1" ? "statutory-v1" : f))}
          className="mt-3 rounded bg-rose-700 px-3 py-1.5 text-xs font-medium text-white hover:bg-rose-800"
        >
          Retry
        </button>
      </div>
    );
  }

  const {
    distributablePool,
    formula,
    sources = [],
    distributionTiers,
    stateAllocations = [],
  } = data;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
        <div>
          <h2 className="text-base font-semibold text-stone-900">
            Revenue Allocation & Distribution Matrix
          </h2>
          <p className="text-xs text-stone-500">
            Federally collected revenues and vertical allocation formula across jurisdictional tiers
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <label htmlFor="formula-select" className="text-xs font-medium text-stone-600">
            Distribution Formula:
          </label>
          <select
            id="formula-select"
            value={formulaId}
            onChange={(e) => setFormulaId(e.target.value)}
            className="rounded border border-stone-300 bg-stone-50 px-3 py-1.5 text-xs font-medium text-stone-800"
          >
            <option value="statutory-v1">Statutory Formula (Statutory Rule)</option>
            <option value="scenario-needs-v1">Needs-Weighted Scenario (Hypothetical)</option>
          </select>
        </div>
      </div>

      <div
        className={`rounded-lg border p-4 text-xs ${
          formula.isStatutory
            ? "border-emerald-200 bg-emerald-50/70 text-emerald-950"
            : "border-amber-200 bg-amber-50/70 text-amber-950"
        }`}
      >
        <div className="flex justify-between items-start">
          <div>
            <span className="font-bold tracking-wide uppercase text-[11px] block">
              {formula.isStatutory
                ? "Mandated Statutory Allocation"
                : "Hypothetical Scenario Simulation"}
            </span>
            <p className="mt-0.5">
              {formula.name} • Legal anchor: {formula.legalBasis}
            </p>
          </div>
          <span className="rounded px-2 py-0.5 text-[10px] font-mono border font-semibold">
            {formula.isStatutory ? "LEGAL MANDATE" : "HYPOTHETICAL ONLY"}
          </span>
        </div>
        <p className="mt-2 text-[11px] opacity-90">
          Note: Revenue distribution formulas are established by legal statutes. The platform
          simulates alternative scenarios for policy review only and cannot alter statutory revenue
          entitlements.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border border-stone-200 bg-white p-4 shadow-sm">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-stone-500">
            Distributable Federation Pool
          </span>
          <div className="mt-2 text-2xl font-bold tracking-tight text-stone-900 font-mono">
            {formatCurrency(distributablePool)}
          </div>
          <p className="mt-1 text-xs text-stone-500">85% of Gross Federation Receipts</p>
        </div>

        <div className="rounded-lg border border-stone-200 bg-white p-4 shadow-sm">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-stone-500">
            Federal Tier Share ({formatPercent(formula.tiers.federal * 100)})
          </span>
          <div className="mt-2 text-2xl font-bold tracking-tight text-stone-900 font-mono">
            {formatCurrency(distributionTiers.federal)}
          </div>
          <p className="mt-1 text-xs text-stone-500">Consolidated Revenue Fund</p>
        </div>

        <div className="rounded-lg border border-stone-200 bg-white p-4 shadow-sm">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-stone-500">
            State Tiers Share ({formatPercent(formula.tiers.states * 100)})
          </span>
          <div className="mt-2 text-2xl font-bold tracking-tight text-stone-900 font-mono">
            {formatCurrency(distributionTiers.states)}
          </div>
          <p className="mt-1 text-xs text-stone-500">Apportioned across 37 jurisdictions</p>
        </div>

        <div className="rounded-lg border border-stone-200 bg-white p-4 shadow-sm">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-stone-500">
            Local Government Share ({formatPercent(formula.tiers.local * 100)})
          </span>
          <div className="mt-2 text-2xl font-bold tracking-tight text-stone-900 font-mono">
            {formatCurrency(distributionTiers.local)}
          </div>
          <p className="mt-1 text-xs text-stone-500">Local council allocations</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="space-y-4 lg:col-span-6 rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
          <div className="border-b border-stone-100 pb-3">
            <h3 className="text-sm font-semibold text-stone-900">Federation Revenue Sources</h3>
            <p className="text-xs text-stone-500">Gross collections by fiscal revenue authority</p>
          </div>
          <div className="space-y-3">
            {sources.map((src) => (
              <div
                key={src.id}
                className="flex items-center justify-between border-b border-stone-50 pb-2 text-xs"
              >
                <div>
                  <span className="font-medium text-stone-800 block">{src.name}</span>
                  <span className="text-[10px] text-stone-400">
                    {src.statutoryPool
                      ? "Distributable Federation Account"
                      : "Direct Retained Receipt"}
                  </span>
                </div>
                <span className="font-mono font-bold text-stone-900">
                  {formatCurrency(src.amount)}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4 lg:col-span-6 rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
          <div className="border-b border-stone-100 pb-3">
            <h3 className="text-sm font-semibold text-stone-900">
              Horizontal Sharing Formula Factors
            </h3>
            <p className="text-xs text-stone-500">
              Statutory weights applied across subnational beneficiaries
            </p>
          </div>
          <div className="space-y-2.5 text-xs">
            <div className="flex justify-between items-center p-2 rounded bg-stone-50">
              <span className="text-stone-700">Equality of States (Basic Share)</span>
              <span className="font-mono font-bold text-stone-900">
                {formatPercent(formula.weights.equality * 100)}
              </span>
            </div>
            <div className="flex justify-between items-center p-2 rounded bg-stone-50">
              <span className="text-stone-700">Population Distribution</span>
              <span className="font-mono font-bold text-stone-900">
                {formatPercent(formula.weights.population * 100)}
              </span>
            </div>
            <div className="flex justify-between items-center p-2 rounded bg-stone-50">
              <span className="text-stone-700">Internal Revenue Generation Effort</span>
              <span className="font-mono font-bold text-stone-900">
                {formatPercent(formula.weights.internalRevenueEffort * 100)}
              </span>
            </div>
            <div className="flex justify-between items-center p-2 rounded bg-stone-50">
              <span className="text-stone-700">Landmass & Terrain Factors</span>
              <span className="font-mono font-bold text-stone-900">
                {formatPercent(formula.weights.landmass * 100)}
              </span>
            </div>
            <div className="flex justify-between items-center p-2 rounded bg-stone-50">
              <span className="text-stone-700">Social Development Indices</span>
              <span className="font-mono font-bold text-stone-900">
                {formatPercent(formula.weights.socialDevelopment * 100)}
              </span>
            </div>
          </div>
        </div>
      </div>

      <DistributionTable stateAllocations={stateAllocations} />
    </div>
  );
}
