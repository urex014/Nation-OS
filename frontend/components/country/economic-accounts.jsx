import React from "react";
import economy from "../../lib/domain/economy-engine.cjs";
import { accounts, money } from "../../lib/client/country.mjs";
import { DataTable, Note, Panel } from "../ui/primitives";

export function EconomicAccounts({ scope = "all" }) {
  const record =
    scope === "all" ? economy.baseline : accounts.states.find((state) => state.id === scope);
  const rows = [
    ["GDP", money(record.gdp)],
    ["Real GDP growth", `${record.realGrowth.toFixed(1)}%`],
    ["Consumer inflation", `${record.inflation.toFixed(1)}%`],
    ["Unemployment", `${record.unemployment.toFixed(1)}%`],
    ["Annual revenue", money(record.revenue)],
    ["Annual spending", money(record.spending)],
    ["Budget deficit", money(record.spending - record.revenue)],
    ["Public debt", money(record.debt)],
    ["Exports", money(record.exports)],
    ["Imports", money(record.imports)],
  ];
  return (
    <Panel title={scope === "all" ? "National economic accounts" : "State economic accounts"}>
      <DataTable headers={["Indicator", "Illustrative value"]}>
        {rows.map(([label, value]) => (
          <tr key={label}>
            <td>{label}</td>
            <td>{value}</td>
          </tr>
        ))}
      </DataTable>
      <Note>
        Annual accounts in millions of Aderin naira. GDP is economic output, not government cash.
        Resource receipts are already included in revenue.
      </Note>
    </Panel>
  );
}
