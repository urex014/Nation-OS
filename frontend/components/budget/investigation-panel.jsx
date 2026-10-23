"use client";
import React from "react";

export function InvestigationPanel({ report }) {
  if (!report) return null;

  return (
    <div className="rounded-lg border border-emerald-200 bg-emerald-50/50 p-5 shadow-sm space-y-4">
      <div className="border-b border-emerald-200/80 pb-3 flex justify-between items-center">
        <div>
          <h3 className="text-sm font-semibold text-emerald-950">
            Structured Investigation Sequence
          </h3>
          <p className="text-xs text-emerald-800">
            Audited workflow progressing from problem parsing to deterministic numerical projection
          </p>
        </div>
        <span className="text-[11px] font-mono font-bold text-emerald-900">
          Stages Complete: 6 / 6
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {report.investigationStages.map((st) => (
          <div
            key={st.stage}
            className="rounded border border-emerald-200 bg-white p-3 text-xs space-y-1"
          >
            <div className="flex items-center space-x-1.5 font-semibold text-emerald-900">
              <span className="text-emerald-600">✓</span>
              <span>
                {st.stage}. {st.name}
              </span>
            </div>
            <p className="text-[11px] text-stone-600 leading-tight">{st.note}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs pt-1">
        <div className="rounded border border-stone-200 bg-white p-3 space-y-1">
          <span className="font-semibold text-stone-900 block">Identified Policy Trade-Offs</span>
          <ul className="list-disc pl-4 space-y-0.5 text-stone-600 text-[11px]">
            {report.tradeoffs.map((t, idx) => (
              <li key={idx}>{t}</li>
            ))}
          </ul>
        </div>
        <div className="rounded border border-stone-200 bg-white p-3 space-y-1">
          <span className="font-semibold text-stone-900 block">Identified Operational Risks</span>
          <ul className="list-disc pl-4 space-y-0.5 text-stone-600 text-[11px]">
            {report.risks.map((r, idx) => (
              <li key={idx}>{r}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
