"use client";

import { useMemo, useState } from "react";
import { formatNaira, millionToNaira } from "@/lib/format/money";
import { faacFill, MAP_PATHS } from "@/lib/map";
import type { Overview as OverviewData } from "@/lib/types";
import type { Revenue } from "@/lib/types";
import { Card, Heading, Notice, Source, Stat } from "./ui";

const KPI = [
  ["approvedExpenditure", "Approved spend", "Third reading, 31 Mar 2026", "budgetThirdReading"],
  ["statutoryTransfers", "Statutory transfers", "Third reading component", "budgetThirdReading"],
  ["recurrentNonDebt", "Recurrent non-debt", "Third reading component", "budgetThirdReading"],
  ["debtService", "Debt service", "Third reading component", "budgetThirdReading"],
  ["capitalExpenditure", "Capital", "Third reading component", "budgetThirdReading"],
  ["revenueTarget", "Revenue target", "MTEF, 3 Dec 2025", "mtef"],
] as const;

export function Overview({ data, revenue }: { data: OverviewData; revenue: Revenue }) {
  const [selected, setSelected] = useState("NG-LA");
  const ranked = useMemo(() => {
    const order = [...revenue.stateAllocations].sort(
      (a, b) => b.allocationAmount - a.allocationAmount,
    );
    return new Map(order.map((row, index) => [row.id, index + 1]));
  }, [revenue]);
  const amount = new Map(revenue.stateAllocations.map((row) => [row.id, row.allocationAmount]));
  const selectedAmount = amount.get(selected);
  const selectedMeta = MAP_PATHS.find((row) => row.id === selected);
  const selectedRank = ranked.get(selected);

  return (
    <>
      <Heading eyebrow="National Overview" title="A clearer picture of Nigeria">
        Cited 2026 budget headlines and January–September FAAC to the 36 states. Pick a state on the
        map. The FCT is missing from that FAAC table.
      </Heading>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {KPI.map(([key, label, note, sourceId]) => (
          <div key={key}>
            <Stat label={label} value={data.metrics[key]} note={note} />
            <p className="mt-2 px-1">
              <Source id={sourceId} />
            </p>
          </div>
        ))}
      </div>
      <div className="my-6 grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        <Card title="States & territories">
          <p className="text-xs text-stone-500">
            Darker green is a larger January–September 2026 gross FAAC amount. Grey is the FCT.
          </p>
          <svg
            viewBox="0 0 650 560"
            className="mx-auto max-h-[460px] w-full"
            aria-label="Nigeria state boundaries"
          >
            {MAP_PATHS.map((state) => {
              const rank = ranked.get(state.id) ?? null;
              return (
                <path
                  key={state.id}
                  d={state.path}
                  fill={faacFill(rank, 36)}
                  fillRule="evenodd"
                  stroke={selected === state.id ? "#d99524" : "white"}
                  strokeWidth={selected === state.id ? 2.5 : 0.7}
                  role="button"
                  tabIndex={0}
                  aria-label={state.name}
                  aria-pressed={selected === state.id}
                  onClick={() => setSelected(state.id)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      setSelected(state.id);
                    }
                  }}
                >
                  <title>
                    {state.name}
                    {amount.has(state.id)
                      ? ` · ${formatNaira(millionToNaira(amount.get(state.id) ?? 0))}`
                      : " · not in the FAAC table"}
                  </title>
                </path>
              );
            })}
          </svg>
          <p className="mt-3 text-xs text-stone-500">
            Map outlines: GRID3 / geoBoundaries 2022, CC BY 4.0. Amounts: Agora Policy FAAC ranking.
          </p>
        </Card>
        <div className="space-y-6">
          <Card title={selectedMeta?.name ?? selected}>
            {selectedAmount == null ? (
              <p className="text-sm leading-6 text-stone-600">
                {selectedMeta?.name} is not in the January–September 2026 36-state FAAC table.
                National envelopes stay in place.
              </p>
            ) : (
              <>
                <p className="text-xs text-stone-500">
                  January–September 2026 gross FAAC · published
                </p>
                <p className="my-4 text-4xl font-semibold">
                  {formatNaira(millionToNaira(selectedAmount))}
                </p>
                <dl className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <dt>Share of the listed 36-state sum</dt>
                    <dd>{data.jurisdictions.find((row) => row.id === selected)?.sharePercent}%</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt>Rank</dt>
                    <dd>{selectedRank} / 36</dd>
                  </div>
                </dl>
              </>
            )}
            <p className="mt-4">
              <Source id="faacJanSep2026">Agora Policy · Jan–Sep 2026</Source>
            </p>
          </Card>
          <Card title="Appropriated items">
            {data.projects.length === 0 ? (
              <p className="text-sm text-stone-500">No appropriated items are loaded.</p>
            ) : (
              <ul className="space-y-3 text-sm">
                {data.projects.slice(0, 5).map((project) => (
                  <li key={project.id} className="flex justify-between gap-3">
                    <span>{project.name}</span>
                    <strong>{project.approved}</strong>
                  </li>
                ))}
              </ul>
            )}
            <p className="mt-4">
              <Source id="budgetThirdReading">Third reading add-ons</Source>
            </p>
          </Card>
        </div>
      </div>
      <Notice>
        The six cards mix two documents: the 31 March third reading and the December 2025 MTEF
        revenue target. They are not one Act.
      </Notice>
      <h2 className="mb-4 mt-8 text-xl font-semibold">National indicators</h2>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {data.indicators.map((indicator) => (
          <Card key={indicator.title} title={indicator.title}>
            <p className="mb-2 text-2xl font-semibold">{indicator.value}</p>
            <p className="mb-2 text-xs text-stone-500">{indicator.period}</p>
            <p className="text-xs leading-5 text-stone-500">{indicator.source}</p>
          </Card>
        ))}
      </div>
    </>
  );
}
