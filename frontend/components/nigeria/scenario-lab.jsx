"use client";
import { useState } from "react";
import { useDraft } from "./draft-provider";
import { Heading, Card, Button, Notice, Download } from "./ui";
import { PlanResult } from "./plan-result";
import { request } from "../../lib/nigeria/client.mjs";
import { naira } from "../../lib/nigeria/format.mjs";
export function ScenarioLab() {
  const { config, setConfig } = useDraft(),
    [data, setData] = useState(null),
    [selected, setSelected] = useState("as-entered"),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  async function run() {
    setBusy(true);
    setError("");
    try {
      setData(await request("scenarios", { config }));
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  const cases = data?.scenarios || [];
  return (
    <>
      <Heading eyebrow="Scenario Lab" title="Test what changes the plan">
        Carry your investment assumptions from Project Intelligence into four one-variable
        comparisons. These are conditional stress cases, not forecasts or probability estimates.
      </Heading>
      <Card title="Compare assumptions">
        <div className="flex flex-wrap items-center gap-4">
          <label className="text-sm">
            Horizon{" "}
            <select
              value={config.years}
              onChange={(e) => {
                setConfig({ ...config, years: Number(e.target.value) });
                setData(null);
              }}
            >
              <option value={5}>5 years</option>
              <option value={10}>10 years</option>
            </select>
          </label>
          <Button disabled={busy} onClick={run}>
            {busy ? "Calculating…" : "Run sensitivity comparison"}
          </Button>
          {data && <Download value={data} />}
        </div>
        <p className="mt-4 text-sm text-stone-500">
          First-year envelope: {naira(config.annualBudgetNaira)}. All comparisons retain the same
          sector allocations.
        </p>
      </Card>
      {error && <Notice error>{error}</Notice>}
      {data && (
        <>
          <Card className="mt-6" title="Conditional investment paths">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr>
                    {[
                      "Case",
                      "Change",
                      "Nominal total",
                      "Constant-price total",
                      "Delivery-adjusted capital",
                      "Inspect",
                    ].map((h) => (
                      <th key={h}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {cases.map((s) => (
                    <tr key={s.id}>
                      <td>{s.label}</td>
                      <td>{s.change}</td>
                      <td>{naira(s.result.totals.nominalNaira)}</td>
                      <td>{naira(s.result.totals.constantPriceNaira)}</td>
                      <td>{naira(s.result.totals.deliveryAdjustedCapitalNaira)}</td>
                      <td>
                        <button
                          className="text-emerald-800 underline"
                          onClick={() => setSelected(s.id)}
                        >
                          Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
          <PlanResult result={(cases.find((s) => s.id === selected) || cases[0]).result} />
        </>
      )}
    </>
  );
}
