"use client";

import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";

const AdvisorContext = createContext(null);

export function useAdvisor() {
  const value = useContext(AdvisorContext);
  if (!value) throw new Error("Nation AI is only available inside the workspace.");
  return value;
}

export function AdvisorProvider({ enabled, role = "citizen", children }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);
  const returnFocus = useRef(null);

  const openPanel = useCallback(() => {
    returnFocus.current = document.activeElement;
    setOpen(true);
  }, []);

  const closePanel = useCallback(() => {
    setOpen(false);
    const back = returnFocus.current;
    returnFocus.current = null;
    requestAnimationFrame(() => back?.focus?.());
  }, []);

  const toggle = useCallback(() => {
    setOpen((current) => {
      if (current) {
        const back = returnFocus.current;
        returnFocus.current = null;
        requestAnimationFrame(() => back?.focus?.());
        return false;
      }
      returnFocus.current = document.activeElement;
      return true;
    });
  }, []);

  const ask = useCallback(async (text) => {
    const message = text.trim();
    if (!message || busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    setOpen(true);
    setMessages((current) => [
      ...current,
      { id: crypto.randomUUID(), role: "user", text: message, at: Date.now() },
    ]);
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({ message }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw Error(data.error || "Nation AI could not answer.");
      const reply = Array.isArray(data.paragraphs)
        ? data.paragraphs.filter(Boolean).join("\n\n")
        : "";
      setMessages((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          role: "advisor",
          text: reply || "No checked answer was produced.",
          at: Date.now(),
          mode: data.mode || "local-data",
          aiStatus: data.aiStatus || "not_configured",
          sources: Array.isArray(data.sources) ? data.sources : [],
          table: data.table || null,
        },
      ]);
    } catch (error) {
      setMessages((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          role: "advisor",
          text: error instanceof Error ? error.message : "Nation AI could not answer.",
          at: Date.now(),
          error: true,
        },
      ]);
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  }, []);

  const value = useMemo(
    () => ({ enabled, role, open, messages, busy, openPanel, closePanel, toggle, ask }),
    [enabled, role, open, messages, busy, openPanel, closePanel, toggle, ask],
  );

  return <AdvisorContext.Provider value={value}>{children}</AdvisorContext.Provider>;
}
