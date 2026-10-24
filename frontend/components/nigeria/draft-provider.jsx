"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { readPlanQuery } from "../../lib/nigeria/plan-links.mjs";
// Editable assumptions, never presented as measured Nigerian statistics.
export const initialDraft = {
  scope: "all",
  years: 5,
  startYear: 2027,
  annualBudgetNaira: 100000000000,
  inflation: 15,
  budgetGrowth: 0,
  revenueGrowth: 0,
  delivery: 80,
  maintenance: 20,
  allocations: {
    education: 20000000000,
    health: 20000000000,
    transport: 20000000000,
    agriculture: 15000000000,
    energy: 15000000000,
    water: 10000000000,
  },
};

function applySearch(current) {
  if (typeof window === "undefined") return current;
  const partial = readPlanQuery(new URLSearchParams(window.location.search));
  if (!partial) return current;
  return {
    ...current,
    ...partial,
    fromLink: partial.fromLink === true,
    allocations: partial.allocations
      ? { ...current.allocations, ...partial.allocations }
      : current.allocations,
  };
}

const Context = createContext(null);
export function DraftProvider({ children }) {
  const [config, setConfig] = useState(initialDraft);
  useEffect(() => {
    setConfig((current) => applySearch(current));
    const navigation = window.history;
    const originalPush = navigation.pushState.bind(navigation);
    const originalReplace = navigation.replaceState.bind(navigation);
    navigation.pushState = (...args) => {
      const result = originalPush(...args);
      setConfig((current) => applySearch(current));
      return result;
    };
    navigation.replaceState = (...args) => {
      const result = originalReplace(...args);
      setConfig((current) => applySearch(current));
      return result;
    };
    return () => {
      navigation.pushState = originalPush;
      navigation.replaceState = originalReplace;
    };
  }, []);
  return <Context.Provider value={{ config, setConfig }}>{children}</Context.Provider>;
}
export function useDraft() {
  return useContext(Context);
}
