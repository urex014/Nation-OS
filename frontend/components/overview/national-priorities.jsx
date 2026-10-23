"use client";
import React from "react";

export function NationalPriorities() {
  const priorities = [
    {
      name: "Infrastructure & Transport",
      amount: "₦2.84tn",
      projects: 32,
      percent: 75,
    },
    {
      name: "Education",
      amount: "₦1.92tn",
      projects: 24,
      percent: 60,
    },
    {
      name: "Healthcare",
      amount: "₦1.41tn",
      projects: 18,
      percent: 50,
    },
    {
      name: "Agriculture & Food Security",
      amount: "₦1.03tn",
      projects: 21,
      percent: 40,
    },
    {
      name: "Energy",
      amount: "₦1.22tn",
      projects: 14,
      percent: 45,
    },
  ];

  return (
    <div className="rounded-xl border border-stone-200/90 bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)] flex flex-col justify-between h-full">
      <div>
        <div className="border-b border-stone-100 pb-3">
          <h3 className="text-sm font-semibold text-stone-900">National priorities</h3>
          <p className="text-xs text-stone-500">Funding and linked projects</p>
        </div>

        <div className="mt-4 space-y-4">
          {priorities.map((item, idx) => (
            <div
              key={idx}
              className="group flex items-center justify-between rounded-lg p-2.5 transition-colors hover:bg-stone-50/80"
            >
              <div className="flex items-center space-x-3.5 flex-1 min-w-0 pr-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#E8F5EE] text-[#0B3B2C]">
                  <svg
                    className="h-5 w-5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M12 2 2 7l10 5 10-5-10-5z" />
                    <polyline points="2 17 12 22 22 17" />
                    <polyline points="2 12 12 17 22 12" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="truncate text-xs font-semibold text-stone-900">
                      {item.name}
                    </span>
                    <span className="font-mono text-xs font-bold text-stone-900">
                      {item.amount}
                    </span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-stone-100 overflow-hidden">
                    <div
                      style={{ width: `${item.percent}%` }}
                      className="h-full rounded-full bg-emerald-600 transition-all duration-500"
                    />
                  </div>
                  <div className="mt-1 text-[10px] text-stone-400">
                    {item.projects} associated projects
                  </div>
                </div>
              </div>

              <div className="text-stone-400 group-hover:text-stone-600 transition-colors">
                <svg
                  className="h-4 w-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-5 border-t border-stone-100 pt-3.5">
        <a
          href="/budget"
          className="flex items-center text-xs font-semibold text-emerald-800 hover:text-emerald-950 transition-colors"
        >
          <span>View all sector allocations</span>
          <svg
            className="ml-1.5 h-3.5 w-3.5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M5 12h14" />
            <path d="m12 5 7 7-7 7" />
          </svg>
        </a>
      </div>
    </div>
  );
}
