"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { engineLabel } from "../../lib/ai/labels.mjs";
import { useAdvisor } from "./advisor-state";

const SUGGESTIONS = [
  "How much did Lagos raise in 2025?",
  "What is the federal budget headline, and is it Lagos spending?",
  "Compare Lagos and Rivers revenue.",
  "What if Lagos tax collections were 10% lower than the published figure?",
];

function clock(at) {
  return new Date(at).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

function Avatar() {
  return (
    <span
      className="mt-1 inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-[#0B3B2C] text-xs font-semibold text-white"
      aria-hidden="true"
    >
      A
    </span>
  );
}

function ReplyTable({ table }) {
  if (!table?.columns?.length || !table.rows?.length) return null;
  return (
    <div className="mt-3 overflow-x-auto rounded-md border border-stone-200 bg-white">
      <table className="w-full min-w-[16rem] border-collapse text-left text-xs">
        <thead>
          <tr>
            {table.columns.map((column) => (
              <th key={column}>{column}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {table.rows.map((row, index) => (
            <tr key={index}>
              {row.map((cell, cellIndex) => (
                <td key={`${index}-${cellIndex}`}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function AdvisorLaunch() {
  const { openPanel } = useAdvisor();
  return (
    <section className="rounded-xl border border-stone-200 bg-white p-6">
      <h2 className="font-semibold">AI advisor</h2>
      <p className="mt-2 text-sm leading-6 text-stone-600">
        The advisor stays on the right on a large screen. On a phone, tap Ask the advisor. It uses
        the published figures. If AI is not set up, you still get an answer from the data.
      </p>
      <button
        type="button"
        onClick={openPanel}
        className="mt-4 inline-flex min-h-11 items-center rounded-md bg-emerald-900 px-4 text-sm font-medium text-white"
      >
        Open the advisor
      </button>
    </section>
  );
}

export function AdvisorPanel() {
  const { enabled, open, messages, busy, openPanel, closePanel, ask } = useAdvisor();
  const [draft, setDraft] = useState("");
  const [wide, setWide] = useState(false);
  const titleId = useId();
  const inputRef = useRef(null);
  const endRef = useRef(null);
  const panelRef = useRef(null);

  useEffect(() => {
    const query = window.matchMedia("(min-width: 1024px)");
    const apply = () => setWide(query.matches);
    apply();
    query.addEventListener("change", apply);
    return () => query.removeEventListener("change", apply);
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [messages, busy, open]);

  useEffect(() => {
    if (!open) return undefined;
    inputRef.current?.focus();
    function onKey(event) {
      if (event.key === "Escape") {
        event.preventDefault();
        closePanel();
        return;
      }
      if (wide || event.key !== "Tab" || !panelRef.current) return;
      const items = [...panelRef.current.querySelectorAll("a, button, textarea")].filter(
        (item) => !item.disabled,
      );
      const first = items[0];
      const last = items[items.length - 1];
      if (!first || !last) return;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, closePanel, wide]);

  if (!enabled) return null;
  const dialog = open && !wide;

  return (
    <>
      {open ? (
        <div
          id="advisor-panel"
          ref={panelRef}
          role={dialog ? "dialog" : "complementary"}
          aria-modal={dialog || undefined}
          aria-labelledby={titleId}
          className="fixed inset-0 z-50 flex h-dvh w-full flex-col bg-white lg:sticky lg:inset-auto lg:top-0 lg:z-auto lg:h-screen lg:w-[380px] lg:shrink-0 lg:border-l lg:border-stone-200"
        >
          <div className="flex items-center justify-between gap-3 border-b border-stone-200 px-4 py-3">
            <h2 id={titleId} className="text-sm font-semibold text-[#18352e]">
              Advisor
            </h2>
            <button
              type="button"
              onClick={closePanel}
              className="inline-flex min-h-11 items-center rounded-md px-3 text-sm font-medium text-[#18352e]"
            >
              Close
            </button>
          </div>
          <div
            role="log"
            aria-live="polite"
            aria-relevant="additions"
            className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-4"
          >
            {messages.length === 0 && !busy ? (
              <p className="text-sm leading-6 text-stone-600">
                Ask about published Lagos revenue, the federal budget headline, or a what-if. The
                answer stays on this page until you leave the site.
              </p>
            ) : null}
            {messages.map((message) =>
              message.role === "user" ? (
                <div key={message.id} className="ml-8 flex flex-col items-end">
                  <p className="max-w-full whitespace-pre-wrap rounded-2xl rounded-br-md bg-[#0B3B2C] px-3 py-2 text-sm leading-6 text-white">
                    {message.text}
                  </p>
                  <time
                    className="mt-1 text-[11px] text-stone-500"
                    dateTime={new Date(message.at).toISOString()}
                  >
                    {clock(message.at)}
                  </time>
                </div>
              ) : (
                <div key={message.id} className="mr-6 flex items-start gap-2">
                  <Avatar />
                  <div className="min-w-0">
                    <div
                      className={`rounded-2xl rounded-bl-md px-3 py-2 text-sm leading-6 ${message.error ? "border border-red-200 bg-red-50 text-red-800" : "bg-stone-100 text-[#18352e]"}`}
                    >
                      <p className="whitespace-pre-wrap">{message.text}</p>
                      <ReplyTable table={message.table} />
                    </div>
                    <time
                      className="mt-1 block text-[11px] text-stone-500"
                      dateTime={new Date(message.at).toISOString()}
                    >
                      {clock(message.at)}
                    </time>
                    {message.mode ? (
                      <p className="mt-2 inline-flex rounded-full bg-stone-100 px-2.5 py-1 text-[11px] font-semibold text-stone-600">
                        {engineLabel(message.mode, message.aiStatus)}
                      </p>
                    ) : null}
                    {message.sources?.length ? (
                      <ul className="mt-2 flex flex-wrap gap-2">
                        {message.sources.map((source) => (
                          <li key={source.id}>
                            <Link
                              href={`/sources#${source.id}`}
                              className="inline-flex min-h-11 max-w-full items-center rounded-full border border-stone-300 px-3 text-xs text-emerald-800"
                            >
                              {source.title || source.id}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </div>
                </div>
              ),
            )}
            {busy ? (
              <div className="mr-6 flex items-center gap-2">
                <Avatar />
                <p className="rounded-2xl bg-stone-100 px-3 py-2 text-sm text-stone-600">
                  <span className="sr-only">The advisor is replying.</span>
                  <span aria-hidden="true">…</span>
                </p>
              </div>
            ) : null}
            <div ref={endRef} />
          </div>
          {messages.length === 0 ? (
            <div className="flex flex-wrap gap-2 px-4 pb-2">
              {SUGGESTIONS.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  disabled={busy}
                  onClick={() => ask(prompt)}
                  className="min-h-11 rounded-full border border-stone-300 px-3 text-left text-sm leading-5 text-[#18352e] disabled:opacity-40"
                >
                  {prompt}
                </button>
              ))}
            </div>
          ) : null}
          <form
            className="flex items-end gap-2 border-t border-stone-200 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom,0px))]"
            onSubmit={(event) => {
              event.preventDefault();
              const next = draft;
              setDraft("");
              void ask(next);
            }}
          >
            <label className="min-w-0 flex-1 text-sm text-stone-600">
              <span className="sr-only">Message the advisor</span>
              <textarea
                ref={inputRef}
                value={draft}
                maxLength={2000}
                rows={2}
                style={{ minHeight: "44px" }}
                className="max-h-32 min-h-11 resize-y"
                placeholder="Ask about the published figures"
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    event.currentTarget.form?.requestSubmit();
                  }
                }}
              />
            </label>
            <button
              type="submit"
              disabled={busy || !draft.trim()}
              className="inline-flex min-h-11 items-center rounded-md bg-emerald-900 px-4 text-sm font-medium text-white disabled:opacity-40"
            >
              Send
            </button>
          </form>
        </div>
      ) : null}
      {open ? null : (
        <button
          type="button"
          onClick={openPanel}
          className="fixed right-4 bottom-[max(1rem,env(safe-area-inset-bottom,0px))] z-30 inline-flex min-h-11 items-center rounded-full bg-[#0B3B2C] px-4 text-sm font-medium text-white shadow-lg lg:hidden"
        >
          Ask the advisor
        </button>
      )}
    </>
  );
}
