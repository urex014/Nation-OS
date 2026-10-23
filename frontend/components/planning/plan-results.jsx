import React, { useState } from "react";
import { definitions, money, number } from "../../lib/client/country.mjs";
import { DataTable, Field, Note, Panel, Stats } from "../ui/primitives";
import { ProjectionChart } from "./projection-chart";

export function PlanResults({ result }) {
  const [sector, setSector] = useState("education");
  const end = result.years.at(-1);
  return (
    <div className="space-y-6">
      <Stats
        items={[
          ["Annual investment", money(result.annualCost), "Real 2026 prices"],
          ["Horizon cost", money(result.totalCost), `${result.config.years}-year package`],
          ["Scope population", number(result.scopePopulation), "Baseline residents"],
          [
            "Extra borrowing / year",
            money(result.fiscal.supplemental),
            "Above national planning envelope",
          ],
        ]}
      />
      <Panel title="Service scenarios">
        <Field label="Indicator chart">
          <select value={sector} onChange={(event) => setSector(event.target.value)}>
            {Object.entries(definitions).map(([key, definition]) => (
              <option key={key} value={key}>
                {definition.metric}
              </option>
            ))}
          </select>
        </Field>
        <ProjectionChart result={result} sector={sector} />
        <DataTable
          headers={[
            "National endpoint",
            "No investment",
            "With investment",
            "Lower delivery",
            "Higher delivery",
          ]}
        >
          {Object.entries(definitions).map(([key, definition]) => (
            <tr key={key}>
              <td>{definition.metric}</td>
              {["no", "with", "low", "high"].map((path) => (
                <td key={path}>
                  {number(end.national[key][path], 2)}
                  {definition.unit}
                </td>
              ))}
            </tr>
          ))}
        </DataTable>
      </Panel>
      <Panel title="Annual roadmap & fiscal outlook">
        <DataTable
          headers={["Year", "Investment", "Cumulative", "National deficit", "National debt"]}
        >
          {result.years.map((year, index) => (
            <tr key={year.year}>
              <td>{year.year}</td>
              <td>{money(year.annualCost)}</td>
              <td>{money(year.cumulativeCost)}</td>
              <td>{money(result.fiscal.rows[index].deficit)}</td>
              <td>{money(result.fiscal.rows[index].debt)}</td>
            </tr>
          ))}
        </DataTable>
        <Note>
          Year 2026 is the baseline. Milestones: validate evidence and procurement before delivery;
          review implementation quarterly and indicator results annually. These milestones do not
          record actual progress.
        </Note>
      </Panel>
      <Note>
        {result.limitations.join(". ")}. Fiscal results compare the national treasury for every
        scope; no policy-driven GDP or job return is assumed.
      </Note>
    </div>
  );
}
