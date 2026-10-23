"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React, { useState } from "react";

const navigation = [
  ["Country overview", "/"],
  ["States & territories", "/states"],
  ["Population register", "/citizens"],
  ["Businesses & banking", "/businesses"],
  ["State comparisons", "/comparisons"],
  ["Evidence explorer", "/evidence"],
  ["Data & models", "/data"],
  ["People & places", "/households"],
  ["Sector planning", "/sectors"],
  ["Recommendations & plans", "/recommendations"],
  ["Decision memory", "/decisions"],
  ["Data & AI analyst", "/analyst"],
];
export function WorkspaceShell({ children }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const current = navigation.find(([, path]) => path === pathname)?.[0] || "Food affordability";
  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[250px_1fr]">
      <aside className="border-r border-stone-300 bg-[#eaece4] lg:sticky lg:top-0 lg:h-screen lg:overflow-y-auto">
        <div className="flex items-center justify-between p-6">
          <Link href="/" className="font-serif text-3xl">
            Nation<span className="text-accent">OS</span>
          </Link>
          <button
            className="p-2 lg:hidden"
            onClick={() => setOpen(!open)}
            aria-expanded={open}
            aria-controls="workspace-navigation"
          >
            Menu
          </button>
        </div>
        <div className="mx-6 mb-6 border-y border-stone-300 py-4 text-sm">
          Republic of Aderin
          <p className="mt-1 text-xs text-stone-500">National planning workspace</p>
        </div>
        <nav
          id="workspace-navigation"
          aria-label="Workspace"
          className={`${open ? "block" : "hidden"} px-3 pb-6 lg:block`}
        >
          {navigation.map(([label, path], index) => (
            <Link
              key={path}
              href={path}
              onClick={() => setOpen(false)}
              aria-current={pathname === path ? "page" : undefined}
              className={`mb-1 flex items-center gap-3 rounded-sm px-3 py-3 text-sm ${pathname === path || (path === "/sectors" && pathname === "/sectors/food") ? "bg-ink text-white" : "text-stone-600 hover:bg-white"}`}
            >
              <span className="w-5 text-[10px] opacity-60">
                {String(index + 1).padStart(2, "0")}
              </span>
              {label}
            </Link>
          ))}
        </nav>
        <p className="hidden px-6 pb-6 text-xs leading-6 text-stone-500 lg:block">
          Fictional places. Synthetic data.
          <br />
          Evidence-led decisions.
        </p>
      </aside>
      <div className="min-w-0">
        <header className="flex flex-wrap justify-between gap-3 border-b border-stone-300 px-5 py-5 text-xs text-stone-500 md:px-10">
          <span>Workspace / {current}</span>
          <span className="uppercase tracking-widest text-accent">Demonstration data Â· 2026</span>
        </header>
        <main id="main-content" className="mx-auto max-w-[1500px] space-y-7 p-5 md:p-10">
          {children}
        </main>
        <footer className="border-t border-stone-300 px-10 py-5 text-xs text-stone-500">
          NationOS Â· Conditional scenarios support human review. They are not measured outcomes.
        </footer>
      </div>
    </div>
  );
}
