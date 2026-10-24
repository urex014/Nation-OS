"use client";
import { useState } from "react";
import { Heading, Stat, Card, Button } from "../nigeria/ui";
import { ProjectExplorer } from "./project-explorer";
import { BudgetWorkspace } from "./budget-workspace";
import { DecisionAiChat } from "./decision-ai-chat";
import { SourceTransparency } from "./source-transparency";
import { DataHealthPanel } from "./data-health-panel";
import { ProjectDecisionRecords } from "./project-decision-records";
import { DecisionRecords } from "../nigeria/decision-records";

export function DecisionsSystem({
  overview,
  initialProjects = [],
  initialProjectsTotal = 0,
  sources = [],
  healthData,
  canReview = false,
  initialSavedDecisions,
  decisionAnalyses = { records: [], total: 0 },
}) {
  const [activeTab, setActiveTab] = useState("explorer");

  const tabs = [
    { id: "explorer", label: "Project Explorer" },
    { id: "workspace", label: "Budget Allocation Workspace" },
    { id: "ai", label: "AI Decision Intelligence" },
    { id: "sources", label: "Source Transparency" },
    { id: "health", label: "Data Health" },
    { id: "saved", label: "Saved Decision Records" },
  ];

  return (
    <div className="space-y-8">
      <Heading
        eyebrow="Government Project Intelligence & Budget Decisions"
        title="Lagos State Project Intelligence & Allocation System"
      >
        Consolidated capital project records from Lagos State PMR, BudgIT Tracka, and BPP Open Contracting. Trace every allocation to verified field evidence, identify delayed infrastructure, and simulate evidence-grounded budget allocations.
      </Heading>

      {/* Verified Data Provenance Banner */}
      <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-stone-100 pb-3">
          <div>
            <span className="text-2xs font-bold uppercase tracking-wider text-emerald-800">
              Verified Data Provenance
            </span>
            <h3 className="text-sm font-semibold text-stone-900">
              Where NationOS Decisions Data Comes From
            </h3>
          </div>
          <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
            4 Verified External Sources Connected
          </span>
        </div>
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg border border-stone-100 bg-stone-50/60 p-3">
            <div className="flex items-center justify-between">
              <strong className="text-xs font-semibold text-stone-900">Lagos MEPB (PMR)</strong>
              <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-2xs font-medium text-emerald-800">Primary</span>
            </div>
            <p className="mt-1 text-2xs text-stone-600">
              Official Lagos State capital project implementation, MDA assignments, and progress %
            </p>
            <a href="https://pmr.lagosmepb.org/" target="_blank" rel="noopener noreferrer" className="mt-1.5 block text-2xs text-emerald-700 hover:underline">
              pmr.lagosmepb.org →
            </a>
          </div>
          <div className="rounded-lg border border-stone-100 bg-stone-50/60 p-3">
            <div className="flex items-center justify-between">
              <strong className="text-xs font-semibold text-stone-900">BudgIT Tracka</strong>
              <span className="rounded bg-blue-100 px-1.5 py-0.5 text-2xs font-medium text-blue-800">Civic Ground-Truth</span>
            </div>
            <p className="mt-1 text-2xs text-stone-600">
              Citizen tracking, field verification reports, photos, and downloadable PDF audits
            </p>
            <a href="https://www.yourtracka.org/ng/projects" target="_blank" rel="noopener noreferrer" className="mt-1.5 block text-2xs text-emerald-700 hover:underline">
              yourtracka.org →
            </a>
          </div>
          <div className="rounded-lg border border-stone-100 bg-stone-50/60 p-3">
            <div className="flex items-center justify-between">
              <strong className="text-xs font-semibold text-stone-900">BPP NOCOPO (OCDS)</strong>
              <span className="rounded bg-purple-100 px-1.5 py-0.5 text-2xs font-medium text-purple-800">Procurement</span>
            </div>
            <p className="mt-1 text-2xs text-stone-600">
              Federal & State open contracting releases, contract awards, suppliers, and values
            </p>
            <a href="https://data.open-contracting.org/en/search/" target="_blank" rel="noopener noreferrer" className="mt-1.5 block text-2xs text-emerald-700 hover:underline">
              open-contracting.org →
            </a>
          </div>
          <div className="rounded-lg border border-stone-100 bg-stone-50/60 p-3">
            <div className="flex items-center justify-between">
              <strong className="text-xs font-semibold text-stone-900">Kaduna OCDS</strong>
              <span className="rounded bg-stone-200 px-1.5 py-0.5 text-2xs font-medium text-stone-700">Quarantined</span>
            </div>
            <p className="mt-1 text-2xs text-stone-600">
              Kaduna state procurement benchmark; strictly isolated from Lagos records
            </p>
            <a href="https://ocds.kdsg.gov.ng/" target="_blank" rel="noopener noreferrer" className="mt-1.5 block text-2xs text-emerald-700 hover:underline">
              ocds.kdsg.gov.ng →
            </a>
          </div>
        </div>
      </div>

      {/* Decision Overview Stats Bar */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <Stat
          label="Total Indexed Projects"
          value={overview?.totalProjects?.toLocaleString() || "0"}
          note="Consolidated Lagos records"
        />
        <Stat
          label="Ongoing Works"
          value={overview?.ongoingProjects?.toLocaleString() || "0"}
          note="Active capital commitments"
        />
        <Stat
          label="Completed & Verified"
          value={overview?.completedProjects?.toLocaleString() || "0"}
          note="100% recorded progress"
        />
        <Stat
          label="Requiring Verification"
          value={overview?.requiringVerification?.toLocaleString() || "0"}
          note="Flagged schedule or funding risk"
        />
        <Stat
          label="Reported Abandoned"
          value={overview?.abandonedProjects?.toLocaleString() || "0"}
          note="Explicit field abandonment reports"
        />
        <Stat
          label="Verified Commitments"
          value={overview?.verifiedAllocationsCompact || "₦0"}
          note="Traceable contract sums"
        />
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-stone-200">
        <nav className="flex space-x-2 overflow-x-auto pb-1" aria-label="Decision Tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`whitespace-nowrap px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
                activeTab === tab.id
                  ? "border-emerald-900 text-emerald-900 font-semibold"
                  : "border-transparent text-stone-500 hover:text-stone-800 hover:border-stone-300"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Panels */}
      {activeTab === "explorer" && (
        <ProjectExplorer
          initialProjects={initialProjects}
          initialTotal={initialProjectsTotal}
        />
      )}

      {activeTab === "workspace" && <BudgetWorkspace />}

      {activeTab === "ai" && <DecisionAiChat />}

      {activeTab === "sources" && <SourceTransparency sources={sources} />}

      {activeTab === "health" && (
        <DataHealthPanel
          healthData={healthData}
          canSync={canReview}
          onSyncComplete={() => window.location.reload()}
        />
      )}

      {activeTab === "saved" && (
        <div className="space-y-8">
          <ProjectDecisionRecords initialAnalyses={decisionAnalyses} />
          <div className="border-t border-stone-200 pt-8">
            <DecisionRecords
              initial={initialSavedDecisions}
              canReview={canReview}
            />
          </div>
        </div>
      )}
    </div>
  );
}
