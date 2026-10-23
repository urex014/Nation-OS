"use client";
import React, { useEffect, useState } from "react";
import { fiscalApi } from "../../lib/api/client.mjs";
import { mockFiscalAdapter } from "../../lib/api/fiscal-adapter.mjs";
import { CountryMap } from "../country/country-map.jsx";
import { KpiCards } from "./kpi-cards.jsx";
import { NationalIndicators } from "./national-indicators.jsx";
import { NationalPriorities } from "./national-priorities.jsx";
import { ProjectSnapshot } from "./project-snapshot.jsx";

export function FiscalOverview() {
  const [data, setData] = useState(() =>
    mockFiscalAdapter.getOverviewSync({ fiscalYear: 2026, jurisdictionId: "all" }),
  );
  const [selectedState, setSelectedState] = useState("all");
  const [showMap, setShowMap] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let ignore = false;
    fiscalApi
      .getOverview({ fiscalYear: 2026, jurisdictionId: selectedState })
      .then((res) => {
        if (!ignore) {
          setData(res);
        }
      })
      .catch((err) => {
        if (!ignore) {
          setError(err.message || "Failed to load fiscal overview.");
        }
      });
    return () => {
      ignore = true;
    };
  }, [selectedState]);

  if (!data) {
    return (
      <div className="rounded-xl border border-stone-200 bg-white p-12 text-center text-sm text-stone-500">
        Loading national fiscal intelligence...
      </div>
    );
  }

  const { states = [] } = data;
  const activeStateData = states.find((s) => s.id === selectedState);

  return (
    <div className="space-y-6">
      {/* Page Title & Main Actions */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-stone-900">
            National Overview
          </h1>
          <p className="mt-1 text-xs md:text-sm text-stone-500">
            A consolidated view of Nigeria&apos;s fiscal position, national indicators, and public
            investment.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <a
            href="/budget"
            className="rounded-lg border border-stone-300 bg-white px-4 py-2 text-xs font-semibold text-stone-800 shadow-sm transition-colors hover:bg-stone-50"
          >
            Manage National Budget
          </a>
          <a
            href="/budget"
            className="flex items-center space-x-1.5 rounded-lg bg-[#0B3B2C] px-4 py-2 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-[#082F22]"
          >
            <span>+</span>
            <span>Create New Project</span>
          </a>
        </div>
      </div>

      {/* Illustrative Notice Banner */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-amber-200 bg-[#FFFBEB] px-4 py-3 text-xs text-amber-900 shadow-sm">
        <div className="flex items-center space-x-2.5">
          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-200/80 text-amber-900 font-bold text-[11px]">
            i
          </span>
          <div>
            <span className="font-semibold mr-1.5">Illustrative Demo Data</span>
            <span className="text-amber-800/80">
              | 2026 planning scenario; not an official appropriation. National Fiscal Intelligence
              Dashboard.
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <label htmlFor="jurisdiction-select" className="text-stone-600 font-medium text-[11px]">
            Jurisdiction:
          </label>
          <select
            id="jurisdiction-select"
            value={selectedState}
            onChange={(e) => setSelectedState(e.target.value)}
            className="rounded border border-amber-300 bg-white px-2.5 py-1 text-xs font-medium text-stone-800 focus:outline-none"
          >
            <option value="all">Consolidated Federation</option>
            {states.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.id})
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-xs text-rose-800 flex justify-between items-center">
          <span>{error}</span>
          <button
            onClick={() => setSelectedState((s) => s)}
            className="rounded bg-rose-700 px-2.5 py-1 text-[11px] font-medium text-white hover:bg-rose-800"
          >
            Retry
          </button>
        </div>
      )}

      {/* 6 Top KPI Metrics Cards */}
      <KpiCards />

      {/* Main Analytical Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 items-stretch">
        {/* Left Column: Macro Indicators & Revenue Trajectory */}
        <div className="lg:col-span-7">
          <NationalIndicators />
        </div>

        {/* Right Column: National Priorities */}
        <div className="lg:col-span-5">
          <NationalPriorities />
        </div>
      </div>

      {/* Geographic Jurisdiction Map & Distribution */}
      <div className="rounded-xl border border-stone-200/90 bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)] space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-100 pb-3">
          <div>
            <h3 className="text-sm font-semibold text-stone-900">
              Geographic Allocation & State Overview
            </h3>
            <p className="text-xs text-stone-500">
              Interactive 37-jurisdiction map with statutory revenue distribution
            </p>
          </div>
          <button
            onClick={() => setShowMap(!showMap)}
            className="text-xs font-medium text-emerald-700 hover:text-emerald-900"
          >
            {showMap ? "Collapse map" : "Expand map"}
          </button>
        </div>

        {showMap && (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-12 items-center">
            <div className="md:col-span-8 flex justify-center">
              <CountryMap selectedState={selectedState} onSelectState={setSelectedState} />
            </div>
            <div className="md:col-span-4 space-y-3 rounded-lg border border-stone-100 bg-[#FAFCFB] p-4 text-xs">
              <div className="font-semibold text-stone-900">
                {activeStateData ? activeStateData.name : "Federation Total"}
              </div>
              <p className="text-[11px] text-stone-500">
                {activeStateData
                  ? `Federation jurisdiction located in zone ${activeStateData.zone}.`
                  : "Consolidated national framework across all 36 states and the Federal Capital Territory."}
              </p>
              <div className="pt-2 border-t border-stone-200 space-y-1.5 font-mono text-[11px]">
                <div className="flex justify-between">
                  <span className="text-stone-500">Population:</span>
                  <span className="font-semibold text-stone-800">
                    {activeStateData ? activeStateData.population.toLocaleString() : "220,000,000"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">Disbursed allocation:</span>
                  <span className="font-semibold text-emerald-700">
                    {activeStateData ? `₦${activeStateData.spending}M` : "₦3.28tn"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Section: Project Execution Snapshot */}
      <ProjectSnapshot />
    </div>
  );
}
