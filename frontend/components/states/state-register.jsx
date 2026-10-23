"use client";
import React, { useState } from "react";
import {
  states,
  planningStates,
  zones,
  accounts,
  definitions,
  number,
  money,
} from "../../lib/client/country.mjs";
import { Heading, Panel, Field, DataTable, Button } from "../ui/primitives";
import { EconomicAccounts } from "../country/economic-accounts";

export function StateRegister() {
  const [query, setQuery] = useState("");
  const [zone, setZone] = useState("all");
  const [selected, setSelected] = useState(null);
  const filtered = states.filter(
    (state) =>
      state.name.toLowerCase().includes(query.toLowerCase()) &&
      (zone === "all" || state.zone === zone),
  );
  return (
    <>
      <Heading eyebrow="Jurisdiction register" title="States & territories">
        Inspect all 36 states and the capital territory. Population, economic output and service
        indicators vary across jurisdictions.
      </Heading>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Search states">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="State name"
          />
        </Field>
        <Field label="Zone">
          <select value={zone} onChange={(event) => setZone(event.target.value)}>
            <option value="all">All zones</option>
            {zones.map((item) => (
              <option key={item.name}>{item.name}</option>
            ))}
          </select>
        </Field>
      </div>
      <Panel title={`${filtered.length} jurisdictions`}>
        <DataTable headers={["State / territory", "Zone", "Population", "GDP", "Profile"]}>
          {filtered.map((state) => (
            <tr key={state.id}>
              <td>
                {state.name}
                <p className="mt-1 text-xs text-stone-500">{state.capital}</p>
              </td>
              <td>{state.zone}</td>
              <td>{number(state.citizenCount)}</td>
              <td>{money(accounts.states.find((item) => item.id === state.id).gdp)}</td>
              <td>
                <Button onClick={() => setSelected(state)}>View profile</Button>
              </td>
            </tr>
          ))}
        </DataTable>
        {!filtered.length && <p>No jurisdictions match your filters.</p>}
      </Panel>
      {selected && (
        <section aria-label={`${selected.name} profile`} className="space-y-6">
          <Panel
            title={selected.name}
            action={<Button onClick={() => setSelected(null)}>Close profile</Button>}
          >
            <p className="text-sm leading-7">{selected.desc}</p>
            <DataTable headers={["Public-service indicator", "Baseline"]}>
              {Object.entries(definitions).map(([key, definition]) => (
                <tr key={key}>
                  <td>{definition.metric}</td>
                  <td>
                    {planningStates.find((item) => item.id === selected.id).baselines[key]}
                    {definition.unit}
                  </td>
                </tr>
              ))}
            </DataTable>
          </Panel>
          <EconomicAccounts scope={selected.id} />
        </section>
      )}
    </>
  );
}
