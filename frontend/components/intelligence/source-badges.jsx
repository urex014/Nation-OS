"use client";

export function ExternalLinkIcon({ className = "w-3 h-3 inline-block ml-1" }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
      />
    </svg>
  );
}

export function ProjectSourcesList({ sources = [] }) {
  if (!sources || sources.length === 0) {
    return (
      <div className="mt-2 text-2xs text-stone-500 italic">
        Source unavailable (Unverified against external database)
      </div>
    );
  }

  return (
    <div className="mt-2 pt-2 border-t border-stone-100 space-y-1.5">
      <div className="flex items-center gap-1.5 text-2xs font-semibold uppercase tracking-wider text-stone-600">
        <span>Sources ({sources.length})</span>
      </div>
      <div className="space-y-1">
        {sources.map((s, idx) => {
          const isOfficial =
            s.isOfficial !== undefined
              ? s.isOfficial
              : !s.publisher?.toLowerCase().includes("tracka");
          const recordRef =
            s.pageNumber ? `Page ${s.pageNumber}` : s.originalProjectId ? `Record #${s.originalProjectId}` : null;
          const pubDate = s.publicationDate || "Rolling update";
          const retDate = s.retrievalTimestamp
            ? new Date(s.retrievalTimestamp).toLocaleDateString()
            : "Verified";

          return (
            <div
              key={s.id || idx}
              className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 text-2xs rounded bg-stone-50/80 px-2 py-1.5 border border-stone-200/60"
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span
                    className={`inline-block rounded px-1.5 py-0.2 text-[10px] font-semibold ${
                      isOfficial
                        ? "bg-emerald-100 text-emerald-900 border border-emerald-300"
                        : "bg-blue-100 text-blue-900 border border-blue-300"
                    }`}
                  >
                    {isOfficial ? "Official Government Record" : "Third-Party Civic Monitoring"}
                  </span>
                  <strong className="text-stone-800">{s.publisher}</strong>
                  {recordRef && (
                    <span className="text-stone-500 font-mono text-[10px]">[{recordRef}]</span>
                  )}
                </div>
                <div className="text-stone-600 truncate mt-0.5">
                  <span className="italic">{s.documentTitle || "Official Portal Entry"}</span>
                  <span className="text-stone-400 mx-1">·</span>
                  <span className="text-stone-500">Pub: {pubDate}</span>
                  <span className="text-stone-400 mx-1">·</span>
                  <span className="text-stone-500">Retrieved: {retDate}</span>
                </div>
              </div>

              {s.sourceUrl || s.url ? (
                <a
                  href={s.sourceUrl || s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center text-emerald-800 hover:text-emerald-950 font-medium shrink-0 hover:underline pt-0.5 sm:pt-0"
                >
                  <span>Open Source</span>
                  <ExternalLinkIcon />
                </a>
              ) : (
                <span className="text-stone-400 italic shrink-0">Source unavailable</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function LgaSourcesSection({ lgaName, sources = [], indicators = null }) {
  return (
    <div className="mt-3 pt-3 border-t border-stone-200 text-xs">
      <div className="flex items-center justify-between mb-2">
        <span className="text-2xs font-bold uppercase tracking-wider text-emerald-900">
          Sources & Indicator Citations for {lgaName}
        </span>
        <span className="text-2xs text-stone-500">
          Associated by Indicator
        </span>
      </div>

      <div className="grid grid-cols-1 gap-2">
        {sources.map((s, idx) => (
          <div
            key={idx}
            className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5 rounded-lg border border-stone-200/80 bg-stone-50/70 p-2 text-2xs"
          >
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="font-semibold text-stone-900 bg-white px-1.5 py-0.5 rounded border border-stone-200">
                  {s.indicator}
                </span>
                <span
                  className={`rounded px-1.5 py-0.2 text-[10px] font-medium ${
                    s.isOfficial
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-blue-100 text-blue-800"
                  }`}
                >
                  {s.isOfficial ? "Official Government Data" : "Third-Party Monitoring"}
                </span>
                <strong className="text-stone-700">{s.sourceOrg}</strong>
              </div>
              <div className="text-stone-600 mt-1">
                <span className="italic">{s.documentTitle}</span>
                {s.recordRef && <span className="ml-1 text-stone-500">({s.recordRef})</span>}
                <span className="text-stone-400 mx-1">·</span>
                <span className="text-stone-500">Published: {s.publicationDate}</span>
                <span className="text-stone-400 mx-1">·</span>
                <span className="text-stone-500">Retrieved: {s.retrievalDate}</span>
              </div>
            </div>

            {s.url ? (
              <a
                href={s.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center text-emerald-800 hover:text-emerald-950 font-medium shrink-0 hover:underline"
              >
                <span>View Source</span>
                <ExternalLinkIcon />
              </a>
            ) : (
              <span className="text-stone-400 italic">Source unavailable</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
