"use client";

import { useState } from "react";
import { engineLabel } from "../../lib/ai/labels.mjs";
import { Button, Notice } from "../nigeria/ui";

export function Advisor({ heading, intro, prompts }) {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [mode, setMode] = useState("");
  const [aiStatus, setAiStatus] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function ask(text) {
    const message = text.trim();
    if (!message || busy) return;
    setBusy(true);
    setError("");
    setAnswer("");
    setMode("");
    setAiStatus("");
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ message, stream: true }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw Error(data.error || "The advisor could not answer.");
      }
      setMode(response.headers.get("x-nationos-mode") || "local-data");
      setAiStatus(response.headers.get("x-nationos-ai-status") || "");
      const reader = response.body?.getReader();
      if (!reader) {
        setAnswer(await response.text());
        return;
      }
      const decoder = new TextDecoder();
      let all = "";
      while (true) {
        const step = await reader.read();
        if (step.done) break;
        all += decoder.decode(step.value, { stream: true });
        setAnswer(all);
      }
      all += decoder.decode();
      setAnswer(all);
    } catch (caught) {
      setError(caught.message || "The advisor could not answer.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="rounded-xl border border-stone-200 bg-white p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-semibold">{heading}</h2>
        {mode && (
          <p className="rounded-full bg-stone-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-stone-600">
            {engineLabel(mode, aiStatus)}
          </p>
        )}
      </div>
      <p className="mt-2 text-sm leading-6 text-stone-600">{intro}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        {prompts.map((prompt) => (
          <button
            key={prompt}
            type="button"
            disabled={busy}
            onClick={() => {
              setQuestion(prompt);
              ask(prompt);
            }}
            className="rounded-md border border-stone-200 px-3 py-2 text-left text-xs leading-5 text-stone-600 hover:border-emerald-700 disabled:opacity-40"
          >
            {prompt}
          </button>
        ))}
      </div>
      <form
        className="mt-4 space-y-3"
        onSubmit={(event) => {
          event.preventDefault();
          ask(question);
        }}
      >
        <label className="block text-sm text-stone-600" htmlFor="advisor-question">
          Your question
          <textarea
            id="advisor-question"
            className="mt-2 w-full"
            maxLength={2000}
            value={question}
            disabled={busy}
            onChange={(event) => setQuestion(event.target.value)}
          />
        </label>
        <Button type="submit" disabled={busy || !question.trim()}>
          {busy ? "Checking…" : "Ask"}
        </Button>
      </form>
      {error && (
        <div className="mt-4">
          <Notice error>{error}</Notice>
        </div>
      )}
      {answer && (
        <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-stone-700">{answer}</p>
      )}
    </section>
  );
}
