"use client";
import { useState } from "react";
import { Card, Button, Field, Notice } from "../nigeria/ui";

const PROMPT_SUGGESTIONS = [
  "Which unfinished projects in Lagos should receive funding first?",
  "Which LGAs have the highest number of stalled projects?",
  "How should ₦100 billion be allocated across Lagos State?",
  "Which projects have recorded allocations but no verified completion evidence?",
];

export function DecisionAiChat() {
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState(null);
  const [error, setError] = useState("");

  async function handleAsk(queryText = question) {
    if (!queryText.trim()) return;
    setLoading(true);
    setError("");
    setQuestion(queryText);

    try {
      const res = await fetch("/api/decisions/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: queryText }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to analyze question.");
      }

      const data = await res.json();
      setResponse(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <Card title="Grounded Decision Intelligence Advisor">
        <p className="mb-4 text-xs text-stone-500">
          Ask questions regarding Lagos State capital allocation, delayed infrastructure, and procurement observations. Every factual statement is strictly verified against indexed records.
        </p>

        {/* Suggestion Prompts */}
        <div className="mb-4 flex flex-wrap gap-2">
          {PROMPT_SUGGESTIONS.map((prompt, idx) => (
            <button
              key={idx}
              type="button"
              disabled={loading}
              onClick={() => handleAsk(prompt)}
              className="rounded-full border border-stone-200 bg-stone-50 px-3 py-1.5 text-xs text-stone-700 hover:bg-stone-100 hover:border-stone-300 transition-colors"
            >
              {prompt}
            </button>
          ))}
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleAsk();
          }}
          className="flex flex-col gap-3 sm:flex-row"
        >
          <div className="flex-1">
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Ask an evidence-based decision question..."
              className="w-full rounded-md border border-stone-300 p-2.5 text-sm"
            />
          </div>
          <Button type="submit" disabled={loading || !question.trim()}>
            {loading ? "Analyzing Database..." : "Ask Decision Engine"}
          </Button>
        </form>

        {error && <div className="mt-4"><Notice error>{error}</Notice></div>}
      </Card>

      {/* Response Panel */}
      {response && (
        <Card title="Evidence-Grounded Intelligence Report">
          <div className="flex items-center justify-between border-b border-stone-200 pb-3 text-xs text-stone-500">
            <span>
              Engine: <strong className="text-emerald-900 font-medium capitalize">{response.engine}</strong>
            </span>
            <span>Grounded Citation Standard: Enforced</span>
          </div>

          <div className="mt-4 whitespace-pre-wrap text-sm leading-6 text-stone-800">
            {response.answer}
          </div>

          {/* Verified Facts */}
          {response.verifiedFacts && response.verifiedFacts.length > 0 && (
            <div className="mt-5 rounded-lg border border-emerald-100 bg-emerald-50/50 p-4">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-emerald-900 mb-2">
                Verified Database Facts
              </h4>
              <ul className="space-y-1.5 text-xs text-emerald-950">
                {response.verifiedFacts.map((fact, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-emerald-700">✓</span>
                    <span>{fact}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Actionable Recommendations */}
          {response.recommendations && response.recommendations.length > 0 && (
            <div className="mt-4 rounded-lg border border-stone-200 bg-stone-50 p-4">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-stone-700 mb-2">
                Policy Recommendations
              </h4>
              <ul className="space-y-1.5 text-xs text-stone-800">
                {response.recommendations.map((rec, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-stone-500">→</span>
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Supporting Clickable Citations */}
          {response.citations && response.citations.length > 0 && (
            <div className="mt-5 border-t border-stone-200 pt-4">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-stone-500 mb-2">
                Supporting Citations & Evidence
              </h4>
              <div className="space-y-2">
                {response.citations.map((c, i) => (
                  <div key={i} className="flex items-center justify-between rounded-md border border-stone-200 bg-white p-2.5 text-xs">
                    <div>
                      <strong className="text-stone-900">{c.label}</strong>
                      <p className="text-stone-500">{c.reference}</p>
                    </div>
                    <a
                      href={c.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded border border-stone-300 px-2.5 py-1 text-xs text-emerald-800 hover:bg-stone-50"
                    >
                      View Source ↗
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
