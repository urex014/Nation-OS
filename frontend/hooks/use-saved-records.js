"use client";
import { useCallback, useMemo, useSyncExternalStore } from "react";

const subscribe = (listener) => {
  window.addEventListener("storage", listener);
  window.addEventListener("nationos-storage", listener);
  return () => {
    window.removeEventListener("storage", listener);
    window.removeEventListener("nationos-storage", listener);
  };
};
export function useSavedRecords(key) {
  // A string snapshot stays referentially stable; parsing happens only when storage changes.
  const snapshot = useCallback(() => {
    try {
      return localStorage.getItem(key) || "[]";
    } catch {
      return "[]";
    }
  }, [key]);
  const raw = useSyncExternalStore(subscribe, snapshot, () => "[]");
  const records = useMemo(() => {
    try {
      const value = JSON.parse(raw);
      return Array.isArray(value) ? value : [];
    } catch {
      return [];
    }
  }, [raw]);
  const write = (next) => {
    localStorage.setItem(key, JSON.stringify(next));
    window.dispatchEvent(new Event("nationos-storage"));
  };
  return [records, write];
}
