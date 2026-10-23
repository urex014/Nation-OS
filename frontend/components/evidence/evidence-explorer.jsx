"use client";
import React, { useState } from "react";
import { states } from "../../lib/client/country.mjs";
import { DataTable, Field, Heading, Note, Panel } from "../ui/primitives";

export function EvidenceExplorer({ sources }) {
  const [query, setQuery] = useState(""),
    [scope, setScope] = useState("all");
  const filtered = sources.filter(
    (source) =>
      (scope === "all" || source.scope === scope || source.scope === "all") &&
      `${source.title} ${source.summary}`.toLowerCase().includes(query.toLowerCase()),
  );
  return (
    <>
      <Heading eyebrow="Evidence explorer" title="Follow the evidence">
        Inspect the same canonical aggregate records used by the analyst. Separate source facts from
        hypotheses and conditional model outputs.
      </Heading>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Search evidence">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Education, transport, moneyâ€¦"
          />
        </Field>
        <Field label="Evidence scope">
          <select value={scope} onChange={(event) => setScope(event.target.value)}>
            <option value="all">Whole country</option>
            {states.map((state) => (
              <option key={state.id} value={state.id}>
                {state.name}
              </option>
            ))}
          </select>
        </Field>
      </div>
      <Note>
        All records are synthetic. International effectiveness studies and measured project outcomes
        are not included. A baseline gap alone does not establish its cause.
      </Note>
      <Panel title={`${filtered.length} source records`}>
        <DataTable headers={["Reference", "Evidence / assumption"]}>
          {filtered.map((source) => (
            <tr key={source.id}>
              <td>
                <span className="text-xs">{source.id}</span>
                <p className="mt-1 text-xs text-stone-500">{source.period}</p>
              </td>
              <td>
                <h3>{source.title}</h3>
                <p className="my-3 max-w-3xl text-sm leading-7">{source.summary}</p>
                <details>
                  <summary className="text-xs text-accent">Inspect values</summary>
                  <pre className="mt-3 max-h-64 overflow-auto text-xs">
                    {JSON.stringify(source.values, null, 2)}
                  </pre>
                </details>
              </td>
            </tr>
          ))}
        </DataTable>
      </Panel>
    </>
  );
}
