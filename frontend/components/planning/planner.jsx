"use client";
import React, { useState } from "react";
import { useWorkspace } from "../workspace/provider";
import { useSavedRecords } from "../../hooks/use-saved-records";
import { calculatePlan, defaultPlan, definitions, suggestions } from "../../lib/client/country.mjs";
import { downloadJson } from "../../lib/client/download.mjs";
import { Button, Heading, Note, Panel } from "../ui/primitives";
import { PlanForm } from "./plan-form";
import { PlanResults } from "./plan-results";

export function Planner() {
  const { draft, setDraft } = useWorkspace();
  const [plans, writePlans] = useSavedRecords("nationos-plans");
  const [result, setResult] = useState(() => calculatePlan(draft.config));
  const [message, setMessage] = useState("");
  const calculate = () => {
    try {
      const run = calculatePlan(draft.config);
      setResult(run);
      setMessage("Scenarios recalculated. Review the assumptions before saving.");
      return run;
    } catch (error) {
      setMessage(error.message);
      return null;
    }
  };
  function save() {
    if (!draft.title.trim() || !draft.reason.trim())
      return setMessage("Add a title and reasoning before saving.");
    const run = calculate();
    if (!run?.annualCost) return setMessage("Allocate an annual investment before saving.");
    try {
      writePlans([
        {
          id: crypto.randomUUID(),
          title: draft.title,
          reason: draft.reason,
          origin: draft.origin,
          date: new Date().toISOString(),
          reviewed: false,
          result: run,
          aiProvenance: draft.aiProvenance || null,
          comparisonProvenance: draft.comparisonProvenance || null,
        },
        ...plans,
      ]);
      setMessage("Proposal saved in this browser with its complete model snapshot.");
    } catch {
      setMessage("Browser storage is unavailable or full. Download the model to preserve it.");
    }
  }
  function applySuggestion(suggestion) {
    const config = {
      ...draft.config,
      scope: suggestion.stateId,
      budgets: Object.fromEntries(
        Object.keys(definitions).map((key) => [key, key === suggestion.sector ? 100 : 0]),
      ),
    };
    setDraft({
      title: `Improve ${definitions[suggestion.sector].name} in ${suggestion.state}`,
      reason: suggestion.reason,
      origin: "System gap-rule suggestion",
      config,
    });
    setResult(calculatePlan(config));
  }
  return (
    <>
      <Heading
        eyebrow="Recommendations & long-term planning"
        title="From evidence to a reviewable plan"
        action={
          <Button
            onClick={() => {
              setDraft({
                title: "New public-service proposal",
                reason: "",
                origin: "Analyst proposal",
                config: structuredClone(defaultPlan),
              });
              setResult(calculatePlan(defaultPlan));
            }}
          >
            New proposal
          </Button>
        }
      >
        Compare suggestions or your own proposal across five or ten years. Saved proposals remain
        drafts until reviewed.
      </Heading>
      <Panel title="Priorities suggested by service gaps">
        <div className="grid gap-4 lg:grid-cols-3">
          {suggestions()
            .slice(0, 3)
            .map((item) => (
              <article
                key={`${item.stateId}-${item.sector}`}
                className="space-y-3 border-l-2 border-stone-200 pl-4"
              >
                <h3>{item.state}</h3>
                <p className="text-sm leading-6 text-stone-600">{item.reason}</p>
                <Button onClick={() => applySuggestion(item)}>Use suggestion</Button>
              </article>
            ))}
        </div>
      </Panel>
      {message && <Note>{message}</Note>}
      <PlanForm
        draft={draft}
        onChange={setDraft}
        onCalculate={calculate}
        onSave={save}
        onDownload={() => {
          const run = calculate();
          if (run) downloadJson("nationos-model.json", { ...draft, result: run });
        }}
      />
      <PlanResults result={result} />
    </>
  );
}
