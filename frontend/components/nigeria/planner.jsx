"use client";
import { useState } from "react";
import Link from "next/link";
import { useDraft } from "./draft-provider";
import { Heading, Card, Field, Button, Notice, Download } from "./ui";
import { PlanResult } from "./plan-result";
import { SECTORS, STRATEGIES } from "../../lib/nigeria/constants.mjs";
import { request } from "../../lib/nigeria/client.mjs";
import { naira } from "../../lib/nigeria/format.mjs";
import { reviewProject } from "../../lib/nigeria/guardrails.mjs";
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
    const next = { ...config, [key]: value };
    if (key === "annualBudgetNaira") next.budgetTouched = true;
    setConfig(next);
    setResult(null);
    setSaved(null);
  }
  const projectWarning = config.projectNaira
    ? reviewProject({
        budgetNaira: config.annualBudgetNaira,
        projectNaira: config.projectNaira,
        override: config.overrideProjectCap,
      }).warnings.join(" ")
    : "";
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
      <Heading eyebrow="Plan a budget" title="Try a plan you can explain">
        Pick a place, split the money, and try five or ten years of guesses. This works out a
        funding path. It doesn’t predict how public services will turn out.
      </Heading>
      <Card title="Planning scope">
        <div className="grid gap-4 lg:grid-cols-3">
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
        <div className="grid items-end gap-4 lg:grid-cols-3">
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
            Apply these weights
          </Button>
        </div>
        {allocationNote && (
          <p className="my-4 text-xs leading-5 text-stone-500">{allocationNote}</p>
        )}
        <div className="mt-6 grid gap-4 lg:grid-cols-3">
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
        {config.projectNaira ? (
          <p className="mt-4 text-sm text-stone-700">
            Project from the link: {naira(config.projectNaira)}. {projectWarning}
          </p>
        ) : null}
        <p
          className={`mt-4 text-sm ${total === config.annualBudgetNaira ? "text-emerald-800" : "text-red-700"}`}
        >
          Allocated {naira(total)} of {naira(config.annualBudgetNaira)}. The amounts have to match
          exactly.
        </p>
      </Card>
      <Card title="Our guesses about the future. You can change any of them.">
        <div className="grid gap-4 lg:grid-cols-3">
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
          Delivery is a guess about how much of the capital budget gets spent. It isn’t a measured
          chance that a project finishes. IGR means money the state raises itself. Revenue growth
          starts from the latest NBS year we have.
        </p>
        <Button
          disabled={busy || total !== config.annualBudgetNaira}
          onClick={() => act(async () => setResult(await request("plans", { config })))}
        >
          {busy ? "Working…" : "Work out this plan"}
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
            <Card className="mt-6" title="Save the decision and why you made it">
            <div className="space-y-4">
              <Field label="Title">
                <input maxLength={160} value={title} onChange={(e) => setTitle(e.target.value)} />
              </Field>
              <Field label="Why this split? What should the next person know, including what's missing?">
                <textarea
                  maxLength={4000}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                />
              </Field>
              <div className="flex flex-col gap-3 md:flex-row">
                <Button
                  disabled={busy || !title.trim() || !reason.trim()}
                  onClick={() =>
                    act(async () => setSaved(await request("decisions", { title, reason, config })))
                  }
                >
                  Save this draft
                </Button>
                <Download value={result} />
              </div>
              {saved && (
                <Notice>
                  Saved with the other decisions.{" "}
                  <Link className="underline" href="/decisions">
                    Open saved projects
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
