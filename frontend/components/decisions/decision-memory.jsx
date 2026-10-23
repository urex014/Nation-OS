"use client";
import React, { useState } from "react";
import { useSavedRecords } from "../../hooks/use-saved-records";
import { downloadJson } from "../../lib/client/download.mjs";
import { formatCurrency, PROTOTYPE_STATUSES } from "../../lib/api/types.mjs";

export function DecisionMemory() {
  const [plans, writePlans] = useSavedRecords("nationos-plans");
  const [selectedPlanIndex, setSelectedPlanIndex] = useState(0);

  function toggleReview(index) {
    const updated = plans.map((plan, i) => {
      if (i === index) {
        const nextReviewed = !plan.reviewed;
        return {
          ...plan,
          reviewed: nextReviewed,
          status: nextReviewed ? "Reviewed" : "Draft",
          updated: new Date().toISOString(),
        };
      }
      return plan;
    });
    writePlans(updated);
  }

  function setPlanStatus(index, newStatus) {
    const updated = plans.map((plan, i) => {
      if (i === index) {
        return {
          ...plan,
          status: newStatus,
          reviewed: newStatus === "Reviewed",
          updated: new Date().toISOString(),
        };
      }
      return plan;
    });
    writePlans(updated);
  }

  const activePlan = plans[selectedPlanIndex] || plans[0];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
        <div>
          <h2 className="text-base font-semibold text-stone-900">
            Decision Memory & Context Preservation
          </h2>
          <p className="text-xs text-stone-500">
            Audit trail preserving model assumptions, sector breakdowns, trade-offs, and revision
            history
          </p>
        </div>
        <button
          onClick={() =>
            downloadJson("nationos-decisions-export.json", {
              exportedAt: new Date().toISOString(),
              plans,
            })
          }
          className="rounded-md border border-stone-300 bg-white px-3 py-1.5 text-xs font-semibold text-stone-700 hover:bg-stone-50 transition"
        >
          Export Decision Archive
        </button>
      </div>

      {/* Legal & Policy Safeguard Notice */}
      <div className="rounded-lg border border-amber-200 bg-amber-50/80 p-4 text-xs text-amber-950">
        <span className="font-bold uppercase tracking-wider text-[11px] block mb-0.5">
          Constitutional & Legal Boundary Notice
        </span>
        Decision records serve as institutional policy memory. Marking a proposal as
        &quot;Reviewed&quot; reflects analytical sign-off and does not constitute statutory
        legislative appropriation or executive fund disbursement.
      </div>

      {/* Main Workspace */}
      {!plans.length ? (
        <div className="rounded-lg border border-stone-200 bg-white p-12 text-center text-sm text-stone-500">
          <p className="font-semibold text-stone-800">No decision proposals recorded yet.</p>
          <p className="mt-1 text-xs text-stone-500">
            Navigate to the Budget Planner to formulate and save an evidence-backed allocation
            draft.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Proposals List */}
          <div className="lg:col-span-4 space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-stone-500 block px-1">
              Recorded Proposals ({plans.length})
            </span>
            <div className="space-y-2">
              {plans.map((p, idx) => {
                const isSelected = idx === selectedPlanIndex;
                const status = p.status || (p.reviewed ? "Reviewed" : "Draft");
                return (
                  <div
                    key={p.id || idx}
                    onClick={() => setSelectedPlanIndex(idx)}
                    className={`cursor-pointer rounded-lg border p-3.5 transition text-xs space-y-1 ${
                      isSelected
                        ? "border-stone-900 bg-stone-900 text-white shadow-sm"
                        : "border-stone-200 bg-white hover:border-stone-300 text-stone-800"
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <span
                        className={`font-semibold line-clamp-1 ${isSelected ? "text-white" : "text-stone-900"}`}
                      >
                        {p.title || "Strategic Budget Proposal"}
                      </span>
                      <span
                        className={`rounded px-1.5 py-0.2 font-mono text-[10px] border ${
                          isSelected
                            ? "bg-stone-800 text-emerald-300 border-stone-700"
                            : "bg-stone-100 text-stone-600 border-stone-200"
                        }`}
                      >
                        {status}
                      </span>
                    </div>
                    <p
                      className={`line-clamp-2 text-[11px] ${isSelected ? "text-stone-300" : "text-stone-500"}`}
                    >
                      {p.reason || "Multi-sector investment framework for regional development"}
                    </p>
                    <div
                      className={`text-[10px] font-mono pt-1 ${isSelected ? "text-stone-400" : "text-stone-400"}`}
                    >
                      {p.date || "2026-Q3"} • {p.origin || "Republic of Aderin"}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Active Record Detail & Audit Trail */}
          <div className="lg:col-span-8 space-y-5">
            {activePlan && (
              <div className="rounded-lg border border-stone-200 bg-white p-6 shadow-sm space-y-5">
                <div className="flex flex-wrap items-start justify-between gap-3 border-b border-stone-100 pb-4">
                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      Record ID: {activePlan.id || `REC-${selectedPlanIndex + 1}`}
                    </span>
                    <h3 className="text-base font-bold text-stone-900 mt-1.5">
                      {activePlan.title}
                    </h3>
                    <p className="text-xs text-stone-500 mt-0.5">{activePlan.reason}</p>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => toggleReview(selectedPlanIndex)}
                      className={`rounded px-3 py-1.5 text-xs font-semibold transition ${
                        activePlan.reviewed
                          ? "bg-amber-100 text-amber-900 hover:bg-amber-200"
                          : "bg-emerald-800 text-white hover:bg-emerald-700 shadow-sm"
                      }`}
                    >
                      {activePlan.reviewed ? "Mark unreviewed" : "Mark reviewed"}
                    </button>
                    <button
                      onClick={() =>
                        downloadJson(
                          `decision-${activePlan.id || selectedPlanIndex}.json`,
                          activePlan,
                        )
                      }
                      className="rounded border border-stone-300 px-3 py-1.5 text-xs font-medium text-stone-700 hover:bg-stone-50"
                    >
                      Export JSON
                    </button>
                  </div>
                </div>

                {/* Status Selector */}
                <div className="flex items-center space-x-3 text-xs bg-stone-50 p-3 rounded border border-stone-100">
                  <span className="font-semibold text-stone-700">Proposal Lifecycle Status:</span>
                  <div className="flex space-x-1.5">
                    {PROTOTYPE_STATUSES.map((st) => (
                      <button
                        key={st}
                        onClick={() => setPlanStatus(selectedPlanIndex, st)}
                        className={`px-2.5 py-1 rounded text-[11px] font-medium border transition ${
                          (activePlan.status || (activePlan.reviewed ? "Reviewed" : "Draft")) === st
                            ? "bg-stone-900 text-white border-stone-900 font-semibold"
                            : "bg-white text-stone-600 border-stone-200 hover:bg-stone-100"
                        }`}
                      >
                        {st}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Financial Allocations Grid */}
                {activePlan.result?.config?.budgets && (
                  <div className="space-y-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-stone-500">
                      Approved Sector Envelope Commitments
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                      {Object.entries(activePlan.result.config.budgets).map(([k, amt]) => (
                        <div key={k} className="p-2.5 rounded border border-stone-200 bg-stone-50">
                          <span className="capitalize text-[11px] text-stone-500 block truncate">
                            {k}
                          </span>
                          <span className="font-mono font-bold text-stone-900 text-xs">
                            {formatCurrency(amt)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Model Assumptions & Evidence References */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs pt-1">
                  <div className="rounded border border-stone-200 p-3 space-y-1.5">
                    <span className="font-semibold text-stone-800 block">
                      Preserved Model Assumptions
                    </span>
                    <ul className="list-disc pl-4 space-y-1 text-stone-600 text-[11px]">
                      <li>Planning horizon: {activePlan.result?.config?.years || 5} years.</li>
                      <li>
                        Delivery capacity factor: {activePlan.result?.config?.delivery || 80}%.
                      </li>
                      <li>
                        Recurrent maintenance set at: {activePlan.result?.config?.maintenance || 20}
                        %.
                      </li>
                    </ul>
                  </div>

                  <div className="rounded border border-stone-200 p-3 space-y-1.5">
                    <span className="font-semibold text-stone-800 block">
                      Calculation Provenance
                    </span>
                    <p className="text-[11px] text-stone-600">
                      Dataset Version: {activePlan.result?.dataset || "aderin-economy-v1"}
                      <br />
                      Engine: PlanningEngine.v2 (Deterministic)
                      <br />
                      Last Updated:{" "}
                      {activePlan.updated
                        ? new Date(activePlan.updated).toLocaleString()
                        : "Preserved on creation"}
                    </p>
                  </div>
                </div>

                {/* Raw Snapshot Inspection */}
                <details className="text-xs pt-2 border-t border-stone-100">
                  <summary className="cursor-pointer font-medium text-stone-600 hover:text-stone-900">
                    Inspect Raw Serialized JSON Record
                  </summary>
                  <pre className="mt-2.5 max-h-56 overflow-auto rounded bg-stone-900 p-3 text-[10px] font-mono text-stone-200">
                    {JSON.stringify(activePlan, null, 2)}
                  </pre>
                </details>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export { DecisionMemory as DecisionRecords };
