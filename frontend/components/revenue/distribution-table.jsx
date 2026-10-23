"use client";
import React, { useState } from "react";
import { formatCurrency, formatPercent } from "../../lib/api/types.mjs";

export function DistributionTable({ stateAllocations = [] }) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredStates = stateAllocations.filter(
    (s) =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.id.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-100 pb-3">
        <div>
          <h3 className="text-sm font-semibold text-stone-900">
            Jurisdiction Allocation Breakdown
          </h3>
          <p className="text-xs text-stone-500">
            Net monthly allocation and per-capita distribution
          </p>
        </div>
        <input
          type="text"
          placeholder="Filter by jurisdiction name or code..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-64 rounded border border-stone-300 px-3 py-1.5 text-xs placeholder-stone-400"
        />
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-stone-200 text-stone-500 font-semibold uppercase tracking-wider text-[10px]">
              <th className="py-2.5 px-3">Jurisdiction</th>
              <th className="py-2.5 px-3">Population</th>
              <th className="py-2.5 px-3">Formula Share</th>
              <th className="py-2.5 px-3">Allocation Amount</th>
              <th className="py-2.5 px-3">Per Capita (A₦)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100 font-mono">
            {filteredStates.slice(0, 15).map((row) => (
              <tr key={row.id} className="hover:bg-stone-50/60 transition">
                <td className="py-2 px-3 font-sans font-medium text-stone-900">
                  {row.name}{" "}
                  <span className="text-[11px] text-stone-400 font-mono">({row.id})</span>
                </td>
                <td className="py-2 px-3 text-stone-600">
                  {Number(row.population).toLocaleString()}
                </td>
                <td className="py-2 px-3 text-stone-700">{formatPercent(row.sharePercent, 2)}</td>
                <td className="py-2 px-3 font-bold text-emerald-900">
                  {formatCurrency(row.allocationAmount)}
                </td>
                <td className="py-2 px-3 text-stone-600">
                  A₦ {Math.round(row.perCapita).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredStates.length > 15 && (
          <p className="text-[11px] text-stone-400 text-center pt-3">
            Showing top 15 of {filteredStates.length} jurisdictions.
          </p>
        )}
      </div>
    </div>
  );
}
