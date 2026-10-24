"use client";

import { useMemo, useState } from "react";
import { postJson } from "@/lib/api/client";
import { shortfall } from "@/lib/domain/allocate";
import { projectHorizon } from "@/lib/domain/scenario";
import { formatNaira } from "@/lib/format/money";
import { Button, Card, Field, Heading, Notice } from "./ui";

export function Lab({
  baseRevenue,
  capital,
  overhead,
  growth,
  mdas,
}: {
  baseRevenue: number;
  capital: number;
  overhead: number;
  growth: number;
  mdas: number;
}) {
  const [drop, setDrop] = useState(15);
  const [horizon, setHorizon] = useState<5 | 10>(5);
  const [serverSentence, setServerSentence] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const preview = useMemo(() => shortfall(drop, overhead, mdas), [drop, overhead, mdas]);
  const years = useMemo(
    () =>
      projectHorizon({ horizon, drop, baseRevenue, capital, overhead, growth, startYear: 2026 }),
    [horizon, drop, baseRevenue, capital, overhead, growth],
  );
  const max = Math.max(...years.map((year) => year.baseline), 1);

  async function fileStress() {
    setPending(true);
    setError("");
    try {
      const response = await postJson<{ simulation_result: string }>("/api/allocate", {
        revenue_drop_percentage: drop,
      });
      setServerSentence(response.simulation_result);
      await postJson("/api/v1/decisions", {
        question: `Stress test a ${drop}% revenue drop over ${horizon} years`,
        budget: Math.max(1, Math.round(overhead / 1_000_000)),
        horizon,
        strategy: "balance",
      });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The stress test was not filed");
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      <Heading eyebrow="Scenario Lab" title="Test what happens if revenue falls">
        The path starts from the ₦34.33tn revenue target and Q4 2025 GDP growth of 4.07%. No
        overhead ledger is loaded, so a drop cuts ₦0.
      </Heading>
      <Card title="Revenue drop">
        <Field label={`Revenue drop, ${drop}%`}>
          <input
            type="range"
            min={0}
            max={40}
            value={drop}
            onChange={(event) => setDrop(Number(event.target.value))}
          />
        </Field>
        <div className="mt-4 flex flex-wrap gap-3">
          {[5, 10].map((value) => (
            <Button
              key={value}
              type="button"
              secondary={horizon !== value}
              aria-pressed={horizon === value}
              onClick={() => setHorizon(value as 5 | 10)}
            >
              {value} years
            </Button>
          ))}
        </div>
        <p className="mt-4 text-sm">{preview.sentence}</p>
        <div className="mt-6 space-y-3">
          {years.map((year) => (
            <div key={year.year}>
              <div className="mb-1 flex justify-between text-sm">
                <strong>{year.year}</strong>
                <span className="text-stone-500">
                  Stressed {formatNaira(year.stressed)} · capital {formatNaira(year.capital)}
                </span>
              </div>
              <div className="h-3 rounded bg-stone-100">
                <div
                  className="h-3 rounded bg-emerald-900/30"
                  style={{ width: `${(year.baseline / max) * 100}%` }}
                >
                  <div
                    className="h-3 rounded bg-emerald-800"
                    style={{ width: `${(year.stressed / year.baseline) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-6">
          <Button type="button" onClick={() => void fileStress()} disabled={pending}>
            {pending ? "Filing" : "File this stress test"}
          </Button>
        </div>
        {serverSentence ? (
          <p className="mt-4 text-sm" role="status">
            {serverSentence}
          </p>
        ) : null}
        {error ? (
          <div className="mt-4">
            <Notice error>{error}</Notice>
          </div>
        ) : null}
      </Card>
    </>
  );
}
