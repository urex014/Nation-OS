"use client";

import { useState, type FormEvent } from "react";
import { postJson } from "@/lib/api/client";

export function CitizenQuery() {
  const [query, setQuery] = useState("How much was spent on education in Ikeja?");
  const [answer, setAnswer] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");
    try {
      const result = await postJson<{ answer: string }>("/api/chat", { query });
      setAnswer(result.answer);
    } catch (caught) {
      setAnswer("");
      setError(caught instanceof Error ? caught.message : "The ledger did not answer");
    } finally {
      setPending(false);
    }
  }

  return (
    <form className="panel stack" onSubmit={onSubmit}>
      <h2 className="eyebrow">Ask the ledger</h2>
      <label className="field">
        <span>Citizen question</span>
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          enterKeyHint="search"
          autoComplete="off"
        />
      </label>
      <button className="button" type="submit" disabled={pending} aria-busy={pending}>
        {pending ? "Checking the ledger" : "Ask"}
      </button>
      {error ? (
        <p className="error" role="alert">
          {error}
        </p>
      ) : null}
      {answer ? <p role="status">{answer}</p> : null}
    </form>
  );
}
