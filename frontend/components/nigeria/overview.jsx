"use client";
import { useState } from "react";
import { Heading, Card, Stat, Source, Notice } from "./ui";
import { Trend } from "./trend";
import { naira, indicatorValue, number } from "../../lib/nigeria/format.mjs";
const colours = ["#dcece3", "#abcab8", "#77a58c", "#3b7959", "#145337"];
export function Overview({ data, decisionsData }) {
  const [selected, setSelected] = useState("NG-LA");
  const state = data.revenue.states.find((s) => s.id === selected);
  const population = data.indicators.find((i) => i.code === "SP.POP.TOTL");
  const gdp = data.indicators.find((i) => i.code === "NY.GDP.MKTP.CD");
  return (
    <>
      <Heading eyebrow="The country" title="A clearer picture of Nigeria">
        A country view built from published figures. Look through all 36 states and the Federal
        Capital Territory, then take those figures into a planning review.
      </Heading>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat
          label="Population"
          value={indicatorValue(population)}
          note={`World Bank · ${population.year}`}
        />
        <Stat
          label="GDP · current US dollars"
          value={indicatorValue(gdp)}
          note={`World Bank · ${gdp.year}; not money the government collected`}
        />
        <Stat
          label="Approved federal budget"
          value={naira(data.budget.approvedNaira)}
          note={`${data.budget.year} approved total · not what was actually spent`}
        />
        <Stat
          label="Combined state and FCT IGR"
          value={naira(data.revenue.totalNaira)}
          note={`NBS · ${data.revenue.year} · IGR is money states raise themselves · transfers left out`}
        />
      </div>
      <div className="my-6 grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        <Card title="States & territories">
          <p className="text-xs text-stone-500">
            Pick a state. Darker green means higher IGR in {data.revenue.year}.
          </p>
          <svg
            viewBox="0 0 650 560"
            className="mx-auto max-h-[460px] w-full"
            aria-label="Nigeria state boundaries"
          >
            {data.map.map((s) => {
              const r = data.revenue.states.find((r) => r.id === s.id);
              return (
                <path
                  key={s.id}
                  d={s.path}
                  fill={colours[Math.min(4, Math.floor((37 - r.rank) / 8))]}
                  fillRule="evenodd"
                  stroke={selected === s.id ? "#d99524" : "white"}
                  strokeWidth={selected === s.id ? 2.5 : 0.7}
                  role="button"
                  tabIndex={0}
                  aria-label={s.name}
                  aria-pressed={selected === s.id}
                  onClick={() => setSelected(s.id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setSelected(s.id);
                    }
                  }}
                >
                  <title>
                    {s.name} · {naira(r.totalNaira)}
                  </title>
                </path>
              );
            })}
          </svg>
          <Source id="geoboundaries-ng-2022">
            GRID3 / geoBoundaries · 2022 boundaries · CC BY 4.0
          </Source>
        </Card>
        <div className="space-y-6">
          <Card title={state.name}>
            <p className="text-xs text-stone-500">
              {state.type === "territory" ? "Federal Capital Territory" : "State"} ·{" "}
              {data.revenue.year} IGR (money the state raises itself)
            </p>
            <p className="my-4 text-4xl font-semibold">{naira(state.totalNaira)}</p>
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between gap-3">
                <dt className="min-w-0">Share of all states’ IGR</dt>
                <dd className="shrink-0">{number(state.nationalSharePercent)}%</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="min-w-0">Rank by amount</dt>
                <dd className="shrink-0">{state.rank} / 37</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="min-w-0">Change from the year before, not adjusted for inflation</dt>
                <dd className="shrink-0">{number(state.growthPercent)}%</dd>
              </div>
            </dl>
            <p className="my-5 text-xs leading-5 text-stone-500">
              States differ because their economies, tax bases, and collections differ. This is not
              a ranking of how well a government is run. We don’t have current state population or
              GDP you can compare.
            </p>
            <Source id={state.sourceId} />
          </Card>
          <Card title="Revenue across all jurisdictions">
            <Trend rows={data.revenueHistory} />
          </Card>
        </div>
      </div>
      <Notice>
        The federal budget and combined state IGR are different levels of government. Don’t add them
        together, and don’t treat them as money waiting for projects.
      </Notice>
      <h2 className="mb-4 mt-8 text-xl font-semibold">National figures</h2>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {data.indicators.map((i) => (
          <Card key={i.code} title={i.label}>
            <p className="mb-2 text-2xl font-semibold">{indicatorValue(i)}</p>
            <p className="mb-2 text-xs text-stone-500">
              {i.year ?? "Not reported"} · {i.unit}
            </p>
            <p className="mb-4 text-xs leading-5 text-stone-500">{i.note}</p>
            <Source id={i.sourceId} />
          </Card>
        ))}
      </div>
      {decisionsData && (
        <div className="mt-12 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-stone-200 pb-3">
            <div>
              <span className="text-2xs font-bold uppercase tracking-wider text-emerald-800">
                Government Transparency
              </span>
              <h2 className="text-xl font-semibold text-stone-900">
                Lagos State Capital Project Intelligence & Decisions
              </h2>
            </div>
            <a
              href="/decisions"
              className="inline-flex items-center text-xs font-semibold text-emerald-800 hover:text-emerald-950 underline"
            >
              Open Full Project Explorer & Decisions System →
            </a>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Stat
              label="Indexed Projects"
              value={decisionsData.overview.totalProjects?.toLocaleString() || "0"}
              note="Lagos PMR & Tracka records"
            />
            <Stat
              label="Ongoing Works"
              value={decisionsData.overview.ongoingProjects?.toLocaleString() || "0"}
              note="Active capital commitments"
            />
            <Stat
              label="Completed Projects"
              value={decisionsData.overview.completedProjects?.toLocaleString() || "0"}
              note="100% physically verified"
            />
            <Stat
              label="Verified Capital Sums"
              value={decisionsData.overview.verifiedAllocationsCompact || "₦0"}
              note="Traceable contract allocations"
            />
          </div>

          {decisionsData.recentAnalyses?.length > 0 && (
            <Card title="Recent Government Budget Decisions & Evidence Citations">
              <p className="text-xs text-stone-500 mb-4">
                Public decision records evaluating Lagos State infrastructure funding priorities with verified source citations.
              </p>
              <div className="divide-y divide-stone-100">
                {decisionsData.recentAnalyses.map((d) => (
                  <div key={d.id} className="py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div className="min-w-0">
                      <strong className="block text-sm font-semibold text-stone-900 truncate">
                        {d.title}
                      </strong>
                      <span className="text-2xs text-stone-500">
                        {new Date(d.createdAt).toLocaleDateString()} · Proposed: {d.proposedBudgetFormatted} · {d.projectsCount} projects prioritized
                      </span>
                    </div>
                    <a
                      href="/decisions"
                      className="text-xs font-medium text-emerald-700 hover:underline shrink-0"
                    >
                      Inspect Evidence Citations →
                    </a>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      )}
    </>
  );
}
