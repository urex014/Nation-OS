"use client";
import { createContext, useContext, useState } from "react";
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
const Context = createContext(null);
export function DraftProvider({ children }) {
  const [config, setConfig] = useState(initialDraft);
  return <Context.Provider value={{ config, setConfig }}>{children}</Context.Provider>;
}
export function useDraft() {
  return useContext(Context);
}
