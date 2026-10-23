"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useWorkspace } from "../workspace/provider";
import { useAnalyst } from "../../hooks/use-analyst";
import { states } from "../../lib/client/country.mjs";
import { Button, Field, Heading, Note, Panel } from "../ui/primitives";
import { AnalystReport } from "./analyst-report";

const prompts = [
  [
    "Find service priorities",
    "Compare all states and explain the largest education and healthcare gaps",
  ],
  [
    "Learn from peers",
    "Which states perform best overall, and what evidence is missing before applying their approach elsewhere?",
  ],
  ["Draft an investment", "Draft a 10-year education and water plan with 200 million per year"],
];
export function AnalystWorkspace() {
  const [question, setQuestion] = useState(""),
    [scope, setScope] = useState("all");
  const { draft, setDraft } = useWorkspace();
  const router = useRouter();
  const { status, report, error, busy, analyze } = useAnalyst();
  function submit(mode) {
    if (!question.trim()) return;
    analyze({ question, scope, mode });
  }
  function applyReport(value) {
    const { title, reason, ...config } = value.proposal;
    setDraft({
      title,
      reason,
      config,
      origin: value.mode === "ai" ? "AI-assisted draft" : "Automated local analysis",
      aiProvenance: {
        question: value.question,
        mode: value.mode,
        model: value.model,
        engine: value.engine,
        created: value.created,
        sources: value.sources,
        findings: value.findings,
        gaps: value.gaps,
        assumptions: value.assumptions,
      },
    });
    router.push("/recommendations");
  }
  return (
    <>
      <Heading eyebrow="Evidence analysis" title="Data & AI analyst">
        Ask about the country, investigate service gaps and review conditional policy proposals.
      </Heading>
      <Note>
        {status.configured
          ? `Live AI configured: ${status.model}. Access is verified when a request succeeds.`
          : "Automated analysis is available without a key or model download. Live generative AI is optional."}{" "}
        Local analysis and stress review use explicit rules and numerical models.
      </Note>
      <div className="grid gap-6 xl:grid-cols-2">
        <Panel title="Ask about Aderin">
          <form
            onSubmit={(event) => {
              event.preventDefault();
              submit("local");
            }}
            className="space-y-4"
          >
            <Field label="Question or proposal request">
              <textarea
                required
                maxLength={4000}
                value={question}
                onChange={(event) => setQuestion(event.target.value)}
                placeholder="Draft a five-year education plan for Kora State"
              />
            </Field>
            <Field label="Evidence scope">
              <select value={scope} onChange={(event) => setScope(event.target.value)}>
                <option value="all">Whole country / detect state in question</option>
                {states.map((state) => (
                  <option key={state.id} value={state.id}>
                    {state.name}
                  </option>
                ))}
              </select>
            </Field>
            <div className="flex flex-wrap gap-2">
              <Button primary type="submit" disabled={busy}>
                {busy ? "Analysingâ€¦" : "Analyse question"}
              </Button>
              <Button disabled={busy || !question.trim()} onClick={() => submit("evidence")}>
                Search evidence
              </Button>
              <Button
                disabled={busy || !question.trim() || !status.configured}
                onClick={() => submit("ai")}
              >
                Ask live AI
              </Button>
            </div>
          </form>
        </Panel>
        <Panel title="Investigation tools">
          <div className="flex flex-wrap gap-2">
            {prompts.map(([label, value]) => (
              <Button key={label} onClick={() => setQuestion(value)}>
                {label}
              </Button>
            ))}
          </div>
          <h3>Review the current proposal</h3>
          <p className="text-sm leading-7">
            Stress-test the current planning inputs for delivery, population growth and maintenance.
            The server recomputes outcomes and suggests evidence to monitor. No decision is saved.
          </p>
          <Button
            disabled={busy}
            onClick={() =>
              analyze({
                question: `Review ${draft.title}`,
                scope: draft.config.scope,
                mode: "review",
                proposal: draft.config,
              })
            }
          >
            Review risks & stress-test plan
          </Button>
          <details className="text-sm leading-7">
            <summary>Optional live AI setup</summary>
            <p>
              Copy .env.example to .env inside frontend, set OPENAI_API_KEY on the server and
              restart Next. Aggregate fictional evidence is sent to the provider; individual citizen
              profiles and saved decisions are excluded.
            </p>
          </details>
        </Panel>
      </div>
      {error && <Note error>{error}</Note>}
      {report && <AnalystReport report={report} onApply={applyReport} />}
    </>
  );
}
