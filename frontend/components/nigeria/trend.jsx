import { naira } from "../../lib/nigeria/format.mjs";
// Observed annual values only; this chart never interpolates a missing observation.
export function Trend({ rows, label = "Observed IGR" }) {
  const max = Math.max(...rows.map((r) => r.totalNaira), 1);
  return (
    <div className="min-w-0">
      <p className="mb-3 text-xs text-stone-500">{label} · nominal naira</p>
      <div
        className="grid h-44 w-full min-w-0 gap-1"
        style={{ gridTemplateColumns: `repeat(${Math.max(rows.length, 1)}, minmax(0, 1fr))` }}
      >
        {rows.map((r) => (
          <div key={r.year} className="flex min-w-0 flex-col items-center justify-end">
            <span className="mb-1 w-full truncate text-center text-[10px] text-stone-500">
              {naira(r.totalNaira)}
            </span>
            <div className="flex h-24 w-full items-end">
              <div
                className="w-full rounded-t bg-emerald-800/80"
                style={{ height: `${Math.max(4, (r.totalNaira / max) * 100)}%` }}
              />
            </div>
            <span className="mt-2 w-full truncate text-center text-[10px]">{r.year}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
