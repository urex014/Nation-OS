import React, { useState } from "react";
import { commerce } from "../../lib/client/commerce.mjs";
import { states, money } from "../../lib/client/country.mjs";
import { Button, DataTable, Field, Panel } from "../ui/primitives";

// Filtering scans only the 24,600 firms. Citizens remain generated on demand.
const businesses = Array.from({ length: commerce.totalBusinesses }, (_, index) =>
  commerce.business(index),
);
export function BusinessRegister() {
  const [scope, setScope] = useState("all"),
    [ownership, setOwnership] = useState("all"),
    [page, setPage] = useState(0);
  const [selected, setSelected] = useState(null);
  const filtered = businesses.filter(
    (firm) =>
      (scope === "all" || firm.stateId === scope) &&
      (ownership === "all" || firm.ownership === ownership),
  );
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Operating state">
          <select
            value={scope}
            onChange={(event) => {
              setScope(event.target.value);
              setPage(0);
            }}
          >
            <option value="all">All states</option>
            {states.map((state) => (
              <option key={state.id} value={state.id}>
                {state.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Ownership control">
          <select
            value={ownership}
            onChange={(event) => {
              setOwnership(event.target.value);
              setPage(0);
            }}
          >
            {["all", "Domestic-controlled", "Foreign-controlled", "Joint control"].map((value) => (
              <option key={value} value={value}>
                {value === "all" ? "All ownership types" : value}
              </option>
            ))}
          </select>
        </Field>
      </div>
      <Panel title={`${filtered.length.toLocaleString()} registered firms`}>
        <DataTable headers={["Business", "State", "Ownership", "Employees", "Turnover", "Profile"]}>
          {filtered.slice(page * 20, page * 20 + 20).map((firm) => (
            <tr key={firm.id}>
              <td>{firm.name}</td>
              <td>{firm.state}</td>
              <td>{firm.ownership}</td>
              <td>{firm.employees}</td>
              <td>{money(firm.annualTurnoverMillions)}</td>
              <td>
                <Button onClick={() => setSelected(firm)}>Inspect</Button>
              </td>
            </tr>
          ))}
        </DataTable>
        <div className="flex justify-between">
          <Button disabled={!page} onClick={() => setPage(page - 1)}>
            Previous
          </Button>
          <Button disabled={(page + 1) * 20 >= filtered.length} onClick={() => setPage(page + 1)}>
            Next
          </Button>
        </div>
      </Panel>
      {selected && (
        <Panel
          title={selected.name}
          action={<Button onClick={() => setSelected(null)}>Close</Button>}
        >
          <DataTable headers={["Attribute", "Value"]}>
            {Object.entries(selected).map(([key, value]) => (
              <tr key={key}>
                <td>{key}</td>
                <td>{String(value)}</td>
              </tr>
            ))}
          </DataTable>
        </Panel>
      )}
    </>
  );
}
