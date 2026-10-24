"use client";
import { useState } from "react";
import { Card, Button, Heading } from "../nigeria/ui";

export function ProjectDecisionRecords({ initialAnalyses = { records: [], total: 0 } }) {
  const [selected, setSelected] = useState(initialAnalyses.records[0] || null);

  return (
    <div className="space-y-6">
      <Heading
        eyebrow="Public Transparency"
        title="Government Capital Project Decision Analyses"
      >
        Evidence-grounded allocation scenarios and budget decisions evaluated against verified Lagos State project records. Visible to all citizens and government officials.
      </Heading>

      <Card title={`Saved Allocation Scenarios (${initialAnalyses.total} records)`}>
        {initialAnalyses.records.length === 0 ? (
          <p className="py-6 text-center text-sm text-stone-500">
            No budget allocation analyses saved yet. Simulate a scenario in the Budget Allocation Workspace to persist a decision.
          </p>
        ) : (
          <div className="divide-y divide-stone-100">
            {initialAnalyses.records.map((a) => {
              const isSelected = selected?.id === a.id;
              return (
                <div
                  key={a.id}
                  className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 py-3 px-2 rounded-lg transition-colors ${
                    isSelected ? "bg-emerald-50/70" : "hover:bg-stone-50"
                  }`}
                >
                  <div className="min-w-0">
                    <strong className="block text-sm font-semibold text-stone-900 truncate">
                      {a.title}
                    </strong>
                    <div className="flex flex-wrap items-center gap-2 mt-1 text-2xs text-stone-500">
                      <span>{new Date(a.createdAt).toLocaleString()}</span>
                      <span>·</span>
                      <span className="font-medium text-emerald-800">
                        Envelope: {a.proposedBudgetFormatted}
                      </span>
                      <span>·</span>
                      <span>
                        {a.allocationResults?.recommendedProjects?.length || 0} projects funded
                      </span>
                    </div>
                  </div>
                  <Button
                    secondary={!isSelected}
                    onClick={() => setSelected(a)}
                    className="self-start sm:self-center py-1 px-3 text-xs"
                  >
                    {isSelected ? "Inspecting" : "View Breakdown ↗"}
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {selected && (
        <Card title={`Decision Details: ${selected.title}`}>
          <div className="space-y-4">
            <div className="rounded-lg bg-stone-50 p-4 border border-stone-200">
              <span className="text-2xs font-bold uppercase tracking-wider text-emerald-800">
                Decision Rationale & Mathematical Constraints
              </span>
              <p className="mt-2 text-sm leading-6 text-stone-800 whitespace-pre-wrap">
                {selected.rationale}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div className="rounded border border-stone-200 p-3">
                <span className="text-2xs text-stone-500 block">Proposed Envelope</span>
                <strong className="text-base text-stone-900">{selected.proposedBudgetFormatted}</strong>
              </div>
              <div className="rounded border border-stone-200 p-3">
                <span className="text-2xs text-stone-500 block">Allocated Sum</span>
                <strong className="text-base text-emerald-800">
                  {selected.allocationResults?.totalAllocatedFormatted || selected.proposedBudgetFormatted}
                </strong>
              </div>
              <div className="rounded border border-stone-200 p-3">
                <span className="text-2xs text-stone-500 block">Existing Projects</span>
                <strong className="text-base text-stone-900">
                  {selected.allocationResults?.existingProjectsCount ?? 0}
                </strong>
              </div>
              <div className="rounded border border-stone-200 p-3">
                <span className="text-2xs text-stone-500 block">Unallocated Envelope</span>
                <strong className="text-base text-stone-600">
                  {selected.allocationResults?.unallocatedFormatted || "₦0.00"}
                </strong>
              </div>
            </div>

            {selected.allocationResults?.sectorBreakdown && (
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-stone-600 mb-2">
                  Sector Allocations
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {Object.entries(selected.allocationResults.sectorBreakdown).map(([sec, val]) => (
                    <div key={sec} className="rounded border border-stone-100 bg-stone-50/50 p-2 text-xs">
                      <span className="font-medium text-stone-800">{sec}</span>
                      <div className="text-stone-500 text-2xs mt-0.5">
                        {val.percent}% · {val.amountFormatted || val.amountKobo}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {selected.evidenceCitations?.length > 0 && (
              <div className="border-t border-stone-200 pt-3">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-stone-600 mb-2">
                  Supporting Verified Citations
                </h4>
                <div className="space-y-1.5">
                  {selected.evidenceCitations.map((c, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs text-stone-600">
                      <span className="rounded bg-emerald-50 px-1.5 py-0.5 text-2xs font-semibold text-emerald-800">
                        Citation
                      </span>
                      <span className="font-medium text-stone-800">{c.label}</span>
                      {c.reference && <span className="text-stone-500">({c.reference})</span>}
                      {c.url && (
                        <a
                          href={c.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-emerald-700 hover:underline text-2xs ml-auto"
                        >
                          Source Link ↗
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}
