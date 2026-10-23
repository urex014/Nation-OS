"use client";
import Link from "next/link";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  definitions,
  planningStates,
  sectors,
  defaultPlan,
  number,
} from "../../lib/client/country.mjs";
import { useWorkspace } from "../workspace/provider";
import { Button, DataTable, Field, Heading, Note, Panel } from "../ui/primitives";

export function SectorPlanning({ foodOnly = false }) {
  const [sector, setSector] = useState(foodOnly ? "food" : "education");
  const [scope, setScope] = useState("all"),
    [budget, setBudget] = useState(120),
    [years, setYears] = useState(5);
  const { setDraft } = useWorkspace();
  const router = useRouter();
  const definition = definitions[sector];
  const filtered = planningStates.filter((state) => scope === "all" || state.id === scope);
  const average =
    filtered.reduce((sum, state) => sum + state.baselines[sector] * state.population, 0) /
    filtered.reduce((sum, state) => sum + state.population, 0);
  function draft(event) {
    event.preventDefault();
    setDraft({
      title: `${definition.name} investment programme`,
      reason: `Address ${definition.metric.toLowerCase()} gaps. Validate cost and delivery assumptions with sector teams.`,
      origin: "Sector planning",
      config: {
        ...defaultPlan,
        years,
        scope,
        budgets: Object.fromEntries(
          Object.keys(definitions).map((key) => [key, key === sector ? budget : 0]),
        ),
      },
    });
    router.push("/recommendations");
  }
  return (
    <>
      <Heading
        eyebrow="Sector planning"
        title={foodOnly ? "Food affordability" : "Public services, connected decisions"}
      >
        Explore sector baselines, evidence gaps and possible investment. Numerical scenarios are
        conditional on explicit assumptions.
      </Heading>
      {!foodOnly && (
        <div className="flex flex-wrap gap-2">
          {Object.entries(definitions)
            .filter(([key]) => key !== "food")
            .map(([key, item]) => (
              <Button key={key} primary={sector === key} onClick={() => setSector(key)}>
                {item.name}
              </Button>
            ))}
          <Link
            href="/sectors/food"
            className="border border-stone-300 bg-white px-4 py-2.5 text-sm"
          >
            Food affordability â†’
          </Link>
        </div>
      )}
      <Panel title={definition.name}>
        <p className="text-sm">
          {definition.metric}:{" "}
          <strong>
            {number(average, 1)}
            {definition.unit}
          </strong>{" "}
          Â· illustrative target {definition.target}
          {definition.unit}
        </p>
        <Note>
          {sector === "food"
            ? "Food-pressure share is a fictional household proxy, not measured hunger. Production, transport, storage and incomes need separate investigation."
            : `${sectors[sector].source}. ${sectors[sector].gap}`}
        </Note>
        <DataTable headers={["Jurisdiction", definition.metric, "Target"]}>
          {filtered.map((state) => (
            <tr key={state.id}>
              <td>{state.name}</td>
              <td>
                {state.baselines[sector]}
                {definition.unit}
              </td>
              <td>
                {definition.target}
                {definition.unit}
              </td>
            </tr>
          ))}
        </DataTable>
      </Panel>
      <Panel title="Build an investment scenario">
        <form onSubmit={draft} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <Field label="Scope">
              <select value={scope} onChange={(event) => setScope(event.target.value)}>
                <option value="all">Whole country</option>
                {planningStates.map((state) => (
                  <option key={state.id} value={state.id}>
                    {state.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Annual budget (Aâ‚¦ millions)">
              <input
                type="number"
                min="0"
                max="2000"
                required
                value={budget}
                onChange={(event) => setBudget(Number(event.target.value))}
              />
            </Field>
            <Field label="Horizon">
              <select value={years} onChange={(event) => setYears(Number(event.target.value))}>
                <option value={5}>5 years</option>
                <option value={10}>10 years</option>
              </select>
            </Field>
          </div>
          <Button primary type="submit">
            Model in recommendations
          </Button>
        </form>
      </Panel>
    </>
  );
}
