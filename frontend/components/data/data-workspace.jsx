"use client";
import React, { useState } from "react";
import { states, number } from "../../lib/client/country.mjs";
import {
  createMonthlyData,
  parseMonthlyCsv,
  forecastSeries,
} from "../../lib/client/series-model.mjs";
import { downloadJson } from "../../lib/client/download.mjs";
import { Button, DataTable, Field, Heading, Note, Panel } from "../ui/primitives";

export function DataWorkspace() {
  const [rows, setRows] = useState(() => createMonthlyData(states));
  const [scope, setScope] = useState(states[0].id),
    [horizon, setHorizon] = useState(6),
    [fuel, setFuel] = useState(0);
  const [message, setMessage] = useState("");
  const selected = rows.filter((row) => row.stateId === scope);
  let result, error;
  try {
    result = forecastSeries(selected, horizon, fuel);
  } catch (failure) {
    error = failure.message;
  }
  async function importCsv(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      if (file.size > 1000000) throw Error("CSV must be under 1 MB.");
      const parsed = parseMonthlyCsv(await file.text(), states);
      setRows(parsed);
      setScope(parsed[0].stateId);
      setMessage("CSV validated and loaded for this page session only.");
    } catch (failure) {
      setMessage(failure.message);
    }
  }
  return (
    <>
      <Heading eyebrow="Data & models" title="Inspect inputs. Test assumptions.">
        Run an ordinary least-squares trend experiment against monthly synthetic basket prices.
        Imported data does not overwrite canonical evidence.
      </Heading>
      <Panel title="Dataset workspace">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Jurisdiction">
            <select value={scope} onChange={(event) => setScope(event.target.value)}>
              {states.map((state) => (
                <option key={state.id} value={state.id}>
                  {state.name}
                </option>
              ))}
            </select>
          </Field>
          <Field
            label="Import experimental CSV"
            hint="Header: stateId,month,basket,freight,rainfall. Plain unquoted fields; maximum 1 MB."
          >
            <input type="file" accept=".csv,text/csv" onChange={importCsv} />
          </Field>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => downloadJson("nationos-monthly-data.json", rows)}>
            Export observations
          </Button>
          <Button
            onClick={() => {
              setRows(createMonthlyData(states));
              setMessage("Synthetic dataset restored.");
            }}
          >
            Restore synthetic data
          </Button>
        </div>
        {message && <Note>{message}</Note>}
        <DataTable headers={["Month", "Basket price (Aâ‚¦)", "Freight index", "Rainfall (mm)"]}>
          {selected.slice(-12).map((row) => (
            <tr key={row.month}>
              <td>{row.month}</td>
              <td>{number(row.basket)}</td>
              <td>{row.freight}</td>
              <td>{row.rainfall}</td>
            </tr>
          ))}
        </DataTable>
      </Panel>
      <Panel title="Trend & fuel sensitivity">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Forecast months">
            <select value={horizon} onChange={(event) => setHorizon(Number(event.target.value))}>
              {[3, 6, 12].map((value) => (
                <option key={value}>{value}</option>
              ))}
            </select>
          </Field>
          <Field label="Fuel shock (%)">
            <input
              type="number"
              min="-50"
              max="100"
              value={fuel}
              onChange={(event) => setFuel(Number(event.target.value))}
            />
          </Field>
        </div>
        {error ? (
          <Note error>{error}</Note>
        ) : (
          <>
            <p className="text-sm">
              Training rows: {result.training} Â· held-out months: {result.holdout} Â· holdout mean
              absolute error: Aâ‚¦ {number(result.mae)}
            </p>
            <DataTable headers={["Forecast month", "Trend baseline", "Fuel sensitivity"]}>
              {result.forecast.map((row) => (
                <tr key={row.month}>
                  <td>{row.month}</td>
                  <td>Aâ‚¦ {number(row.baseline)}</td>
                  <td>Aâ‚¦ {number(row.stressed)}</td>
                </tr>
              ))}
            </DataTable>
          </>
        )}
        <Note>
          Last three observations are withheld for evaluation; the future trend refits all
          observations. The 0.25 fuel pass-through coefficient is illustrative. This is not a causal
          or validated forecast, and no language model calculates these numbers.
        </Note>
      </Panel>
    </>
  );
}
