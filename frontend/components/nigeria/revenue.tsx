import { formatNaira, millionToNaira } from "@/lib/format/money";
import type { Revenue as RevenueData } from "@/lib/types";
import { Card, Heading, Notice, Source, Stat } from "./ui";

export function Revenue({ data }: { data: RevenueData }) {
  const tiers = [
    ["Federal", data.tiers.federal],
    ["States", data.tiers.states],
    ["Local", data.tiers.local],
  ] as const;
  const receiptTotal = data.sources.reduce((sum, source) => sum + source.amount, 0);

  return (
    <>
      <Heading eyebrow="Budget & Revenue" title="Understand the FAAC base">
        Published January–September 2026 gross FAAC to the 36 states, then a calculated three-way
        split at federal 52.68%, states 26.72%, local 20.60%.
      </Heading>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat
          label="Calculated pool"
          value={formatNaira(millionToNaira(data.distributablePool))}
          note="States gross divided by 26.72%. FAAC did not print this pool."
        />
        {tiers.map(([label, amount]) => (
          <Stat
            key={label}
            label={label}
            value={formatNaira(millionToNaira(amount))}
            note={`${((amount / data.distributablePool) * 100).toFixed(2)}% of the calculated pool`}
          />
        ))}
      </div>
      <p className="mt-3">
        <Source id="verticalFormula">NBS FAAC formula</Source>
      </p>
      <Card className="my-6" title="Printed receipts to states">
        <p className="mb-4 text-xs text-stone-500">
          Statutory ₦4.92tn and VAT ₦3.51tn from the same Agora ranking. Bars use their own sum.
        </p>
        <div className="space-y-4">
          {data.sources.map((source) => (
            <div key={source.id}>
              <div className="mb-2 flex justify-between text-sm">
                <strong>{source.name}</strong>
                <span>{formatNaira(millionToNaira(source.amount))}</span>
              </div>
              <div className="h-2 rounded bg-stone-100">
                <div
                  className="h-2 rounded bg-emerald-800"
                  style={{
                    width: `${receiptTotal === 0 ? 0 : (source.amount / receiptTotal) * 100}%`,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
        <p className="mt-4">
          <Source id="faacJanSep2026">Agora Policy · Jan–Sep 2026</Source>
        </p>
      </Card>
      <Notice>
        Every state amount is published. The FCT is missing from this table. Population is not
        loaded.
      </Notice>
      <Card className="mt-6" title="36-state distribution">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr>
                {["Rank", "State", "Zone", "Population", "Share", "Allocation", "Basis"].map(
                  (head) => (
                    <th key={head}>{head}</th>
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              {data.stateAllocations.map((state, index) => (
                <tr key={state.id}>
                  <td>{index + 1}</td>
                  <td className="font-medium">{state.name}</td>
                  <td>{state.zone}</td>
                  <td>{state.population == null ? "Not loaded" : String(state.population)}</td>
                  <td>{state.sharePercent}%</td>
                  <td>{formatNaira(millionToNaira(state.allocationAmount))}</td>
                  <td>Published</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
}
