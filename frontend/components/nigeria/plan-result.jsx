import { Card, Stat, Notice, Source } from "./ui";
import { SideScroll } from "./side-scroll";
import { naira, number } from "../../lib/nigeria/format.mjs";
import { SECTORS } from "../../lib/nigeria/constants.mjs";
// The complete server result is visible, including limitations and review milestones.
export function PlanResult({ result }) {
  return (
    <div className="mt-6 space-y-6">
      <div className="grid gap-4 lg:grid-cols-3">
        <Stat
          label="Total nominal investment"
          value={naira(result.totals.nominalNaira)}
          note={`A ${result.config.years}-year guess, not a promise`}
        />
        <Stat
          label="Constant-price investment"
          value={naira(result.totals.constantPriceNaira)}
          note={`In ${result.config.startYear} buying power`}
        />
        <Stat
          label="Delivery-adjusted capital"
          value={naira(result.totals.deliveryAdjustedCapitalNaira)}
          note="A money figure, not finished projects"
        />
      </div>
      <Notice>
        {result.context.name}: published {result.context.revenueYear} IGR (money raised){" "}
        {naira(result.context.referenceRevenueNaira)}. {result.context.warning}
      </Notice>
      {result.flags.map((f) => (
        <Notice key={f}>{f}</Notice>
      ))}
      {result.alternatives?.length ? (
        <Card title="Other ways to do this">
          {result.alternatives.map((item) => (
            <p key={item.id || item.title} className="border-b border-stone-100 py-2 text-sm">
              {item.best ? "Best fit: " : ""}
              {item.title}. {item.summary} {item.tradeoff}
            </p>
          ))}
          {result.bestReason ? <p className="pt-2 text-sm">{result.bestReason}</p> : null}
        </Card>
      ) : null}
      <Card title="Annual investment path">
        <SideScroll>
          <table className="w-full min-w-[44rem] text-sm">
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
        </SideScroll>
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
          These are the first-year amounts. Later years keep the same shares as the total changes.
          The weights are a preference. We haven’t measured how each sector would change services.
        </p>
      </Card>
      <Card title="How we worked this out">
        <ul className="space-y-3 text-sm">
          {result.formulas.map((f) => (
            <li key={f}>{f}</li>
          ))}
        </ul>
        <p className="my-4 text-xs text-stone-500">
          t is the number of years after the first planning year. Percentages are turned into
          fractions. Model: {result.version}.
        </p>
        <Source id={result.context.sourceId} />
      </Card>
      <div className="grid gap-6 md:grid-cols-2">
        <Card title="What to check later">
          <ol className="list-inside list-decimal space-y-3 text-sm leading-6">
            {result.roadmap.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ol>
        </Card>
        <Card title="What this can't tell you">
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
