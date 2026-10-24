"use client";
import { Button, Card } from "../nigeria/ui";

export function ProjectDetailModal({ projectData, onClose }) {
  if (!projectData) return null;
  const { project, sources, financials, statusHistory } = projectData;

  const riskBadgeClass =
    project.riskLevel === "Critical"
      ? "bg-red-100 text-red-800 border-red-200"
      : project.riskLevel === "High"
      ? "bg-amber-100 text-amber-800 border-amber-200"
      : project.riskLevel === "Medium"
      ? "bg-yellow-100 text-yellow-800 border-yellow-200"
      : "bg-emerald-100 text-emerald-800 border-emerald-200";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-xl border border-stone-200 bg-white p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-stone-200 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs text-stone-500">{project.canonicalId}</span>
              <span className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${riskBadgeClass}`}>
                {project.riskLevel} Risk
              </span>
              <span className="rounded-full bg-stone-100 px-2.5 py-0.5 text-xs font-medium text-stone-700">
                {project.status}
              </span>
            </div>
            <h2 className="mt-2 text-xl font-semibold text-stone-900">{project.name}</h2>
            <p className="mt-1 text-xs text-stone-500">
              {project.lga} LGA · {project.agency} · Sector: {project.sector}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-stone-400 hover:bg-stone-100 hover:text-stone-700"
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>

        {/* Risk Alerts */}
        {project.riskIndicators && project.riskIndicators.length > 0 && (
          <div className="mt-4 space-y-2">
            {project.riskIndicators.map((ind, i) => (
              <div key={i} className="rounded-md border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
                <strong>{ind.label}:</strong> {ind.detail}
              </div>
            ))}
          </div>
        )}

        {/* Financial & Progress Metrics */}
        <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="rounded-lg border border-stone-200 bg-stone-50 p-3">
            <p className="text-xs text-stone-500">Contract Sum</p>
            <p className="mt-1 text-base font-semibold text-stone-900">{project.contractSumFormatted}</p>
          </div>
          <div className="rounded-lg border border-stone-200 bg-stone-50 p-3">
            <p className="text-xs text-stone-500">Expended / Disbursed</p>
            <p className="mt-1 text-base font-semibold text-stone-900">{project.expendedFormatted}</p>
          </div>
          <div className="rounded-lg border border-stone-200 bg-stone-50 p-3">
            <p className="text-xs text-stone-500">Recorded Progress</p>
            <p className="mt-1 text-base font-semibold text-stone-900">{project.progressPercent}%</p>
          </div>
          <div className="rounded-lg border border-stone-200 bg-stone-50 p-3">
            <p className="text-xs text-stone-500">Supporting Sources</p>
            <p className="mt-1 text-base font-semibold text-stone-900">{sources.length}</p>
          </div>
        </div>

        {/* Description / Objectives */}
        {project.description && (
          <div className="mt-5">
            <h3 className="text-sm font-semibold text-stone-900">Project Description & Objectives</h3>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-stone-700 bg-stone-50 p-3 rounded-md border border-stone-100">
              {project.description}
            </p>
          </div>
        )}

        {/* Financial History */}
        <div className="mt-6">
          <h3 className="text-sm font-semibold text-stone-900">Financial Records (Allocation vs Expenditure)</h3>
          {financials.length === 0 ? (
            <p className="mt-2 text-xs text-stone-500">No individual disbursement entries recorded.</p>
          ) : (
            <div className="mt-2 overflow-x-auto border border-stone-200 rounded-md">
              <table className="min-w-full text-left text-xs">
                <thead className="bg-stone-100 text-stone-600">
                  <tr>
                    <th className="p-2">Record Type</th>
                    <th className="p-2">Amount</th>
                    <th className="p-2">Fiscal Year</th>
                    <th className="p-2">Date Recorded</th>
                    <th className="p-2">Audit Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {financials.map((f) => (
                    <tr key={f.id} className="hover:bg-stone-50">
                      <td className="p-2 font-medium capitalize">{f.recordType.replace("_", " ")}</td>
                      <td className="p-2 font-semibold">{f.amountFormatted}</td>
                      <td className="p-2">{f.fiscalYear}</td>
                      <td className="p-2">{f.dateRecorded}</td>
                      <td className="p-2">
                        {f.verified ? (
                          <span className="text-emerald-700">Verified</span>
                        ) : (
                          <span className="text-stone-500">Unverified Award</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Supporting Sources with Links */}
        <div className="mt-6">
          <h3 className="text-sm font-semibold text-stone-900">Supporting Provenance & Citations</h3>
          <div className="mt-2 space-y-2">
            {sources.map((s) => (
              <div key={s.id} className="flex items-center justify-between rounded-lg border border-stone-200 bg-white p-3 text-xs">
                <div>
                  <strong className="text-stone-900">{s.publisher}</strong>
                  <p className="text-stone-500">{s.documentTitle || s.sourceType} · Confidence: {Math.round(s.confidence * 100)}%</p>
                </div>
                <a
                  href={s.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-md border border-stone-300 bg-white px-3 py-1.5 font-medium text-emerald-800 hover:bg-stone-50"
                >
                  Inspect Source ↗
                </a>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 flex justify-end border-t border-stone-200 pt-4">
          <Button secondary onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
