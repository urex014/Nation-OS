"use client";
import { useState, useEffect } from "react";
import { Card, Button, Field } from "../nigeria/ui";
import { ProjectDetailModal } from "./project-detail-modal";
import { ProjectSourcesList } from "./source-badges";
import { LgaSourcesCard } from "./lga-sources-card";

export function ProjectExplorer({ initialProjects = [], initialTotal = 0, initialLgaProfile = null }) {
  const [projects, setProjects] = useState(initialProjects);
  const [total, setTotal] = useState(initialTotal);
  const [search, setSearch] = useState("");
  const [lga, setLga] = useState("");
  const [status, setStatus] = useState("");
  const [sector, setSector] = useState("");
  const [riskLevel, setRiskLevel] = useState("");
  const [source, setSource] = useState("");
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);

  const limit = 15;

  async function fetchProjects(newOffset = offset) {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.set("search", search.trim());
      if (lga) params.set("lga", lga);
      if (status) params.set("status", status);
      if (sector) params.set("sector", sector);
      if (riskLevel) params.set("riskLevel", riskLevel);
      if (source) params.set("source", source);
      params.set("limit", String(limit));
      params.set("offset", String(newOffset));

      const res = await fetch(`/api/decisions/projects?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setProjects(data.projects || []);
        setTotal(data.total || 0);
        setOffset(newOffset);
      }
    } catch (e) {
      console.error("Failed to load projects:", e);
    } finally {
      setLoading(false);
    }
  }

  async function openDetail(id) {
    setModalLoading(true);
    try {
      const res = await fetch(`/api/decisions/projects/${id}`);
      if (res.ok) {
        const data = await res.json();
        setSelectedProject(data);
      }
    } catch (e) {
      console.error("Failed to load project details:", e);
    } finally {
      setModalLoading(false);
    }
  }

  function handleFilterSubmit(e) {
    e.preventDefault();
    fetchProjects(0);
  }

  return (
    <div className="space-y-6">
      {/* Filter Toolbar */}
      <Card title="Filter & Search Projects">
        <form onSubmit={handleFilterSubmit} className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-6">
          <Field label="Search Title / Agency">
            <input
              type="text"
              placeholder="e.g. road, hospital, Ikeja..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-md border border-stone-300 p-2 text-sm"
            />
          </Field>
          <Field label="LGA">
            <select
              value={lga}
              onChange={(e) => setLga(e.target.value)}
              className="w-full rounded-md border border-stone-300 p-2 text-sm bg-white"
            >
              <option value="">All LGAs</option>
              <option value="Ikeja">Ikeja</option>
              <option value="Eti-Osa">Eti-Osa</option>
              <option value="Lagos Island">Lagos Island</option>
              <option value="Alimosho">Alimosho</option>
              <option value="Kosofe">Kosofe</option>
              <option value="Ikorodu">Ikorodu</option>
              <option value="Surulere">Surulere</option>
              <option value="Badagry">Badagry</option>
              <option value="Epe">Epe</option>
            </select>
          </Field>
          <Field label="Status">
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full rounded-md border border-stone-300 p-2 text-sm bg-white"
            >
              <option value="">All Statuses</option>
              <option value="Ongoing">Ongoing</option>
              <option value="Completed">Completed</option>
              <option value="Planned">Planned</option>
              <option value="Stalled">Stalled</option>
              <option value="Procurement">Procurement</option>
              <option value="Abandoned">Abandoned</option>
            </select>
          </Field>
          <Field label="Sector">
            <select
              value={sector}
              onChange={(e) => setSector(e.target.value)}
              className="w-full rounded-md border border-stone-300 p-2 text-sm bg-white"
            >
              <option value="">All Sectors</option>
              <option value="Infrastructure & Works">Infrastructure & Works</option>
              <option value="Healthcare">Healthcare</option>
              <option value="Education">Education</option>
              <option value="Environment & Water">Environment & Water</option>
              <option value="Transportation">Transportation</option>
              <option value="Power & Energy">Power & Energy</option>
            </select>
          </Field>
          <Field label="Data Source">
            <select
              value={source}
              onChange={(e) => setSource(e.target.value)}
              className="w-full rounded-md border border-stone-300 p-2 text-sm bg-white"
            >
              <option value="">All Sources</option>
              <option value="pmr">Lagos MEPB (PMR)</option>
              <option value="tracka">BudgIT Tracka</option>
              <option value="bpp">Nigeria BPP NOCOPO</option>
            </select>
          </Field>
          <div className="flex items-end">
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? "Searching..." : "Apply Filters"}
            </Button>
          </div>
        </form>
      </Card>

      {/* LGA Evidence & Citations */}
      <LgaSourcesCard lga={lga} initialProfile={initialLgaProfile} />

      {/* Projects Table */}
      <Card title={`Verified Projects Registry (${total.toLocaleString()} records indexed)`}>
        {projects.length === 0 ? (
          <p className="py-8 text-center text-sm text-stone-500">
            No projects found matching the selected filter criteria.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-xs">
              <thead className="border-b border-stone-200 bg-stone-50 text-stone-600 font-medium">
                <tr>
                  <th className="p-3">Project & Sources</th>
                  <th className="p-3">Agency & Sector</th>
                  <th className="p-3">Data Origin</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Progress</th>
                  <th className="p-3">Contract Sum</th>
                  <th className="p-3">Risk Level</th>
                  <th className="p-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {projects.map((p) => (
                  <tr key={p.id} className="hover:bg-stone-50/80 transition-colors align-top">
                    <td className="p-3 max-w-sm">
                      <strong className="block text-stone-900 break-words">{p.name}</strong>
                      <span className="text-stone-500 text-2xs">{p.lga || "Statewide"} LGA · {p.canonicalId}</span>
                      <ProjectSourcesList sources={p.sources} />
                    </td>
                    <td className="p-3 max-w-xs">
                      <span className="block text-stone-800 truncate">{p.agency}</span>
                      <span className="text-stone-500">{p.sector}</span>
                    </td>
                    <td className="p-3 whitespace-nowrap">
                      <span className={`inline-block rounded px-2 py-0.5 text-2xs font-semibold ${p.canonicalId?.startsWith("LAGOS-PMR") ? "bg-emerald-100 text-emerald-800" : p.canonicalId?.startsWith("TRACKA") ? "bg-blue-100 text-blue-800" : p.canonicalId?.startsWith("BPP") ? "bg-purple-100 text-purple-800" : "bg-stone-200 text-stone-800"}`}>
                        {p.canonicalId?.startsWith("LAGOS-PMR") ? "Lagos PMR" : p.canonicalId?.startsWith("TRACKA") ? "BudgIT Tracka" : p.canonicalId?.startsWith("BPP") ? "Nigeria BPP" : "Kaduna OCDS"}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className="rounded-full bg-stone-100 px-2 py-0.5 text-xs text-stone-700">
                        {p.status}
                      </span>
                    </td>
                    <td className="p-3">
                      <div className="w-24">
                        <div className="flex justify-between text-2xs text-stone-600 mb-0.5">
                          <span>{p.progressPercent}%</span>
                        </div>
                        <div className="h-1.5 w-full rounded-full bg-stone-200">
                          <div
                            className="h-1.5 rounded-full bg-emerald-700"
                            style={{ width: `${Math.min(p.progressPercent, 100)}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="p-3 font-semibold text-stone-900 whitespace-nowrap">
                      {p.contractSumFormatted !== "₦0.00" ? p.contractSumFormatted : "Unrecorded"}
                    </td>
                    <td className="p-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${p.riskLevel === "Critical" ? "bg-red-100 text-red-800" : p.riskLevel === "High" ? "bg-amber-100 text-amber-800" : p.riskLevel === "Medium" ? "bg-yellow-100 text-yellow-800" : "bg-emerald-100 text-emerald-800"}`}>
                        {p.riskLevel}
                      </span>
                    </td>
                    <td className="p-3 text-right whitespace-nowrap">
                      <Button
                        secondary
                        disabled={modalLoading}
                        onClick={() => openDetail(p.id)}
                        className="py-1 px-2.5 text-xs"
                      >
                        Inspect Evidence ↗
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Controls */}
        <div className="mt-4 flex items-center justify-between border-t border-stone-200 pt-4 text-xs text-stone-600">
          <span>
            Showing {total === 0 ? 0 : offset + 1}–{Math.min(offset + limit, total)} of {total.toLocaleString()} projects
          </span>
          <div className="flex gap-2">
            <Button
              secondary
              disabled={loading || offset === 0}
              onClick={() => fetchProjects(Math.max(0, offset - limit))}
            >
              Previous
            </Button>
            <Button
              secondary
              disabled={loading || offset + limit >= total}
              onClick={() => fetchProjects(offset + limit)}
            >
              Next
            </Button>
          </div>
        </div>
      </Card>

      {/* Detail Modal */}
      {selectedProject && (
        <ProjectDetailModal
          projectData={selectedProject}
          onClose={() => setSelectedProject(null)}
        />
      )}
    </div>
  );
}
