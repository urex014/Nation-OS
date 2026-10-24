"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";

export const NAV = [
  ["/", "National Overview", "Cited 2026 headlines and FAAC map"],
  ["/revenue", "Budget & Revenue", "FAAC split and 36-state table"],
  ["/budget", "Project Intelligence", "Ask the ledger and split a budget"],
  ["/scenarios", "Scenario Lab", "What if revenue falls"],
  ["/decisions", "Decision & Audit Records", "Saved splits"],
  ["/sources", "Data Sources", "Who printed each figure"],
] as const;

export function NavList({ pathname, onNavigate }: { pathname: string; onNavigate?: () => void }) {
  return (
    <nav aria-label="Main navigation" className="space-y-2 px-3 py-6">
      {NAV.map(([path, label, description], index) => (
        <Link
          key={path}
          href={path}
          onClick={onNavigate}
          aria-current={pathname === path ? "page" : undefined}
          className={`block rounded-lg px-4 py-3 ${
            pathname === path ? "bg-white/10" : "text-emerald-50/70 hover:bg-white/5"
          }`}
        >
          <span className="mr-3 text-xs text-emerald-200/50">0{index + 1}</span>
          <span className="text-sm font-medium">{label}</span>
          <span className="mt-1 block pl-7 text-[11px] text-emerald-100/45">{description}</span>
        </Link>
      ))}
    </nav>
  );
}

export function WorkspaceShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const active = NAV.find(([path]) => path === pathname);
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
            type="button"
          >
            Menu
          </button>
        </div>
        <div className={open ? "block" : "hidden lg:block"}>
          <NavList pathname={pathname} onNavigate={() => setOpen(false)} />
        </div>
        <div className="mt-auto hidden border-t border-white/10 p-6 text-xs leading-6 text-emerald-50/60 lg:block">
          Federal Republic of Nigeria
          <br />
          Cited figures only.
          <br />
          <span className="text-emerald-300">Local SQLite workspace</span>
        </div>
      </aside>
      <div className="min-w-0">
        <header className="flex justify-between border-b border-stone-200 bg-white px-6 py-5 text-xs text-stone-500">
          <span>Workspace / {active?.[1] ?? "Page"}</span>
          <span className="text-emerald-800">Nigeria · sourced data</span>
        </header>
        <main className="mx-auto max-w-[1500px] p-5 md:p-8 xl:p-10">{children}</main>
        <footer className="px-8 pb-6 text-xs text-stone-400">
          Every loaded figure is copied from frontend/data/cited/ledger.json.
        </footer>
      </div>
    </div>
  );
}
