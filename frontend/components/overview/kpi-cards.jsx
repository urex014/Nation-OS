"use client";
import React from "react";

export function KpiCards({ metrics = {} }) {
  const cards = [
    {
      title: "Approved federal budget",
      value: metrics.approvedBudget || "₦54.99tn",
      note: "Official 2025 budget · Budget Office",
      statusColor: "bg-stone-300",
    },
    {
      title: "Projected revenue",
      value: metrics.projectedRevenue || "₦14.0tn",
      note: "Illustrative 2026 scenario",
      statusColor: "bg-stone-300",
    },
    {
      title: "Actual revenue collected",
      value: metrics.actualRevenue || "₦3.28tn",
      note: "Demo figure · Q1 2026",
      statusColor: "bg-amber-400",
    },
    {
      title: "Total expenditure",
      value: metrics.totalExpenditure || "₦3.01tn",
      note: "Demo figure · Q1 2026",
      statusColor: "bg-stone-300",
    },
    {
      title: "Capital expenditure",
      value: metrics.capitalExpenditure || "₦1.16tn",
      note: "38.5% of demo expenditure",
      statusColor: "bg-stone-300",
    },
    {
      title: "Active national projects",
      value: metrics.activeProjects || "128",
      note: "Illustrative portfolio · 18 need attention",
      statusColor: "bg-emerald-500",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6">
      {cards.map((card, idx) => (
        <div
          key={idx}
          className="rounded-xl border border-stone-200/90 bg-white p-4 shadow-[0_1px_3px_rgba(0,0,0,0.04)] transition-all hover:border-stone-300"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-stone-500 leading-tight">
              {card.title}
            </span>
            <span className={`h-2 w-2 rounded-full ${card.statusColor}`} />
          </div>
          <div className="mt-3 text-2xl font-bold tracking-tight text-stone-900">{card.value}</div>
          <p className="mt-2 text-[11px] text-stone-400 leading-snug">{card.note}</p>
        </div>
      ))}
    </div>
  );
}
