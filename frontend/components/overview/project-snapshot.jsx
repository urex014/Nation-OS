"use client";
import React, { useState } from "react";

export function ProjectSnapshot() {
  const [filter, setFilter] = useState("all");

  const statusSummary = [
    { label: "Active", count: 128, dot: "bg-stone-400" },
    { label: "On track", count: 84, dot: "bg-emerald-500" },
    { label: "Need attention", count: 18, dot: "bg-amber-400" },
    { label: "Delayed", count: 9, dot: "bg-rose-500" },
    { label: "Completed", count: 42, dot: "bg-teal-500" },
    { label: "Awaiting approval", count: 15, dot: "bg-amber-600" },
  ];

  const projects = [
    {
      id: "NGA-INF-024",
      name: "North Central Agricultural Logistics Corridor",
      agency: "Federal Ministry of Works",
      approved: "₦420bn",
      progress: 34,
      progressColor: "bg-emerald-600",
      expected: "Dec 2027",
      status: "Active",
      statusStyle: "bg-emerald-50 text-emerald-800 border-emerald-200",
    },
    {
      id: "NGA-EDU-008",
      name: "Federal Technical Colleges Renewal",
      agency: "Federal Ministry of Education",
      approved: "₦96bn",
      progress: 27,
      progressColor: "bg-rose-500",
      expected: "Sep 2027",
      status: "Delayed",
      statusStyle: "bg-rose-50 text-rose-800 border-rose-200",
    },
    {
      id: "NGA-HLT-017",
      name: "Primary Healthcare Resilience Initiative",
      agency: "Federal Ministry of Health",
      approved: "₦128bn",
      progress: 8,
      progressColor: "bg-emerald-500",
      expected: "Mar 2028",
      status: "Approved",
      statusStyle: "bg-emerald-50 text-emerald-700 border-emerald-200",
    },
    {
      id: "NGA-TRA-042",
      name: "Lagos-Ibadan Rail Freight Modernisation",
      agency: "Federal Ministry of Transportation",
      approved: "₦215bn",
      progress: 68,
      progressColor: "bg-emerald-600",
      expected: "Nov 2026",
      status: "On track",
      statusStyle: "bg-emerald-50 text-emerald-800 border-emerald-200",
    },
    {
      id: "NGA-ENG-019",
      name: "Rural Clean Energy Decentralized Minigrids",
      agency: "Federal Ministry of Power",
      approved: "₦84bn",
      progress: 45,
      progressColor: "bg-amber-500",
      expected: "Jul 2027",
      status: "Need attention",
      statusStyle: "bg-amber-50 text-amber-800 border-amber-200",
    },
  ];

  const visibleProjects =
    filter === "all"
      ? projects
      : projects.filter((p) => p.status.toLowerCase() === filter.toLowerCase());

  return (
    <div className="rounded-xl border border-stone-200/90 bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)] space-y-5">
      {/* Header and View Action */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-100 pb-3">
        <div>
          <h3 className="text-sm font-semibold text-stone-900">Project execution snapshot</h3>
          <p className="text-xs text-stone-500">
            Portfolio status and projects requiring intervention
          </p>
        </div>
        <div className="flex items-center space-x-2">
          {filter !== "all" && (
            <button
              onClick={() => setFilter("all")}
              className="text-[11px] font-medium text-emerald-700 hover:underline"
            >
              Reset filter
            </button>
          )}
          <button className="rounded-lg border border-stone-200 bg-stone-50 px-3 py-1.5 text-xs font-semibold text-stone-700 hover:bg-stone-100 transition-colors">
            View full portfolio
          </button>
        </div>
      </div>

      {/* Status Counters Strip */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
        {statusSummary.map((item, idx) => {
          const isSelected = filter.toLowerCase() === item.label.toLowerCase();
          return (
            <button
              key={idx}
              onClick={() => setFilter(isSelected ? "all" : item.label)}
              className={`flex items-center space-x-2.5 rounded-lg border p-2.5 text-left transition-all ${
                isSelected
                  ? "border-emerald-600 bg-emerald-50/60 ring-1 ring-emerald-500"
                  : "border-stone-100 bg-[#FAFCFB] hover:border-stone-200"
              }`}
            >
              <span className={`h-2.5 w-2.5 rounded-full ${item.dot}`} />
              <div>
                <span className="text-base font-bold text-stone-900">{item.count}</span>
                <p className="text-[10px] text-stone-500">{item.label}</p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Projects Table */}
      <div className="overflow-x-auto rounded-lg border border-stone-100">
        <table className="w-full text-left text-xs">
          <thead className="bg-[#FAFCFB] text-[10px] uppercase font-semibold tracking-wider text-stone-400 border-b border-stone-100">
            <tr>
              <th className="px-4 py-3">Project</th>
              <th className="px-4 py-3">Ministry / Agency</th>
              <th className="px-4 py-3">Approved Budget</th>
              <th className="px-4 py-3">Progress</th>
              <th className="px-4 py-3">Expected Completion</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-3 py-3 text-right"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {visibleProjects.map((p) => (
              <tr key={p.id} className="hover:bg-stone-50/70 transition-colors">
                <td className="px-4 py-3.5">
                  <div className="font-semibold text-stone-900">{p.name}</div>
                  <div className="font-mono text-[10px] text-stone-400">{p.id}</div>
                </td>
                <td className="px-4 py-3.5 text-stone-600">{p.agency}</td>
                <td className="px-4 py-3.5 font-mono font-semibold text-stone-900">{p.approved}</td>
                <td className="px-4 py-3.5">
                  <div className="flex items-center space-x-2.5">
                    <div className="h-1.5 w-20 rounded-full bg-stone-100 overflow-hidden">
                      <div
                        style={{ width: `${p.progress}%` }}
                        className={`h-full rounded-full ${p.progressColor}`}
                      />
                    </div>
                    <span className="font-mono text-[11px] text-stone-600">{p.progress}%</span>
                  </div>
                </td>
                <td className="px-4 py-3.5 text-stone-500">{p.expected}</td>
                <td className="px-4 py-3.5">
                  <span
                    className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium ${p.statusStyle}`}
                  >
                    {p.status}
                  </span>
                </td>
                <td className="px-3 py-3.5 text-right text-stone-400">
                  <button className="hover:text-stone-700">
                    <svg
                      className="h-4 w-4"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
