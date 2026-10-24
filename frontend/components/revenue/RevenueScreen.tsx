import { formatNaira, millionToNaira } from "@/lib/format/money";
import type { Revenue } from "@/lib/types";

export function RevenueScreen({ data }: { data: Revenue }) {
  const tiers = [
    ["Federal", data.tiers.federal],
    ["States", data.tiers.states],
    ["Local", data.tiers.local],
  ] as const;
  const receiptTotal = data.sources.reduce((sum, source) => sum + source.amount, 0);

  return (
    <>
      <div className="kpi-frame kpi-frame-four">
        <section className="kpi-grid" aria-label="Vertical split">
          <article className="kpi kpi-hero">
            <p className="kpi-label">Derived pool</p>
            <p className="kpi-value">{formatNaira(millionToNaira(data.distributablePool))}</p>
            <p className="kpi-detail">
              States gross divided by 26.72%. Not a published FAAC total.
            </p>
          </article>
          {tiers.map(([label, amount]) => (
            <article className="kpi" key={label}>
              <p className="kpi-label">{label}</p>
              <p className="kpi-value">{formatNaira(millionToNaira(amount))}</p>
              <p className="kpi-detail">
                {((amount / data.distributablePool) * 100).toFixed(2)}% of the derived pool
              </p>
            </article>
          ))}
        </section>
      </div>
      <section className="panel">
        <h2 className="eyebrow">Published receipts to states</h2>
        <p className="quiet">
          January–September 2026 statutory ₦4.92tn and VAT ₦3.51tn to the 36 states. These amounts
          are not a split of the derived pool.
        </p>
        <div className="stack">
          {data.sources.map((source) => (
            <div className="priority" key={source.id}>
              <div className="priority-row">
                <strong>{source.name}</strong>
                <span>{formatNaira(millionToNaira(source.amount))}</span>
              </div>
              <div className="meter" aria-hidden="true">
                <span
                  style={{
                    width: `${receiptTotal === 0 ? 0 : (source.amount / receiptTotal) * 100}%`,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </section>
      <section className="panel">
        <h2 className="eyebrow" id="state-table-label">
          36-state distribution
        </h2>
        <p className="quiet">
          Published January–September 2026 gross FAAC. Every state amount is from Agora Policy’s 21
          October 2026 ranking. The FCT is not in the table. No estimates.
        </p>
        <div className="table-wrap" tabIndex={0} role="region" aria-labelledby="state-table-label">
          <table className="data">
            <thead>
              <tr>
                <th>State</th>
                <th>Zone</th>
                <th>Population</th>
                <th>Share</th>
                <th>Allocation</th>
                <th>Basis</th>
              </tr>
            </thead>
            <tbody>
              {data.stateAllocations.map((state) => (
                <tr key={state.id}>
                  <td data-label="State">{state.name}</td>
                  <td data-label="Zone">{state.zone}</td>
                  <td data-label="Population">
                    {state.population == null
                      ? "Not loaded"
                      : state.population.toLocaleString("en-NG")}
                  </td>
                  <td data-label="Share">{state.sharePercent}%</td>
                  <td data-label="Allocation">
                    {formatNaira(millionToNaira(state.allocationAmount))}
                  </td>
                  <td data-label="Basis">
                    <span className="badge">Published</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
