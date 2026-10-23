"use client";
import { useEffect, useRef, useState } from "react";

export function useAnalyst() {
  const [status, setStatus] = useState({ configured: false });
  const [report, setReport] = useState(null),
    [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const active = useRef(null);
  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/ai/status", { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw Error("Unable to check analyst availability.");
        setStatus(await response.json());
      })
      .catch((failure) => {
        if (failure.name !== "AbortError") setError(failure.message);
      });
    return () => {
      controller.abort();
      active.current?.abort();
    };
  }, []);
  async function analyze(input) {
    if (active.current) return;
    const controller = new AbortController();
    active.current = controller;
    const timeout = setTimeout(() => controller.abort(), 70000);
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/ai/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
        signal: controller.signal,
      });
      const body = await response.json();
      if (!response.ok) throw Error(body.error || "Analysis failed.");
      setReport(body);
    } catch (failure) {
      setError(
        failure.name === "AbortError"
          ? "Analysis cancelled or timed out. Try a narrower request."
          : failure.message,
      );
    } finally {
      clearTimeout(timeout);
      active.current = null;
      setBusy(false);
    }
  }
  return { status, report, error, busy, analyze };
}
