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

export function IntelligenceChat({ jurisdictions, children }) {
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
      <Heading eyebrow="Project intelligence" title="Ask about the figures">
        Ask the way you would ask a person. Answers name the year and the source, and they say what
        the figures can’t tell you. The tax slider below starts from the published Lagos collection.
      </Heading>
      {children}
      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_280px]">
        <section
          className="project-intelligence min-w-0 p-4 sm:p-5"
          aria-label="Project intelligence"
        >
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-semibold">Project intelligence</h2>
              <p className="mt-1 text-xs" style={{ color: "var(--pi-muted)" }}>
                Chat with the published figures. The badge says if AI helped, and the numbers are
                checked.
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
            className="flex max-h-[32rem] flex-col gap-3 overflow-y-auto pr-1"
          >
            {messages.map((message, index) => {
              const mine = message.role === "user";
              return (
                <article
                  key={index}
                  className={mine ? "ml-8 max-w-[85%] self-end" : "mr-6 max-w-[92%] self-start"}
                >
                  <div
                    className={`rounded-2xl px-3 py-2 text-sm leading-6 ${mine ? "pi-user rounded-br-md" : "pi-assistant rounded-bl-md"}`}
                  >
                    {message.paragraphs.map((paragraph, i) => (
                      <p key={i} className="whitespace-pre-wrap">
                        {paragraph}
                      </p>
                    ))}
                    {message.table && (
                      <div className="mt-3">
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
                      </div>
                    )}
                  </div>
                  {message.mode ? (
                    <p className="mt-2 inline-flex rounded-full bg-stone-100 px-2.5 py-1 text-[11px] font-semibold text-stone-600">
                      {engineLabel(message.mode, message.aiStatus)}
                    </p>
                  ) : null}
                  {!!message.sources?.length && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {message.sources.map((source) => (
                        <Source key={source.id} id={source.id}>
                          {source.publisher} · {source.period}
                        </Source>
                      ))}
                    </div>
                  )}
                  {message.result && (
                    <details className="mt-2 rounded-lg border border-stone-200 p-4">
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
              );
            })}
            {busy && (
              <p
                className="pi-assistant mr-6 self-start rounded-2xl px-3 py-2 text-sm"
                role="status"
              >
                Checking the figures…
              </p>
            )}
            <div ref={end} />
          </div>
          {error && (
            <div className="mt-4">
              <Notice error>{error}</Notice>
            </div>
          )}
          <form
            className="mt-4 flex items-end gap-2 border-t border-stone-200/80 pt-3"
            onSubmit={(event) => {
              event.preventDefault();
              send(question);
            }}
          >
            <label htmlFor="intelligence-question" className="min-w-0 flex-1 text-sm">
              <span className="sr-only">Ask a question</span>
              <textarea
                ref={input}
                id="intelligence-question"
                value={question}
                onChange={(event) => setQuestion(event.target.value)}
                maxLength={2000}
                rows={2}
                style={{ minHeight: "44px" }}
                className="max-h-32 resize-y rounded-2xl"
                placeholder="For example: How has Kano’s IGR changed since 2019?"
                disabled={busy}
              />
            </label>
            <button
              type="submit"
              disabled={busy || !question.trim()}
              className="inline-flex min-h-11 shrink-0 items-center rounded-md bg-emerald-900 px-4 text-sm font-medium text-white disabled:opacity-40"
            >
              {busy ? "Checking…" : "Send"}
            </button>
          </form>
          <p className="mt-2 text-xs" style={{ color: "var(--pi-muted)" }}>
            This chat stays on this page. Saved decisions are stored in the shared database.
          </p>
        </section>
        <div className="space-y-5">
          <Card title="Try one of these">
            <div className="space-y-2">
              {prompts.map((prompt) => (
                <button
                  key={prompt}
                  disabled={busy}
                  onClick={() => send(prompt)}
                  className="w-full rounded-full border border-stone-200 px-3 py-2 text-left text-xs leading-5 text-stone-600 hover:border-emerald-600 hover:text-emerald-900 disabled:opacity-40 max-md:min-h-11 max-md:text-base"
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
