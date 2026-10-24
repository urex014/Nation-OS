"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { Result } from "@/components/budget/Result";
import { postJson } from "@/lib/api/client";
import type { Recommendation, Strategy } from "@/lib/domain/recommend";

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

  const budgetValue = Number(budget);
  const budgetInvalid = !Number.isFinite(budgetValue) || budgetValue <= 0;

  return (
    <form className="panel stack" onSubmit={onSubmit}>
      <label className="field">
        <span>Policy question</span>
        <textarea
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          required
          minLength={8}
        />
      </label>
      <label className="field">
        <span>Envelope, million naira</span>
        <input
          inputMode="decimal"
          value={budget}
          onChange={(event) => setBudget(event.target.value)}
          aria-invalid={budgetInvalid}
          aria-describedby="budget-help"
        />
      </label>
      <p id="budget-help" className="quiet">
        100000 million naira is ₦100bn. The parts sum to this envelope.
      </p>
      {budgetInvalid ? (
        <p className="error" role="alert">
          Enter a positive envelope.
        </p>
      ) : null}
      <div className="segment" role="group" aria-label="Horizon">
        {[5, 10].map((value) => (
          <button
            key={value}
            type="button"
            aria-pressed={horizon === value}
            onClick={() => setHorizon(value as 5 | 10)}
          >
            {value} years
          </button>
        ))}
      </div>
      <div className="segment" role="group" aria-label="Strategy">
        {STRATEGIES.map((item) => (
          <button
            key={item.id}
            type="button"
            aria-pressed={strategy === item.id}
            onClick={() => setStrategy(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>
      <button
        className="button"
        type="submit"
        disabled={pending || budgetInvalid}
        aria-busy={pending}
      >
        {pending ? "Calculating" : "Run investigation"}
      </button>
      {error ? (
        <p className="error" role="alert">
          {error}
        </p>
      ) : null}
      {result ? <Result result={result} /> : null}
      {result ? (
        <button className="button button-quiet" type="button" onClick={preserve} disabled={pending}>
          Preserve decision
        </button>
      ) : null}
      {saved ? (
        <p role="status">
          Preserved. <Link href="/decisions">Open decision records</Link>.
        </p>
      ) : null}
    </form>
  );
}
