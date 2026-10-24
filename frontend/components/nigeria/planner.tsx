"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { postJson } from "@/lib/api/client";
import type { Recommendation, Strategy } from "@/lib/domain/recommend";
import { Button, Card, Field, Heading, Notice } from "./ui";
import { Result } from "./result";

const STRATEGIES: { id: Strategy; label: string }[] = [
  { id: "needs", label: "Needs" },
  { id: "growth", label: "Growth" },
  { id: "balance", label: "Balance" },
];

export function Planner() {
  const [question, setQuestion] = useState(
    "Distribute ₦100bn to improve healthcare and education while prioritizing underserved states",
  );
  const [budget, setBudget] = useState("100000");
  const [horizon, setHorizon] = useState<5 | 10>(5);
  const [strategy, setStrategy] = useState<Strategy>("needs");
  const [result, setResult] = useState<Recommendation | null>(null);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [saved, setSaved] = useState("");

  const payload = () => ({ question, budget: Number(budget), horizon, strategy });
  const budgetValue = Number(budget);
  const budgetInvalid = !Number.isSafeInteger(budgetValue) || budgetValue < 1;

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");
    setSaved("");
    try {
      setResult(await postJson<Recommendation>("/api/v1/budgets/recommend", payload()));
    } catch (caught) {
      setResult(null);
      setError(caught instanceof Error ? caught.message : "The allocation did not run");
    } finally {
      setPending(false);
    }
  }

  async function preserve() {
    setPending(true);
    setError("");
    try {
      const response = await postJson<{ decision: { id: string } }>("/api/v1/decisions", payload());
      setSaved(response.decision.id);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The decision was not preserved");
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      <Heading eyebrow="Project Intelligence" title="Build an explainable investment plan">
        Same question, envelope, and strategy always return the same split. Weights are a rule in
        code, not a published budget.
      </Heading>
      <form className="space-y-6" onSubmit={onSubmit}>
        <Card title="Policy question">
          <Field label="Question">
            <textarea
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              required
              minLength={8}
            />
          </Field>
        </Card>
        <Card title="Envelope and strategy">
          <div className="grid gap-4 md:grid-cols-3">
            <Field label="Envelope, million naira">
              <input
                inputMode="numeric"
                value={budget}
                onChange={(event) => setBudget(event.target.value)}
                aria-invalid={budgetInvalid}
              />
            </Field>
            <Field label="Horizon">
              <select
                value={horizon}
                onChange={(event) => setHorizon(Number(event.target.value) as 5 | 10)}
              >
                <option value={5}>5 years</option>
                <option value={10}>10 years</option>
              </select>
            </Field>
            <Field label="Strategy">
              <select
                value={strategy}
                onChange={(event) => setStrategy(event.target.value as Strategy)}
              >
                {STRATEGIES.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.label}
                  </option>
                ))}
              </select>
            </Field>
          </div>
          <p className="mt-4 text-xs text-stone-500">100000 million naira is ₦100bn.</p>
          <div className="mt-5">
            <Button type="submit" disabled={pending || budgetInvalid}>
              {pending ? "Calculating" : "Run investigation"}
            </Button>
          </div>
        </Card>
      </form>
      {error ? (
        <div className="mt-4">
          <Notice error>{error}</Notice>
        </div>
      ) : null}
      {result ? <Result result={result} /> : null}
      {result ? (
        <div className="mt-4">
          <Button type="button" secondary onClick={preserve} disabled={pending}>
            Preserve decision
          </Button>
        </div>
      ) : null}
      {saved ? (
        <div className="mt-4">
          <Notice>
            Preserved. <Link href="/decisions">Open decision records</Link>.
          </Notice>
        </div>
      ) : null}
    </>
  );
}
