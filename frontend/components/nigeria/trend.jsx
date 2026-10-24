import { naira } from "../../lib/nigeria/format.mjs";
// Observed annual values only; this chart never interpolates a missing observation.
export function Trend({ rows, label = "Observed IGR" }) {
  const max = Math.max(...rows.map((r) => r.totalNaira), 1);
  return (
    <div>
      <p className="mb-3 text-xs text-stone-500">{label} · nominal naira</p>
      <div className="flex h-40 items-end gap-2">
        {rows.map((r) => (
          <div
            key={r.year}
            className="flex min-w-0 flex-1 flex-col items-center justify-end h-full"
          >
            <span className="mb-1 text-[10px] text-stone-500">{naira(r.totalNaira)}</span>
            <div
              className="w-full rounded-t bg-emerald-800/80"
              style={{ height: `${Math.max(1, (r.totalNaira / max) * 110)}px` }}
            />
            <span className="mt-2 text-[10px]">{r.year}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
