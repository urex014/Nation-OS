"use client";

import { useEffect, useState } from "react";
import { useAdvisor } from "./advisor-state";

const PUBLIC_CHIPS = [
  ["Lagos 2025", "How much did Lagos raise in 2025?"],
  ["Federal headline", "What is the federal budget headline, and is it Lagos spending?"],
  ["Lagos vs Rivers", "Compare Lagos and Rivers revenue."],
];

const TAX_CHIP = [
  "Tax −10%",
  "What if Lagos tax collections were 10% lower than the published figure?",
];

export function chipsFor(role) {
  return role === "government" ? [...PUBLIC_CHIPS, TAX_CHIP] : PUBLIC_CHIPS;
}

export function useWide() {
  const [wide, setWide] = useState(false);
  useEffect(() => {
    const query = window.matchMedia("(min-width: 1024px)");
    const apply = () => setWide(query.matches);
    apply();
    query.addEventListener("change", apply);
    return () => query.removeEventListener("change", apply);
  }, []);
  return { wide };
}

function NationMark() {
  return (
    <svg width="28" height="28" viewBox="0 0 32 32" aria-hidden="true">
      <rect x="5" y="6" width="6" height="20" rx="1" fill="currentColor" />
      <rect x="21" y="6" width="6" height="20" rx="1" fill="currentColor" />
      <polygon points="11,6 21,16 21,26 11,16" fill="#B7D7C5" />
    </svg>
  );
}

export function NationButton() {
  const { enabled, open, toggle } = useAdvisor();
  const { wide } = useWide();
  if (!enabled) return null;
  const overSheet = open && !wide;
  return (
    <button
      type="button"
      onClick={toggle}
      aria-expanded={open}
      aria-controls="nation-ai-panel"
      aria-label="Ask Nation AI"
      title="Ask Nation AI"
      className={`fixed right-6 bottom-[max(1.5rem,calc(env(safe-area-inset-bottom,0px)+1.5rem))] inline-flex size-14 items-center justify-center rounded-full bg-[#0B3B2C] text-white shadow-lg ${overSheet ? "z-[60]" : "z-30"} ${open && wide ? "lg:right-[calc(400px+1.5rem)]" : ""}`}
    >
      <NationMark />
    </button>
  );
}
