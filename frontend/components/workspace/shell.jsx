"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
const navigation = [
  ["/", "National Overview", "Country indicators and geography"],
  ["/revenue", "Budget & Revenue", "State revenue and comparisons"],
  ["/budget", "Project Intelligence", "Ask the data and explore plans"],
  ["/scenarios", "Scenario Lab", "Five- and ten-year sensitivity analysis"],
  ["/decisions", "Decision & Audit Records", "Reasoning and review history"],
  ["/sources", "Data Sources", "Provenance and coverage"],
];
export function WorkspaceShell({ children }) {
  const pathname = usePathname(),
    [open, setOpen] = useState(false),
    active = navigation.find(([path]) => path === pathname);
  return (
    <div className="min-h-screen bg-[#F8FAF9] lg:grid lg:grid-cols-[260px_1fr]">
      <aside className="flex flex-col bg-[#0B3B2C] text-white lg:sticky lg:top-0 lg:h-screen">
        <div className="flex items-center justify-between border-b border-white/10 p-6">
          <Link href="/" className="text-2xl font-semibold tracking-tight">
            Nation<span className="text-emerald-300">OS</span>
            <span className="mt-1 block text-[10px] font-normal uppercase tracking-widest text-emerald-100/60">
              Nigeria planning workspace
            </span>
          </Link>
          <button
            aria-label="Toggle navigation"
            aria-expanded={open}
            onClick={() => setOpen(!open)}
            className="lg:hidden"
          >
            Menu
          </button>
        </div>
        <nav
          aria-label="Main navigation"
          className={`${open ? "block" : "hidden"} space-y-2 px-3 py-6 lg:block`}
        >
          {navigation.map(([path, label, description], i) => (
            <Link
              key={path}
              href={path}
              onClick={() => setOpen(false)}
              aria-current={pathname === path ? "page" : undefined}
              className={`block rounded-lg px-4 py-3 ${pathname === path ? "bg-white/10" : "text-emerald-50/70 hover:bg-white/5"}`}
            >
              <span className="mr-3 text-xs text-emerald-200/50">0{i + 1}</span>
              <span className="text-sm font-medium">{label}</span>
              <span className="mt-1 block pl-7 text-[11px] text-emerald-100/45">{description}</span>
            </Link>
          ))}
        </nav>
        <div className="mt-auto hidden border-t border-white/10 p-6 text-xs leading-6 text-emerald-50/60 lg:block">
          Federal Republic of Nigeria
          <br />
          Public evidence. Explicit assumptions.
          <br />
          <span className="text-emerald-300">Local SQLite workspace</span>
        </div>
      </aside>
      <div className="min-w-0">
        <header className="flex justify-between border-b border-stone-200 bg-white px-6 py-5 text-xs text-stone-500">
          <span>Workspace / {active?.[1] || "Page"}</span>
          <span className="text-emerald-800">Nigeria · sourced data</span>
        </header>
        <main className="mx-auto max-w-[1500px] p-5 md:p-8 xl:p-10">{children}</main>
        <footer className="px-8 pb-6 text-xs text-stone-400">
          Observations retain their reporting years. Planning results depend on your assumptions.
        </footer>
      </div>
    </div>
  );
}
