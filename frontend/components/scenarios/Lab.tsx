"use client";

import { useMemo, useState } from "react";
import { postJson } from "@/lib/api/client";
import { shortfall } from "@/lib/domain/allocate";
import { projectHorizon } from "@/lib/domain/scenario";
import { formatNaira } from "@/lib/format/money";

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
    <section className="panel stack">
      <label className="field">
        <span>Revenue drop, {drop}%</span>
        <input
          type="range"
          min={0}
          max={40}
          value={drop}
          onChange={(event) => setDrop(Number(event.target.value))}
        />
      </label>
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
      <p>{preview.sentence}</p>
      <div className="stack">
        {years.map((year) => (
          <div className="year-row" key={year.year}>
            <strong>{year.year}</strong>
            <div className="year-track">
              <span className="year-base" style={{ width: `${(year.baseline / max) * 100}%` }} />
              <span className="year-stress" style={{ width: `${(year.stressed / max) * 100}%` }} />
              <span className="quiet">
                Stressed {formatNaira(year.stressed)} · capital held at {formatNaira(year.capital)}
              </span>
            </div>
          </div>
        ))}
      </div>
      <button
        className="button"
        type="button"
        onClick={fileStress}
        disabled={pending}
        aria-busy={pending}
      >
        {pending ? "Filing" : "File this stress test"}
      </button>
      {serverSentence ? <p role="status">{serverSentence}</p> : null}
      {error ? (
        <p className="error" role="alert">
          {error}
        </p>
      ) : null}
    </section>
  );
}
