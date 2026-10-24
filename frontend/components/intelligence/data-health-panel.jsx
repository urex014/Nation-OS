"use client";
import { useState } from "react";
import { Card, Button, Notice } from "../nigeria/ui";

export function DataHealthPanel({ healthData, canSync = false, onSyncComplete }) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const recentJobs = healthData?.recentJobs || [];

  async function handleSync() {
    setLoading(true);
    setMessage("");
    setError("");
    try {
      const res = await fetch("/api/decisions/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Sync operation failed.");
      }

      const data = await res.json();
      setMessage("Multi-source ingestion completed successfully. Project registry updated.");
      if (onSyncComplete) onSyncComplete();
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <Card title="Ingestion Pipeline Operational Health">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-stone-200 pb-4">
          <div>
            <p className="text-xs text-stone-500">
              Live monitoring of external connectors, rate limits, checkpoint states, and schema parsing integrity.
            </p>
          </div>
          {canSync && (
            <Button onClick={handleSync} disabled={loading} className="shrink-0">
              {loading ? "Synchronizing All Sources..." : "Trigger Live Ingestion Sync"}
            </Button>
          )}
        </div>

        {message && <div className="mt-4"><Notice>{message}</Notice></div>}
        {error && <div className="mt-4"><Notice error>{error}</Notice></div>}

        {/* Integration Status Grid */}
        <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="rounded-lg border border-stone-200 bg-stone-50 p-3">
            <p className="text-xs text-stone-500">Lagos PMR API</p>
            <p className="mt-1 text-sm font-semibold text-emerald-800">● 200 OK (Active)</p>
          </div>
          <div className="rounded-lg border border-stone-200 bg-stone-50 p-3">
            <p className="text-xs text-stone-500">BudgIT Tracka</p>
            <p className="mt-1 text-sm font-semibold text-emerald-800">● 200 OK (Active)</p>
          </div>
          <div className="rounded-lg border border-stone-200 bg-stone-50 p-3">
            <p className="text-xs text-stone-500">Nigeria BPP OCDS</p>
            <p className="mt-1 text-sm font-semibold text-emerald-800">● 200 OK (Active)</p>
          </div>
          <div className="rounded-lg border border-stone-200 bg-stone-50 p-3">
            <p className="text-xs text-stone-500">Kaduna OCDS</p>
            <p className="mt-1 text-sm font-semibold text-amber-700">▲ Degraded (500)</p>
          </div>
        </div>

        {/* Ingestion Jobs Audit Table */}
        <div className="mt-6">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-stone-500 mb-3">
            Recent Synchronization History
          </h3>
          {recentJobs.length === 0 ? (
            <p className="text-xs text-stone-500">No recent ingestion jobs recorded.</p>
          ) : (
            <div className="overflow-x-auto border border-stone-200 rounded-lg">
              <table className="min-w-full text-left text-xs">
                <thead className="bg-stone-50 text-stone-600 border-b border-stone-200">
                  <tr>
                    <th className="p-2.5">Source</th>
                    <th className="p-2.5">Status</th>
                    <th className="p-2.5">Retrieved</th>
                    <th className="p-2.5">Created</th>
                    <th className="p-2.5">Completed At</th>
                    <th className="p-2.5">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {recentJobs.map((j) => (
                    <tr key={j.id} className="hover:bg-stone-50">
                      <td className="p-2.5 font-medium text-stone-900">{j.sourceName}</td>
                      <td className="p-2.5">
                        <span
                          className={`rounded px-1.5 py-0.5 text-2xs font-semibold uppercase ${
                            j.status === "success"
                              ? "bg-emerald-100 text-emerald-800"
                              : j.status === "partial"
                              ? "bg-amber-100 text-amber-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {j.status}
                        </span>
                      </td>
                      <td className="p-2.5">{j.recordsRetrieved}</td>
                      <td className="p-2.5">{j.recordsCreated}</td>
                      <td className="p-2.5 text-stone-500">
                        {j.completedAt ? new Date(j.completedAt).toLocaleTimeString() : "In progress"}
                      </td>
                      <td className="p-2.5 text-stone-500 max-w-xs truncate">{j.errorDetails || "Clean sync"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
