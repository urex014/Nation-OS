"use client";
import React, { createContext, useContext, useState } from "react";
import { defaultPlan } from "../../lib/client/country.mjs";

const WorkspaceContext = createContext(null);
export function WorkspaceProvider({ children }) {
  const [draft, setDraft] = useState({
    title: "National public-service programme",
    reason: "",
    config: defaultPlan,
    origin: "Analyst proposal",
  });
  // Drafts are transient. Saving an immutable snapshot is a separate explicit operation.
  return (
    <WorkspaceContext.Provider value={{ draft, setDraft }}>{children}</WorkspaceContext.Provider>
  );
}
export const useWorkspace = () => useContext(WorkspaceContext);
