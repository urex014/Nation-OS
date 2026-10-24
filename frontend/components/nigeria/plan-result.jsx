import { Card, Stat, Notice, Source } from "./ui";
import { naira, number } from "../../lib/nigeria/format.mjs";
import { SECTORS } from "../../lib/nigeria/constants.mjs";
// The complete server result is visible, including limitations and review milestones.
export function PlanResult({ result }) {
  return (
    <div className="mt-6 space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Stat
          label="Total nominal investment"
          value={naira(result.totals.nominalNaira)}
          note={`${result.config.years}-year commitment assumption`}
        />
        <Stat
          label="Constant-price investment"
          value={naira(result.totals.constantPriceNaira)}
          note={`In ${result.config.startYear} purchasing power`}
        />
        <Stat
          label="Delivery-adjusted capital"
          value={naira(result.totals.deliveryAdjustedCapitalNaira)}
          note="Monetary proxy, not completed projects"
        />
      </div>
      <Notice>
        {result.context.name}: observed {result.context.revenueYear} IGR{" "}
        {naira(result.context.referenceRevenueNaira)}. {result.context.warning}
      </Notice>
      {result.flags.map((f) => (
        <Notice key={f}>{f}</Notice>
      ))}
      <Card title="Annual investment path">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr>
                {[
                  "Year",
                  "Nominal budget",
                  "Constant-price budget",
                  "Maintenance",
                  "Delivery-adjusted capital",
                  "Projected IGR",
                  "Investment / IGR",
                ].map((h) => (
                  <th key={h}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {result.annual.map((r) => (
                <tr key={r.year}>
                  <td>{r.year}</td>
                  <td>{naira(r.nominalNaira)}</td>
                  <td>{naira(r.constantPriceNaira)}</td>
                  <td>{naira(r.maintenanceNaira)}</td>
                  <td>{naira(r.deliveryAdjustedCapitalNaira)}</td>
                  <td>{naira(r.projectedIgrNaira)}</td>
                  <td>{number(r.investmentToIgrPercent)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      <Card title="Sector allocation">
        <div className="grid gap-3 sm:grid-cols-2">
          {Object.entries(result.config.allocations).map(([key, value]) => (
            <p key={key} className="flex justify-between border-b border-stone-100 py-2 text-sm">
              <span>{SECTORS[key]}</span>
              <strong>{naira(value)}</strong>
            </p>
          ))}
        </div>
        <p className="mt-4 text-xs text-stone-500">
          First-year allocations. Later allocations retain these proportions as the total budget
          changes. Sector weights express a preference; sector-specific service effects have not
          been estimated.
        </p>
      </Card>
      <Card title="How this was calculated">
        <ul className="space-y-3 text-sm">
          {result.formulas.map((f) => (
            <li key={f}>{f}</li>
          ))}
        </ul>
        <p className="my-4 text-xs text-stone-500">
          t = years since the first planning year; percentage inputs are converted to fractions.
          Model: {result.version}.
        </p>
        <Source id={result.context.sourceId} />
      </Card>
      <div className="grid gap-6 md:grid-cols-2">
        <Card title="Review roadmap">
          <ol className="list-inside list-decimal space-y-3 text-sm leading-6">
            {result.roadmap.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ol>
        </Card>
        <Card title="Limits of this model">
          <ul className="space-y-3 text-sm leading-6">
            {result.limitations.map((l) => (
              <li key={l}>{l}</li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}
