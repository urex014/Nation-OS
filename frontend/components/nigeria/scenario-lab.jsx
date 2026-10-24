"use client";
import { useState } from "react";
import { useDraft } from "./draft-provider";
import { Heading, Card, Button, Notice, Download } from "./ui";
import { SideScroll } from "./side-scroll";
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
      <Heading eyebrow="What-if tests" title="See what changes the plan">
        Bring the guesses from the budget planner into four comparisons. Each one changes a single
        guess. These are what-if cases, not forecasts or odds.
      </Heading>
      <Card title="Compare assumptions">
        <div className="flex flex-col gap-4 md:flex-row md:flex-wrap md:items-center">
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
            {busy ? "Calculating…" : "Compare these guesses"}
          </Button>
          {data && <Download value={data} />}
        </div>
        <p className="mt-4 text-sm text-stone-500">
          First-year amount: {naira(config.annualBudgetNaira)}. Every comparison keeps the same
          sector split.
        </p>
      </Card>
      {error && <Notice error>{error}</Notice>}
      {data && (
        <>
          <Card className="mt-6" title="What the plan does in each case">
            <SideScroll>
              <table className="w-full min-w-[40rem] text-sm">
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
            </SideScroll>
          </Card>
          <PlanResult result={(cases.find((s) => s.id === selected) || cases[0]).result} />
        </>
      )}
    </>
  );
}
