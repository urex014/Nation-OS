"use client";
import { useState } from "react";
import { request } from "../../lib/nigeria/client.mjs";
import { naira, number } from "../../lib/nigeria/format.mjs";
import { Heading, Card, Field, Button, Notice, Source } from "./ui";
import { SideScroll } from "./side-scroll";
import { Trend } from "./trend";
export function Revenue({ initial, jurisdictions }) {
  const [data, setData] = useState(initial),
    [year, setYear] = useState(initial.revenue.year),
    [scope, setScope] = useState("NG-LA"),
    [compare, setCompare] = useState("NG-RI"),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  async function load() {
    setBusy(true);
    setError("");
    try {
      setData(await request(`revenue?year=${year}&scope=${scope}&compare=${compare}`));
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  const revenue = data.revenue;
  return (
    <>
      <Heading eyebrow="Money in" title="What the states collected">
        Compare published collections over time. Amounts are in the naira of that year. Inflation,
        the size of the economy, and population all change what a comparison means.
      </Heading>
      <Card title="Choose a comparison">
        <div className="grid items-end gap-4 lg:grid-cols-4">
          <Field label="Reporting year">
            <select value={year} onChange={(e) => setYear(e.target.value)}>
              {revenue.years.map((y) => (
                <option key={y}>{y}</option>
              ))}
            </select>
          </Field>
          {[
            [scope, setScope, "First place"],
            [compare, setCompare, "Compare with"],
          ].map(([value, set, label]) => (
            <Field key={label} label={label}>
              <select value={value} onChange={(e) => set(e.target.value)}>
                {jurisdictions.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </Field>
          ))}
          <Button disabled={busy} onClick={load}>
            {busy ? "Loading…" : "Update comparison"}
          </Button>
        </div>
        {error && <Notice error>{error}</Notice>}
      </Card>
      <div className="my-6 grid gap-6 md:grid-cols-2">
        {[
          ["history", data.scope],
          ["comparison", data.compare],
        ].map(([key, id]) => (
          <Card
            key={key}
            title={jurisdictions.find((s) => s.id === id)?.name || "All jurisdictions"}
          >
            <Trend rows={data[key] || []} />
          </Card>
        ))}
      </div>
      <Notice>
        {revenue.note} To understand why another state collects less, you need evidence about its
        tax base, how it collects, and its services. These totals alone can’t explain the gap.
      </Notice>
      <Card className="mt-6" title={`State and FCT collections · ${revenue.year}`}>
        <p className="mb-4 text-sm">
          Combined IGR (money states raise themselves): <strong>{naira(revenue.totalNaira)}</strong>{" "}
          · 37 places
        </p>
        <SideScroll>
          <table className="w-full min-w-[40rem] text-sm">
            <thead>
              <tr>
                {[
                  "Rank",
                  "Jurisdiction",
                  "Total IGR",
                  "Tax",
                  "Other collections",
                  "Annual change",
                  "Share",
                ].map((h) => (
                  <th key={h}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {revenue.states.map((s) => (
                <tr key={s.id}>
                  <td>{s.rank}</td>
                  <td className="font-medium">{s.name}</td>
                  <td>{naira(s.totalNaira)}</td>
                  <td>{naira(s.taxNaira)}</td>
                  <td>{naira(s.otherNaira)}</td>
                  <td>{number(s.growthPercent)}%</td>
                  <td>{number(s.nationalSharePercent)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </SideScroll>
        <p className="my-4 text-xs text-stone-500">
          Other collections keep the NBS label for that year, and those labels can change. Missing
          cells are not zero.
        </p>
        <Source id={revenue.sourceId} />
      </Card>
    </>
  );
}
