"use client";
import React from "react";

export function NationalIndicators() {
  const indicators = [
    {
      title: "Inflation",
      value: "24.2%",
      period: "Feb 2026",
      bars: [30, 42, 55, 68, 78, 88],
    },
    {
      title: "GDP growth",
      value: "3.84%",
      period: "Q4 2025",
      bars: [25, 32, 45, 50, 62, 70],
    },
    {
      title: "Exchange rate",
      value: "₦1,536/$",
      period: "21 Mar 2026",
      bars: [45, 55, 65, 80, 85, 90],
    },
    {
      title: "Public debt",
      value: "₦152.4tn",
      period: "Sep 2025",
      bars: [35, 48, 58, 65, 75, 85],
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Indicators Card */}
      <div className="rounded-xl border border-stone-200/90 bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-100 pb-3">
          <div>
            <h3 className="text-sm font-semibold text-stone-900">National indicators</h3>
            <p className="text-xs text-stone-500">
              Latest available values and recent directional trend
            </p>
          </div>
          <button className="flex items-center text-xs font-medium text-emerald-700 hover:text-emerald-800 transition-colors">
            <span>View data sources</span>
            <svg
              className="ml-1 h-3.5 w-3.5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M5 12h14" />
              <path d="m12 5 7 7-7 7" />
            </svg>
          </button>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {indicators.map((item, idx) => (
            <div key={idx} className="rounded-lg border border-stone-100 bg-[#FAFCFB] p-3">
              <div className="flex items-end justify-between">
                <div>
                  <span className="text-[11px] font-medium text-stone-500">{item.title}</span>
                  <div className="mt-1 text-lg font-bold tracking-tight text-stone-900">
                    {item.value}
                  </div>
                  <span className="text-[10px] text-stone-400">{item.period}</span>
                </div>
                {/* Mini Bar Sparkline */}
                <div className="flex items-end space-x-1 pb-1">
                  {item.bars.map((height, bIdx) => (
                    <div
                      key={bIdx}
                      style={{ height: `${height * 0.28}px` }}
                      className={`w-1 rounded-sm ${
                        bIdx === item.bars.length - 1 ? "bg-emerald-600" : "bg-emerald-200"
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Government Revenue Line Chart */}
      <div className="rounded-xl border border-stone-200/90 bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-100 pb-3">
          <div>
            <h3 className="text-sm font-semibold text-stone-900">Government revenue</h3>
            <p className="text-xs text-stone-500">Illustrative quarterly collection vs target</p>
          </div>
          <div className="flex items-center space-x-4 text-xs font-medium text-stone-600">
            <div className="flex items-center space-x-1.5">
              <span className="h-2.5 w-5 rounded bg-emerald-600 inline-block" />
              <span>Collected</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="h-0.5 w-5 border-t-2 border-dashed border-amber-500 inline-block" />
              <span>Scenario target</span>
            </div>
          </div>
        </div>

        {/* Chart SVG */}
        <div className="relative mt-4 h-48 w-full">
          <svg
            className="h-full w-full overflow-visible"
            viewBox="0 0 600 180"
            preserveAspectRatio="none"
          >
            {/* Grid Lines and Labels */}
            <line x1="40" y1="20" x2="590" y2="20" stroke="#F1F5F3" strokeWidth="1" />
            <text x="5" y="24" fontSize="10" fill="#9CA3AF" fontFamily="sans-serif">
              ₦4tn
            </text>

            <line x1="40" y1="80" x2="590" y2="80" stroke="#F1F5F3" strokeWidth="1" />
            <text x="5" y="84" fontSize="10" fill="#9CA3AF" fontFamily="sans-serif">
              ₦2tn
            </text>

            <line x1="40" y1="140" x2="590" y2="140" stroke="#E5E7EB" strokeWidth="1" />
            <text x="15" y="144" fontSize="10" fill="#9CA3AF" fontFamily="sans-serif">
              ₦0
            </text>

            {/* Scenario Target (Dashed gold curve) */}
            <path
              d="M 50 130 C 180 115, 340 85, 580 40"
              fill="none"
              stroke="#D97706"
              strokeWidth="2.5"
              strokeDasharray="4 4"
            />

            {/* Collected Revenue (Solid emerald curve) */}
            <path
              d="M 50 135 C 160 120, 260 110, 360 95 C 430 85, 480 90, 580 50"
              fill="none"
              stroke="#059669"
              strokeWidth="3"
            />

            {/* X-Axis labels */}
            <text
              x="60"
              y="165"
              fontSize="10"
              fill="#9CA3AF"
              textAnchor="middle"
              fontFamily="sans-serif"
            >
              Q1
            </text>
            <text
              x="230"
              y="165"
              fontSize="10"
              fill="#9CA3AF"
              textAnchor="middle"
              fontFamily="sans-serif"
            >
              Q2
            </text>
            <text
              x="400"
              y="165"
              fontSize="10"
              fill="#9CA3AF"
              textAnchor="middle"
              fontFamily="sans-serif"
            >
              Q3
            </text>
            <text
              x="570"
              y="165"
              fontSize="10"
              fill="#9CA3AF"
              textAnchor="middle"
              fontFamily="sans-serif"
            >
              Q4
            </text>
          </svg>
        </div>

        <div className="mt-4 border-t border-stone-100 pt-3 text-right">
          <span className="text-[10px] text-stone-400">
            Source: Illustrative NationOS planning dataset
          </span>
        </div>
      </div>
    </div>
  );
}
