"use client";
import { Card } from "../nigeria/ui";

export function SourceTransparency({ sources = [] }) {
  return (
    <div className="space-y-6">
      <Card title="Source Provenance & Legal Reusability Directory">
        <p className="mb-4 text-xs text-stone-500">
          Every project record and budget recommendation is traceable to verified public procurement repositories, open contracting standards, and field monitoring documents.
        </p>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {sources.map((s, idx) => (
            <div key={idx} className="rounded-xl border border-stone-200 bg-white p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="font-semibold text-sm text-stone-900">{s.publisher}</span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      s.status.includes("Verified")
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-amber-100 text-amber-800"
                    }`}
                  >
                    {s.status}
                  </span>
                </div>
                <h3 className="text-xs font-medium text-stone-700">{s.name}</h3>
                <p className="mt-2 text-xs leading-5 text-stone-500">{s.coverage}</p>
                <div className="mt-3 rounded-md bg-stone-50 p-2.5 text-xs text-stone-600 border border-stone-100">
                  <strong>Data Quality:</strong> {s.dataQuality}
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-stone-100 pt-3 text-xs">
                <span className="text-stone-500">
                  {s.indexedCount > 0 ? `${s.indexedCount.toLocaleString()} citations indexed` : "Catalog registry"}
                </span>
                <a
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-emerald-800 hover:underline"
                >
                  Visit Official Source ↗
                </a>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
