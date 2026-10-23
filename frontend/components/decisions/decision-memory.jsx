"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useSavedRecords } from "../../hooks/use-saved-records";
import { useWorkspace } from "../workspace/provider";
import { downloadJson } from "../../lib/client/download.mjs";
import { money } from "../../lib/client/country.mjs";
import { Heading, Panel, Button, Note } from "../ui/primitives";

export function DecisionMemory() {
  const [plans, writePlans] = useSavedRecords("nationos-plans");
  const [legacy] = useSavedRecords("nationos-decisions");
  const [error, setError] = useState("");
  const { setDraft } = useWorkspace();
  const router = useRouter();
  function review(index) {
    try {
      writePlans(
        plans.map((plan, item) => (item === index ? { ...plan, reviewed: !plan.reviewed } : plan)),
      );
    } catch {
      setError("Unable to save the review. Export the record to preserve it.");
    }
  }
  return (
    <>
      <Heading
        eyebrow="Continuity & accountability"
        title="Decision memory"
        action={
          <Button onClick={() => downloadJson("nationos-decision-archive.json", { plans, legacy })}>
            Export archive
          </Button>
        }
      >
        Preserve the evidence, assumptions and numerical scenarios behind a proposal. Another
        administration can inspect what was intended and why.
      </Heading>
      <Note>
        Records are stored in this browser and origin, not a shared institutional database. Reviewed
        does not mean approved. Measured progress has not been supplied.
      </Note>
      {error && <Note error>{error}</Note>}
      {!plans.length && (
        <Panel title="No long-term plans saved">
          <p>Create and save a proposal from Recommendations & plans.</p>
        </Panel>
      )}
      {plans.map((plan, index) => (
        <Panel key={plan.id || index} title={plan.title || "Untitled imported proposal"}>
          <p className="text-sm leading-7">{plan.reason}</p>
          <p className="text-xs text-stone-500">
            {plan.date} Â· {plan.origin} Â· {plan.reviewed ? "Reviewed" : "Awaiting review"}
          </p>
          {plan.result?.config && (
            <>
              <p className="text-sm">
                {plan.result.config.years} years Â· {money(plan.result.annualCost)} per year Â·
                dataset {plan.result.dataset}
              </p>
              <div className="flex flex-wrap gap-2">
                <Button
                  onClick={() => {
                    setDraft({
                      title: plan.title,
                      reason: plan.reason,
                      config: plan.result.config,
                      origin: plan.origin,
                      aiProvenance: plan.aiProvenance,
                      comparisonProvenance: plan.comparisonProvenance,
                    });
                    router.push("/recommendations");
                  }}
                >
                  Open a new calculation
                </Button>
                <Button onClick={() => review(index)}>
                  {plan.reviewed ? "Mark unreviewed" : "Mark reviewed"}
                </Button>
                <Button onClick={() => downloadJson("nationos-saved-plan.json", plan)}>
                  Export snapshot
                </Button>
              </div>
            </>
          )}
          <details>
            <summary className="text-sm">Inspect preserved snapshot</summary>
            <pre className="mt-3 max-h-80 overflow-auto bg-stone-50 p-4 text-xs">
              {JSON.stringify(plan, null, 2)}
            </pre>
          </details>
        </Panel>
      ))}
      {legacy.length > 0 && (
        <Panel title={`${legacy.length} earlier short-horizon decisions`}>
          <p className="text-sm">
            Earlier records are preserved without rewriting their historical model outputs.
          </p>
          <pre className="max-h-96 overflow-auto text-xs">{JSON.stringify(legacy, null, 2)}</pre>
        </Panel>
      )}
    </>
  );
}
