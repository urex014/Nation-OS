import React from "react";
import { downloadJson } from "../../lib/client/download.mjs";
import { money } from "../../lib/client/country.mjs";
import { Button, Note, Panel } from "../ui/primitives";
import { ReviewResults } from "./review-results";

export function AnalystReport({ report, onApply }) {
  // React escapes provider text; never insert model output through innerHTML.
  return (
    <div className="space-y-6">
      <Panel
        title={
          report.mode === "ai"
            ? "Live AI analysis"
            : report.mode === "review"
              ? "Proposal review"
              : report.mode === "local"
                ? "Automated analysis"
                : "Retrieved evidence"
        }
        action={
          <Button onClick={() => downloadJson("nationos-analysis.json", report)}>
            Download report
          </Button>
        }
      >
        <p className="text-xs uppercase tracking-wide text-stone-500">
          {report.model || report.engine || "Local evidence search"}
        </p>
        <p className="text-sm leading-7">{report.summary}</p>
        {report.findings.map((finding, index) => (
          <article key={index} className="border-l-2 border-stone-200 pl-4 text-sm leading-7">
            <p>{finding.text}</p>
            <p className="text-xs text-accent">Sources: {finding.sourceIds.join(", ")}</p>
          </article>
        ))}
        <h3>Evidence gaps</h3>
        <ul className="list-disc space-y-2 pl-5 text-sm leading-6">
          {report.gaps.map((gap) => (
            <li key={gap}>{gap}</li>
          ))}
        </ul>
        <h3>Assumptions</h3>
        <ul className="list-disc space-y-2 pl-5 text-sm leading-6">
          {report.assumptions.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        <h3>Inspect sources</h3>
        {report.sources.map((source) => (
          <details key={source.id} className="border-b border-stone-200 pb-3">
            <summary className="text-sm">
              {source.id} Â· {source.title}
            </summary>
            <p className="my-3 text-sm leading-7">{source.summary}</p>
            <pre className="max-h-64 overflow-auto bg-stone-50 p-3 text-xs">
              {JSON.stringify(source.values, null, 2)}
            </pre>
          </details>
        ))}
        <Note>
          Sources describe synthetic baselines. A citation does not establish causal validity or
          prove an intervention will work.
        </Note>
      </Panel>
      {report.review && <ReviewResults review={report.review} />}
      {report.proposal && (
        <Panel title={report.proposal.title}>
          <p className="text-sm leading-7">{report.proposal.reason}</p>
          <p className="text-sm">
            {report.proposal.years} years Â· {money(report.modelResult.annualCost)} annually Â·{" "}
            {money(report.modelResult.totalCost)} total
          </p>
          <Button primary onClick={() => onApply(report)}>
            Review & edit in recommendations
          </Button>
        </Panel>
      )}
    </div>
  );
}
