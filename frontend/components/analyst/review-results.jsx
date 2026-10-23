import React from "react";
import { definitions, number, money } from "../../lib/client/country.mjs";
import { DataTable, Note, Panel } from "../ui/primitives";

export function ReviewResults({ review }) {
  const keys = Object.keys(review.input.budgets).filter((key) => review.input.budgets[key] > 0);
  return (
    <Panel title="Conditional stress scenarios">
      <p className="text-sm">
        {review.input.years} years Â· scope {review.input.scope} Â·{" "}
        {money(review.cases[0].annualCost)} per year
      </p>
      <DataTable headers={["Scenario", ...keys.map((key) => definitions[key].metric)]}>
        {review.cases.map((item) => (
          <tr key={item.label}>
            <td>{item.label}</td>
            {keys.map((key) => (
              <td key={key}>
                {number(item.end[key].with, 2)}
                {definitions[key].unit}
              </td>
            ))}
          </tr>
        ))}
      </DataTable>
      <h3>Suggested monitoring plan</h3>
      {review.monitoring.map((item) => (
        <article key={item.sector} className="border-l-2 border-stone-200 pl-4 text-sm leading-7">
          <h3>{item.indicator}</h3>
          <p>{item.cadence}</p>
          <p>Evidence: {item.evidence}</p>
          <p>{item.trigger}</p>
        </article>
      ))}
      <Note>
        Each case changes one assumption. These are national endpoint levels, not probabilities. No
        measured progress has been supplied.
      </Note>
    </Panel>
  );
}
