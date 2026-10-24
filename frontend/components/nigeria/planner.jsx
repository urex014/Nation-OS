"use client";
import { useState } from "react";
import Link from "next/link";
import { useDraft } from "./draft-provider";
import { Heading, Card, Field, Button, Notice, Download } from "./ui";
import { PlanResult } from "./plan-result";
import { SECTORS, STRATEGIES } from "../../lib/nigeria/constants.mjs";
import { request } from "../../lib/nigeria/client.mjs";
import { naira } from "../../lib/nigeria/format.mjs";
export function Planner({ jurisdictions }) {
  const { config, setConfig } = useDraft(),
    [result, setResult] = useState(null),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [strategy, setStrategy] = useState("balanced"),
    [allocationNote, setAllocationNote] = useState(""),
    [title, setTitle] = useState(""),
    [reason, setReason] = useState(""),
    [saved, setSaved] = useState(null);
  function change(key, value) {
    setConfig({ ...config, [key]: value });
    setResult(null);
    setSaved(null);
  }
  async function act(fn) {
    setError("");
    setBusy(true);
    try {
      await fn();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  const total = Object.values(config.allocations).reduce((a, b) => a + b, 0);
  return (
    <>
      <Heading eyebrow="Project Intelligence" title="Build an explainable investment plan">
        Choose a geographic scope, allocate an investment envelope and test five or ten years of
        explicit assumptions. This model calculates funding paths; it does not predict
        public-service outcomes.
      </Heading>
      <Card title="Planning scope">
        <div className="grid gap-4 md:grid-cols-3">
          <Field label="Jurisdiction">
            <select value={config.scope} onChange={(e) => change("scope", e.target.value)}>
              <option value="all">36 states and FCT combined</option>
              {jurisdictions.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Horizon">
            <select value={config.years} onChange={(e) => change("years", Number(e.target.value))}>
              <option value={5}>5 years</option>
              <option value={10}>10 years</option>
            </select>
          </Field>
          <Field label="First planning year">
            <input
              type="number"
              min="2026"
              max="2040"
              value={config.startYear}
              onChange={(e) => change("startYear", Number(e.target.value))}
            />
          </Field>
        </div>
      </Card>
      <Card className="my-6" title="Investment envelope & sector allocations">
        <div className="grid items-end gap-4 md:grid-cols-3">
          <Field label="First-year investment · ₦ billions">
            <input
              type="number"
              min=".000000001"
              step="any"
              value={config.annualBudgetNaira / 1e9}
              onChange={(e) =>
                change("annualBudgetNaira", Math.round(Number(e.target.value) * 1e9))
              }
            />
          </Field>
          <Field label="Allocation starting point">
            <select value={strategy} onChange={(e) => setStrategy(e.target.value)}>
              {Object.entries(STRATEGIES).map(([key, s]) => (
                <option key={key} value={key}>
                  {s.label}
                </option>
              ))}
            </select>
          </Field>
          <Button
            secondary
            disabled={busy}
            onClick={() =>
              act(async () => {
                const r = await request("allocations", {
                  annualBudgetNaira: config.annualBudgetNaira,
                  strategy,
                });
                change("allocations", r.allocations);
                setAllocationNote(r.explanation);
              })
            }
          >
            Apply preference weights
          </Button>
        </div>
        {allocationNote && (
          <p className="my-4 text-xs leading-5 text-stone-500">{allocationNote}</p>
        )}
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {Object.entries(SECTORS).map(([key, label]) => (
            <Field key={key} label={`${label} · ₦ billions`}>
              <input
                type="number"
                min="0"
                step="any"
                value={config.allocations[key] / 1e9}
                onChange={(e) =>
                  change("allocations", {
                    ...config.allocations,
                    [key]: Math.round(Number(e.target.value) * 1e9),
                  })
                }
              />
            </Field>
          ))}
        </div>
        <p
          className={`mt-4 text-sm ${total === config.annualBudgetNaira ? "text-emerald-800" : "text-red-700"}`}
        >
          Allocated {naira(total)} / {naira(config.annualBudgetNaira)}. Amounts must match exactly.
        </p>
      </Card>
      <Card title="Forward assumptions · all editable, none measured">
        <div className="grid gap-4 md:grid-cols-3">
          {[
            ["inflation", "Annual inflation", 0, 100],
            ["budgetGrowth", "Annual budget growth", -20, 25],
            ["revenueGrowth", "Annual IGR growth", -20, 25],
            ["delivery", "Capital delivery share", 0, 100],
            ["maintenance", "Maintenance share", 0, 50],
          ].map(([key, label, min, max]) => (
            <Field key={key} label={`${label} · %`}>
              <input
                type="number"
                step=".1"
                min={min}
                max={max}
                value={config[key]}
                onChange={(e) => change(key, Number(e.target.value))}
              />
            </Field>
          ))}
        </div>
        <p className="my-5 text-xs leading-5 text-stone-500">
          Delivery is a spending adjustment assumption. It is not a measured implementation
          probability. Revenue growth starts from the latest observed NBS year.
        </p>
        <Button
          disabled={busy || total !== config.annualBudgetNaira}
          onClick={() => act(async () => setResult(await request("plans", { config })))}
        >
          {busy ? "Working…" : "Calculate & store run"}
        </Button>
      </Card>
      {error && (
        <div className="mt-4">
          <Notice error>{error}</Notice>
        </div>
      )}
      {result && (
        <>
          <PlanResult result={result.result} />
          <Card className="mt-6" title="Save the decision and its reasoning">
            <div className="space-y-4">
              <Field label="Proposal title">
                <input maxLength={160} value={title} onChange={(e) => setTitle(e.target.value)} />
              </Field>
              <Field label="Why this allocation? What evidence and gaps should the next reviewer understand?">
                <textarea
                  maxLength={4000}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                />
              </Field>
              <div className="flex gap-3">
                <Button
                  disabled={busy || !title.trim() || !reason.trim()}
                  onClick={() =>
                    act(async () => setSaved(await request("decisions", { title, reason, config })))
                  }
                >
                  Save draft decision
                </Button>
                <Download value={result} />
              </div>
              {saved && (
                <Notice>
                  Saved locally.{" "}
                  <Link className="underline" href="/decisions">
                    Open decision records
                  </Link>
                  .
                </Notice>
              )}
            </div>
          </Card>
        </>
      )}
    </>
  );
}
