"use client";

import { useMemo, useState } from "react";
import { SECTORS } from "../../lib/nigeria/constants.mjs";
import { naira } from "../../lib/nigeria/format.mjs";
import { illustrateSplit, illustrateTax } from "../../lib/nigeria/illustrate.mjs";
import { Button } from "../nigeria/ui";

const PREFERENCES = [
  ["balanced", "Balanced"],
  ["social", "Social services"],
  ["infrastructure", "Infrastructure"],
];

export function Simulator({ snapshot }) {
  const [percent, setPercent] = useState(0);
  const [strategy, setStrategy] = useState("balanced");
  const tax = useMemo(
    () => illustrateTax(snapshot.taxKobo, snapshot.otherKobo, percent),
    [snapshot.taxKobo, snapshot.otherKobo, percent],
  );
  const split = useMemo(
    () => illustrateSplit(snapshot.envelopeNaira, strategy),
    [snapshot.envelopeNaira, strategy],
  );
  const source = snapshot.igrSource;

  return (
    <div className="grid gap-6">
      <section className="rounded-xl border border-stone-200 bg-white p-6">
        <h2 className="font-semibold">Tax collection illustration</h2>
        <p className="mt-2 text-sm leading-6 text-stone-600">{tax.projection}</p>
        <label className="mt-5 block text-sm text-stone-600" htmlFor="tax-change">
          Change from the published {snapshot.year} tax collection: {percent}%
        </label>
        <input
          id="tax-change"
          className="mt-2 w-full accent-[#0B3B2C]"
          type="range"
          min={-50}
          max={50}
          step={1}
          value={percent}
          onChange={(event) => setPercent(Number(event.target.value))}
        />
        <dl className="mt-5 grid gap-4 sm:grid-cols-3">
          <div>
            <dt className="text-xs uppercase tracking-widest text-stone-500">Published tax</dt>
            <dd className="mt-1 text-lg font-semibold">{naira(snapshot.taxNaira)}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-widest text-stone-500">Projected tax</dt>
            <dd className="mt-1 text-lg font-semibold">{naira(tax.taxKobo / 100)}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-widest text-stone-500">Projected IGR</dt>
            <dd className="mt-1 text-lg font-semibold">{naira(tax.totalKobo / 100)}</dd>
          </div>
        </dl>
      </section>
      <section className="rounded-xl border border-stone-200 bg-white p-6">
        <h2 className="font-semibold">Sector split of the published IGR</h2>
        <p className="mt-2 text-sm leading-6 text-stone-600">{split.projection}</p>
        <div className="mt-5 flex flex-wrap gap-2" role="group" aria-label="Allocation preference">
          {PREFERENCES.map(([value, label]) => (
            <Button
              key={value}
              type="button"
              secondary={strategy !== value}
              aria-pressed={strategy === value}
              onClick={() => setStrategy(value)}
            >
              {label}
            </Button>
          ))}
        </div>
        <p className="mt-4 text-sm text-stone-600">
          {split.label}. Envelope {naira(split.envelopeNaira)}. {split.explanation}
        </p>
        <table className="mt-4 w-full text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-widest text-stone-500">
              <th className="py-2">Sector</th>
              <th className="py-2">Projected naira</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(SECTORS).map(([key, label]) => (
              <tr key={key} className="border-t border-stone-100">
                <td className="py-2">{label}</td>
                <td className="py-2">{naira(split.allocations[key])}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
      {source && (
        <p className="text-sm leading-6 text-stone-600">
          Source: {source.publisher}, {source.title} ({source.period}). {source.note}{" "}
          <a
            className="text-emerald-800 underline underline-offset-4"
            href={source.url}
            rel="noreferrer"
          >
            Publisher page
          </a>
          .
        </p>
      )}
    </div>
  );
}
