"use client";
import React, { useMemo, useState } from "react";
import engine from "../../lib/domain/citizen-engine.cjs";
import register from "../../data/citizen-states.cjs";
import { number } from "../../lib/client/country.mjs";
import { downloadJson } from "../../lib/client/download.mjs";
import { Heading, Panel, Field, DataTable, Button, Note, Stats } from "../ui/primitives";

const jurisdictions = engine.prepare(register);
export function CitizenRegister() {
  const [scope, setScope] = useState("all"),
    [page, setPage] = useState(0);
  const [id, setId] = useState(""),
    [selected, setSelected] = useState(null),
    [error, setError] = useState("");
  const state = jurisdictions.find((item) => item.id === scope);
  const count = state?.count || 24600000,
    offset = state?.offset || 0;
  const rows = useMemo(
    () =>
      Array.from({ length: Math.min(20, count - page * 20) }, (_, index) =>
        engine.citizen(offset + page * 20 + index, jurisdictions),
      ),
    [count, offset, page],
  );
  function findCitizen(event) {
    event.preventDefault();
    setError("");
    if (!/^AD-C-\d{8}$/.test(id)) return setError("Use an ID such as AD-C-00000001.");
    try {
      setSelected(engine.citizen(Number(id.slice(5)) - 1, jurisdictions));
    } catch {
      setError("Citizen ID is outside the generated register.");
    }
  }
  return (
    <>
      <Heading
        eyebrow="Synthetic population"
        title="Population register"
        action={
          <Button
            onClick={() =>
              downloadJson(
                "citizens-sample.json",
                Array.from({ length: Math.min(1000, count) }, (_, index) =>
                  engine.citizen(offset + index, jurisdictions),
                ),
              )
            }
          >
            Export 1,000 records
          </Button>
        }
      >
        Browse a reproducible fictional record for every resident of Aderin.
      </Heading>
      <Note>
        All records are fictional and generated on demand. Demographics are illustrative, not
        calibrated survey estimates. Religion is never used for scoring or allocation.
      </Note>
      <Stats
        items={[
          ["Population coverage", "24.6M", "Unique generated IDs"],
          ["Jurisdictions", "37", "36 states + capital"],
          ["Households", "Up to 4", "Synthetic groups per state"],
          ["Generator", engine.version, "Fixed seed / reference year 2026"],
        ]}
      />
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="State / territory">
          <select
            value={scope}
            onChange={(event) => {
              setScope(event.target.value);
              setPage(0);
            }}
          >
            {jurisdictions.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
            <option value="all">All states & territories</option>
          </select>
        </Field>
        <form onSubmit={findCitizen} className="flex items-end gap-2">
          <Field label="Find citizen ID">
            <input
              value={id}
              onChange={(event) => setId(event.target.value)}
              placeholder="AD-C-00000001"
            />
          </Field>
          <Button type="submit">Find</Button>
        </form>
      </div>
      {error && <Note error>{error}</Note>}
      <Panel title={`${number(count)} generated records`}>
        <DataTable headers={["Citizen", "Age", "State", "Employment", "Detail"]}>
          {rows.map((citizen) => (
            <tr key={citizen.id}>
              <td>
                {citizen.name}
                <p className="text-xs text-stone-500">{citizen.id}</p>
              </td>
              <td>{citizen.age}</td>
              <td>{citizen.state}</td>
              <td>{citizen.employmentStatus}</td>
              <td>
                <Button onClick={() => setSelected(citizen)}>Inspect</Button>
              </td>
            </tr>
          ))}
        </DataTable>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Button disabled={!page} onClick={() => setPage(page - 1)}>
            Previous
          </Button>
          <p className="text-xs">
            Page {number(page + 1)} of {number(Math.ceil(count / 20))}
          </p>
          <Button disabled={(page + 1) * 20 >= count} onClick={() => setPage(page + 1)}>
            Next
          </Button>
        </div>
      </Panel>
      {selected && (
        <Panel
          title={selected.name}
          action={<Button onClick={() => setSelected(null)}>Close profile</Button>}
        >
          <DataTable headers={["Attribute", "Synthetic value"]}>
            {Object.entries(selected).map(([key, value]) => (
              <tr key={key}>
                <td>{key}</td>
                <td>{value === null ? "Not applicable" : String(value)}</td>
              </tr>
            ))}
          </DataTable>
        </Panel>
      )}
    </>
  );
}
