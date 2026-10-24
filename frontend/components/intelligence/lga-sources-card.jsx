"use client";
import { useState, useEffect } from "react";
import { Card } from "../nigeria/ui";
import { LgaSourcesSection } from "./source-badges";

export function LgaSourcesCard({ lga = "", initialProfile = null }) {
  const [profile, setProfile] = useState(initialProfile);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(true);

  const activeLga = lga && lga !== "All LGAs" ? lga : "Statewide";

  useEffect(() => {
    let cancelled = false;
    async function fetchLga() {
      setLoading(true);
      try {
        const res = await fetch(`/api/decisions/lga-sources?lga=${encodeURIComponent(activeLga)}`);
        if (res.ok) {
          const data = await res.json();
          if (!cancelled) setProfile(data.profile);
        }
      } catch (err) {
        console.error("Failed to load LGA profile:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchLga();
    return () => {
      cancelled = true;
    };
  }, [activeLga]);

  if (!profile) return null;

  return (
    <Card>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-stone-200 pb-3">
        <div>
          <span className="text-2xs font-bold uppercase tracking-wider text-emerald-800">
            LGA Evidence & Indicator Baseline
          </span>
          <h3 className="text-base font-semibold text-stone-900">
            {profile.name} LGA Data & Verified Provenance
          </h3>
        </div>
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="text-xs font-medium text-emerald-800 hover:text-emerald-950 underline self-start sm:self-auto"
        >
          {open ? "Hide LGA Sources" : "Show LGA Sources ↗"}
        </button>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded border border-stone-200/80 bg-stone-50/50 p-2.5">
          <span className="text-2xs text-stone-500 block">Population (NBS Baseline)</span>
          <strong className="text-sm text-stone-900">{profile.indicators?.population?.formatted}</strong>
        </div>
        <div className="rounded border border-stone-200/80 bg-stone-50/50 p-2.5">
          <span className="text-2xs text-stone-500 block">Verified Capital Sum</span>
          <strong className="text-sm text-emerald-800">{profile.indicators?.allocations?.formatted}</strong>
        </div>
        <div className="rounded border border-stone-200/80 bg-stone-50/50 p-2.5">
          <span className="text-2xs text-stone-500 block">Indexed Projects</span>
          <strong className="text-sm text-stone-900">{profile.indicators?.projectCount?.formatted}</strong>
        </div>
        <div className="rounded border border-stone-200/80 bg-stone-50/50 p-2.5">
          <span className="text-2xs text-stone-500 block">Civic Delivery Status</span>
          <strong className="text-sm text-stone-700">{profile.indicators?.fieldMonitoring?.status}</strong>
        </div>
      </div>

      {open && (
        <LgaSourcesSection
          lgaName={profile.name}
          sources={profile.sources || []}
          indicators={profile.indicators}
        />
      )}
    </Card>
  );
}
