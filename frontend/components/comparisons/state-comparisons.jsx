"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import engine from "../../lib/domain/comparison-engine.cjs";
import { planningStates, definitions, number, defaultPlan } from "../../lib/client/country.mjs";
import { useWorkspace } from "../workspace/provider";
import { Button, DataTable, Field, Heading, Note, Panel } from "../ui/primitives";

export function StateComparisons() {
  const [capital, setCapital] = useState(true),
    [metric, setMetric] = useState("overall");
  const [left, setLeft] = useState(planningStates[0].id),
    [right, setRight] = useState(planningStates.at(-1).id);
  const [years, setYears] = useState(5);
  const { setDraft } = useWorkspace();
  const router = useRouter();
  const rows = engine.rank(planningStates, engine.defaults, metric, capital);
  const priorities = engine.improvements(planningStates, left).slice(0, 3);
  function draftPlan() {
    const total = priorities.reduce((sum, item) => sum + item.priority, 0);
    const budgets = Object.fromEntries(Object.keys(definitions).map((key) => [key, 0]));
    priorities.forEach((item) => {
      budgets[item.sector] = total ? (100 * item.priority) / total : 0;
    });
    setDraft({
      title: `Service improvement in ${planningStates.find((state) => state.id === left).name}`,
      reason: "Prioritize weighted service shortfalls; verify peer evidence before implementation.",
      origin: "State comparison draft",
      config: { ...defaultPlan, scope: left, years, budgets },
      comparisonProvenance: { method: engine.version, priorities },
    });
    router.push("/recommendations");
  }
  return (
    <>
      <Heading eyebrow="Comparative analysis" title="How do the states compare?">
        Identify strong indicators and service gaps. A high score describes the selected metrics; it
        does not prove that a government caused those results.
      </Heading>
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Rank by">
          <select value={metric} onChange={(event) => setMetric(event.target.value)}>
            <option value="overall">Overall service score</option>
            {Object.entries(definitions).map(([key, definition]) => (
              <option key={key} value={key}>
                {definition.name}
              </option>
            ))}
          </select>
        </Field>
        <label className="flex items-center gap-3 text-sm">
          <input
            type="checkbox"
            checked={capital}
            onChange={(event) => setCapital(event.target.checked)}
          />
          Include capital territory
        </label>
      </div>
      <Panel title={`Highest selected score: ${rows[0].name}`}>
        <Note>
          Equal sector weights. Higher-is-better indicators use baseline / target; lower-is-better
          indicators use target / baseline, capped at 100. Population, GDP and religion are excluded
          from scoring.
        </Note>
        <DataTable headers={["Rank", "Jurisdiction", "Score / 100", "Population"]}>
          {rows.map((state) => (
            <tr key={state.id}>
              <td>{state.rank}</td>
              <td>{state.name}</td>
              <td>{number(state.score, 1)}</td>
              <td>{number(state.population)}</td>
            </tr>
          ))}
        </DataTable>
      </Panel>
      <Panel title="Compare two jurisdictions">
        <div className="grid gap-4 sm:grid-cols-2">
          {[
            [left, setLeft, "State to improve"],
            [right, setRight, "Comparison state"],
          ].map(([value, setter, label]) => (
            <Field key={label} label={label}>
              <select value={value} onChange={(event) => setter(event.target.value)}>
                {planningStates.map((state) => (
                  <option key={state.id} value={state.id}>
                    {state.name}
                  </option>
                ))}
              </select>
            </Field>
          ))}
        </div>
        <DataTable headers={["Indicator", "State to improve", "Comparison state"]}>
          {Object.entries(definitions).map(([key, definition]) => (
            <tr key={key}>
              <td>{definition.metric}</td>
              {[left, right].map((id, index) => (
                <td key={index}>
                  {planningStates.find((state) => state.id === id).baselines[key]}
                  {definition.unit}
                </td>
              ))}
            </tr>
          ))}
        </DataTable>
      </Panel>
      <Panel title="Improvement opportunities">
        {priorities.map((item) => (
          <div key={item.sector}>
            <h3>{definitions[item.sector].name}</h3>
            <p className="mt-2 text-sm leading-7">
              Gap to illustrative target: {number(item.gap, 1)} {definitions[item.sector].unit}.{" "}
              {item.peer
                ? `Investigate ${item.peer.name}, whose baseline is ${item.peer.baseline}${definitions[item.sector].unit}.`
                : "No stronger peer identified."}{" "}
              A peer difference is a research lead, not proof of a transferable policy.
            </p>
          </div>
        ))}
        <Field label="Draft horizon">
          <select value={years} onChange={(event) => setYears(Number(event.target.value))}>
            <option value={5}>5 years</option>
            <option value={10}>10 years</option>
          </select>
        </Field>
        <Button primary onClick={draftPlan}>
          Draft a 100M/year improvement package
        </Button>
      </Panel>
    </>
  );
}
