"use client";

import { usePathname } from "next/navigation";
import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";
import { useDraft } from "../nigeria/draft-provider";

const AdvisorContext = createContext(null);

export function useAdvisor() {
  const value = useContext(AdvisorContext);
  if (!value) throw new Error("Nation AI is only available inside the workspace.");
  return value;
}

function pageFor(pathname, draft) {
  const config = draft?.config;
  if (!config || (pathname !== "/budget" && pathname !== "/scenarios")) return { path: pathname };
  return {
    path: pathname,
    annualBudgetNaira: config.annualBudgetNaira,
    years: config.years,
    startYear: config.startYear,
    scope: config.scope,
    inflation: config.inflation,
    delivery: config.delivery,
    maintenance: config.maintenance,
    strategy: config.strategy,
    useBudget: config.fromLink === true || config.budgetTouched === true,
    fromLink: config.fromLink === true,
  };
}

function turnFrom(message) {
  return {
    role: message.role === "user" ? "user" : "advisor",
    text: String(message.text || "").slice(0, 800),
    work: (message.work || []).slice(0, 3).map((row) => ({
      formula: String(row.formula || "").slice(0, 240),
    })),
  };
}

export function AdvisorProvider({ enabled, role = "citizen", children }) {
  const pathname = usePathname() || "";
  const draft = useDraft();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);
  const returnFocus = useRef(null);
  const messagesRef = useRef([]);
  const memoryRef = useRef({});
  messagesRef.current = messages;

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
    const history = messagesRef.current.slice(-10).map(turnFrom);
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({
          message,
          context: memoryRef.current,
          history,
          page: pageFor(pathname, draft),
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw Error(data.error || "Nation AI could not answer.");
      if (data.context && typeof data.context === "object") {
        memoryRef.current = { ...memoryRef.current, ...data.context };
      }
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
          work: Array.isArray(data.work) ? data.work : [],
          links: Array.isArray(data.links) ? data.links : [],
          warnings: Array.isArray(data.warnings) ? data.warnings : [],
          alternatives: Array.isArray(data.alternatives) ? data.alternatives : [],
          bestReason: data.bestReason || null,
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
  }, [pathname, draft]);

  const value = useMemo(
    () => ({ enabled, role, open, messages, busy, openPanel, closePanel, toggle, ask }),
    [enabled, role, open, messages, busy, openPanel, closePanel, toggle, ask],
  );

  return <AdvisorContext.Provider value={value}>{children}</AdvisorContext.Provider>;
}
