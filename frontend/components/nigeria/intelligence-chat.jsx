"use client";
import { useEffect, useRef, useState } from "react";
import { useDraft } from "./draft-provider";
import { Heading, Card, Button, Notice, Source, Download } from "./ui";
import { SideScroll } from "./side-scroll";
import { PlanResult } from "./plan-result";
import { Planner } from "./planner";
import { request } from "../../lib/nigeria/client.mjs";
import { engineLabel } from "../../lib/ai/labels.mjs";
import { prompts } from "../../lib/nigeria/chat-topics.mjs";

const welcome = {
  role: "assistant",
  paragraphs: [
    "What do you want to know about Nigeria? Ask about national figures, compare what states collected, or look at the plan you're drafting.",
  ],
  sources: [],
};

export function IntelligenceChat({ jurisdictions }) {
  const { config } = useDraft();
  const [messages, setMessages] = useState([welcome]);
  const [question, setQuestion] = useState("");
  const [context, setContext] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const input = useRef(null);
  const end = useRef(null);
  const inFlight = useRef(false);
  useEffect(() => {
    end.current?.scrollIntoView?.({ block: "nearest", behavior: "smooth" });
  }, [messages, busy]);

  async function send(text) {
    if (!text.trim() || inFlight.current) return;
    inFlight.current = true;
    setBusy(true);
    setError("");
    const message = text.trim();
    // Only successful turns enter the transcript, so a failed request can be retried.
    try {
      const answer = await request("chat", { message, context, config });
      setMessages((previous) => [
        ...previous,
        { role: "user", paragraphs: [message] },
        { role: "assistant", ...answer },
      ]);
      setContext(answer.context);
      setQuestion("");
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
      inFlight.current = false;
      input.current?.focus();
    }
  }

  return (
    <>
      <Heading eyebrow="Plan a budget" title="Ask about the figures">
        Ask in plain language. Answers name the year, the source, and what the figures can’t tell
        you.
      </Heading>
      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_280px]">
        <Card>
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-stone-100 pb-4">
            <div>
              <h2 className="font-semibold">Conversation</h2>
              <p className="mt-1 text-xs text-stone-500">
                The badge says whether this answer used AI. Numbers from AI are checked.
              </p>
            </div>
            <Button
              secondary
              disabled={busy || messages.length === 1}
              onClick={() => {
                setMessages([welcome]);
                setContext(null);
                setError("");
                setQuestion("");
              }}
            >
              New conversation
            </Button>
          </div>
          <div
            role="log"
            aria-label="Data conversation"
            aria-live="polite"
            aria-busy={busy}
            className="max-h-[650px] space-y-6 overflow-y-auto pr-1"
          >
            {messages.map((message, index) => (
              <article
                key={index}
                className={
                  message.role === "user"
                    ? "ml-6 rounded-lg bg-stone-100 p-4 md:ml-16"
                    : "space-y-4 py-2"
                }
              >
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-stone-500">
                  {message.role === "user" ? "You" : "NationOS"}
                  {message.mode ? ` · ${engineLabel(message.mode, message.aiStatus)}` : ""}
                </p>
                {message.paragraphs.map((paragraph, i) => (
                  <p key={i} className="whitespace-pre-wrap text-sm leading-7 text-stone-700">
                    {paragraph}
                  </p>
                ))}
                {message.table && (
                  <SideScroll>
                    <table className="w-full min-w-[28rem] text-sm">
                      <thead>
                        <tr>
                          {message.table.columns.map((column) => (
                            <th key={column}>{column}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {message.table.rows.map((row, i) => (
                          <tr key={i}>
                            {row.map((cell, j) => (
                              <td key={j}>{cell}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </SideScroll>
                )}
                {!!message.sources?.length && (
                  <div className="flex flex-wrap gap-3 border-t border-stone-100 pt-3">
                    {message.sources.map((source) => (
                      <Source key={source.id} id={source.id}>
                        {source.publisher} · {source.period}
                      </Source>
                    ))}
                  </div>
                )}
                {message.result && (
                  <details className="rounded-lg border border-stone-200 p-4">
                    <summary className="text-sm font-medium max-md:flex max-md:min-h-11 max-md:items-center">
                      See the yearly figures and the guesses
                    </summary>
                    <PlanResult result={message.result} />
                    <div className="mt-4">
                      <Download value={message} />
                    </div>
                  </details>
                )}
              </article>
            ))}
            <div ref={end} />
            {busy && (
              <p role="status" className="text-sm text-stone-500">
                Checking the figures…
              </p>
            )}
          </div>
          {error && (
            <div className="mt-4">
              <Notice error>{error}</Notice>
            </div>
          )}
          <form
            className="mt-6 border-t border-stone-100 pt-5"
            onSubmit={(event) => {
              event.preventDefault();
              send(question);
            }}
          >
            <label htmlFor="intelligence-question" className="mb-2 block text-sm font-medium">
              Ask a question
            </label>
            <textarea
              ref={input}
              id="intelligence-question"
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              maxLength={2000}
              placeholder="For example: How has Kano’s IGR changed since 2019?"
              disabled={busy}
            />
            <div className="mt-3 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <span className="text-xs text-stone-400">
                This chat stays on this page. Saved decisions are stored in the shared database.
              </span>
              <Button disabled={busy || !question.trim()} type="submit">
                {busy ? "Checking…" : "Send"}
              </Button>
            </div>
          </form>
        </Card>
        <div className="space-y-5">
          <Card title="Try one of these">
            <div className="space-y-2">
              {prompts.map((prompt) => (
                <button
                  key={prompt}
                  disabled={busy}
                  onClick={() => send(prompt)}
                  className="w-full rounded-md border border-stone-200 p-3 text-left text-xs leading-5 text-stone-600 hover:border-emerald-600 hover:text-emerald-900 disabled:opacity-40 max-md:min-h-11 max-md:text-base"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </Card>
          <Card title="What you can ask about">
            <ul className="space-y-3 text-xs leading-6 text-stone-500">
              <li>37 jurisdictions · NBS IGR, 2019–2025</li>
              <li>11 national indicators · individual reporting years</li>
              <li>2025 approved federal budget</li>
              <li>Your 5- or 10-year guesses for a plan</li>
            </ul>
            <p className="mt-4 border-t border-stone-100 pt-4 text-xs leading-6 text-stone-500">
              Answers follow questions we can match, and the arithmetic is shown. Missing data and
              policy effects are not invented.
            </p>
          </Card>
        </div>
      </div>
      <details className="mt-8 rounded-xl border border-stone-200 bg-white p-5">
        <summary className="font-medium max-md:flex max-md:min-h-11 max-md:items-center">
          Guesses and the decision builder
        </summary>
        <p className="mt-3 text-sm leading-6 text-stone-500">
          Change the inputs used when you ask “Model my current investment plan”. Work out the plan
          here if you want to save it with your reason.
        </p>
        <div className="mt-8">
          <Planner jurisdictions={jurisdictions} />
        </div>
      </details>
    </>
  );
}
