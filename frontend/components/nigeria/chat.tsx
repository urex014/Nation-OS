"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { postJson } from "@/lib/api/client";
import { Button, Card, Heading, Notice } from "./ui";

const WELCOME = "Name a sector and a place. No spending records are loaded.";
const PROMPTS = [
  "How much was spent on education in Ikeja?",
  "How much was spent on health in Kano?",
];

export function Chat() {
  const [messages, setMessages] = useState([{ role: "assistant", text: WELCOME }]);
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const end = useRef<HTMLDivElement>(null);

  useEffect(() => {
    end.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [messages, busy]);

  async function send(text: string) {
    const message = text.trim();
    if (message.length < 3 || busy) return;
    setBusy(true);
    setError("");
    try {
      const response = await postJson<{ answer: string }>("/api/chat", { query: message });
      setMessages((previous) => [
        ...previous,
        { role: "user", text: message },
        { role: "assistant", text: response.answer },
      ]);
      setQuery("");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The ledger did not answer");
    } finally {
      setBusy(false);
    }
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void send(query);
  }

  return (
    <>
      <Heading eyebrow="Project Intelligence" title="Ask the ledger">
        This is a filter over spending lines. It does not call a language model. The spend table is
        empty until a cited file is added.
      </Heading>
      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_280px]">
        <Card>
          <div className="mb-5 flex items-center justify-between border-b border-stone-100 pb-4">
            <div>
              <h2 className="font-semibold">Data conversation</h2>
              <p className="mt-1 text-xs text-stone-500">SQLite · no language model</p>
            </div>
            <Button
              type="button"
              secondary
              disabled={busy || messages.length === 1}
              onClick={() => {
                setMessages([{ role: "assistant", text: WELCOME }]);
                setError("");
                setQuery("");
              }}
            >
              New conversation
            </Button>
          </div>
          <div
            role="log"
            aria-label="Data conversation"
            aria-live="polite"
            className="max-h-[420px] space-y-4 overflow-y-auto"
          >
            {messages.map((message, index) => (
              <article
                key={`${message.role}-${index}`}
                className={
                  message.role === "user"
                    ? "ml-6 rounded-lg bg-stone-100 p-4"
                    : "py-2 text-sm leading-7 text-stone-700"
                }
              >
                <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-stone-500">
                  {message.role === "user" ? "You" : "NationOS"}
                </p>
                <p>{message.text}</p>
              </article>
            ))}
            <div ref={end} />
          </div>
          {error ? (
            <div className="mt-4">
              <Notice error>{error}</Notice>
            </div>
          ) : null}
          <form className="mt-6 border-t border-stone-100 pt-5" onSubmit={onSubmit}>
            <label htmlFor="ledger-question" className="mb-2 block text-sm font-medium">
              Ask a question
            </label>
            <textarea
              id="ledger-question"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              maxLength={500}
              disabled={busy}
            />
            <div className="mt-3 flex justify-end">
              <Button disabled={busy || query.trim().length < 3} type="submit">
                {busy ? "Checking…" : "Send question"}
              </Button>
            </div>
          </form>
        </Card>
        <Card title="Start with a question">
          <div className="space-y-2">
            {PROMPTS.map((prompt) => (
              <button
                key={prompt}
                type="button"
                disabled={busy}
                onClick={() => void send(prompt)}
                className="w-full rounded-md border border-stone-200 p-3 text-left text-xs leading-5 text-stone-600 hover:border-emerald-600"
              >
                {prompt}
              </button>
            ))}
          </div>
        </Card>
      </div>
    </>
  );
}
