"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React, { useState } from "react";
import {
  OverviewIcon,
  RevenueIcon,
  IntelligenceIcon,
  ScenariosIcon,
  DecisionsIcon,
  BrandLogoIcon,
} from "./shell-icons";

const navigation = [
  {
    label: "National Overview",
    path: "/",
    code: "01",
    description: "Consolidated fiscal intelligence",
    Icon: OverviewIcon,
  },
  {
    label: "Budget & Revenue",
    path: "/revenue",
    code: "02",
    description: "Statutory sources & FAAC pool",
    Icon: RevenueIcon,
  },
  {
    label: "Project Intelligence",
    path: "/budget",
    code: "03",
    description: "AI-assisted sector planning",
    Icon: IntelligenceIcon,
  },
  {
    label: "Scenario Lab",
    path: "/scenarios",
    code: "04",
    description: "Multi-horizon stress simulation",
    Icon: ScenariosIcon,
  },
  {
    label: "Decision & Audit Records",
    path: "/decisions",
    code: "05",
    description: "Context memory & review trails",
    Icon: DecisionsIcon,
  },
];

export function WorkspaceShell({ children }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const activeItem = navigation.find((item) => item.path === pathname) || navigation[0];

  return (
    <div className="min-h-screen bg-[#F8FAF9] text-stone-900 lg:grid lg:grid-cols-[280px_1fr]">
      {/* Sidebar Navigation */}
      <aside className="border-r border-[#134937] bg-[#0B3B2C] text-white lg:sticky lg:top-0 lg:h-screen lg:overflow-y-auto flex flex-col justify-between">
        <div>
          {/* Brand Header */}
          <div className="flex items-center justify-between border-b border-[#164E3A] px-6 py-5">
            <Link href="/" className="flex items-center space-x-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-400/40">
                <BrandLogoIcon />
              </div>
              <div>
                <span className="font-sans text-xl font-bold tracking-tight text-white">
                  NationOS
                </span>
                <span className="block text-[8px] font-semibold tracking-widest text-emerald-300/80 uppercase">
                  National Planning & Intelligence
                </span>
              </div>
            </Link>
            <button
              className="rounded border border-emerald-700/60 p-1.5 text-xs font-medium text-emerald-200 lg:hidden"
              onClick={() => setOpen(!open)}
              aria-expanded={open}
              aria-controls="workspace-navigation"
            >
              {open ? "Close" : "Menu"}
            </button>
          </div>

          {/* Navigation Label */}
          <div className="px-6 pt-5 pb-2">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-emerald-400/70">
              Government Workspace
            </p>
          </div>

          {/* Navigation Menu */}
          <nav
            id="workspace-navigation"
            aria-label="Workspace Navigation"
            className={`${open ? "block" : "hidden"} p-3 lg:block space-y-1`}
          >
            {navigation.map((item) => {
              const isActive = pathname === item.path;
              const { Icon } = item;
              return (
                <Link
                  key={item.path}
                  href={item.path}
                  onClick={() => setOpen(false)}
                  aria-current={isActive ? "page" : undefined}
                  className={`flex items-center gap-3 rounded-lg px-3.5 py-3 text-sm font-medium transition-all ${
                    isActive
                      ? "bg-[#164E3A] text-white shadow-sm ring-1 ring-emerald-500/30"
                      : "text-emerald-100/75 hover:bg-[#114232] hover:text-white"
                  }`}
                >
                  <span className={isActive ? "text-emerald-300" : "text-emerald-400/60"}>
                    <Icon />
                  </span>
                  <div className="flex-1">
                    <div className="leading-snug">{item.label}</div>
                  </div>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className="p-4 space-y-3 border-t border-[#164E3A]">
          <Link
            href="/revenue"
            className="group flex items-center justify-between rounded-lg border border-emerald-700/40 bg-emerald-950/40 p-3 transition-colors hover:bg-emerald-900/50"
          >
            <div className="flex items-center space-x-2.5">
              <span className="flex h-7 w-7 items-center justify-center rounded-md bg-emerald-800/60 text-emerald-300">
                <svg
                  className="h-4 w-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <circle cx="12" cy="12" r="10" />
                  <line x1="2" y1="12" x2="22" y2="12" />
                  <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                </svg>
              </span>
              <div>
                <p className="text-xs font-semibold text-white">Public Transparency Portal</p>
                <p className="text-[10px] text-emerald-300/80">Open citizen view</p>
              </div>
            </div>
            <svg
              className="h-3.5 w-3.5 text-emerald-400 transition-transform group-hover:translate-x-0.5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
              <polyline points="15 3 21 3 21 9" />
              <line x1="10" y1="14" x2="21" y2="3" />
            </svg>
          </Link>

          <div className="flex items-center justify-between rounded-lg bg-emerald-950/20 px-2 py-2">
            <div className="flex items-center space-x-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#D1FAE5] font-sans text-xs font-bold text-[#065F46]">
                AO
              </div>
              <div className="min-w-0">
                <p className="truncate text-xs font-semibold text-white">Amina Okafor</p>
                <p className="truncate text-[10px] text-emerald-300/70">Planning Director</p>
              </div>
            </div>
            <button className="text-emerald-400/60 hover:text-white p-1">
              <svg
                className="h-4 w-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="12" cy="12" r="1" />
                <circle cx="19" cy="12" r="1" />
                <circle cx="5" cy="12" r="1" />
              </svg>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="min-w-0 flex flex-col">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-200 bg-white px-6 py-3.5 text-xs">
          <div className="flex items-center space-x-2">
            <span className="font-medium text-stone-500">NationOS</span>
            <span className="text-stone-300">/</span>
            <span className="font-semibold text-stone-900">{activeItem.label}</span>
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 rounded-full border border-stone-200 bg-stone-50 px-3 py-1 font-mono text-[11px] text-stone-700">
              <span className="text-stone-400 font-sans text-[10px] font-semibold uppercase tracking-wider">
                Reporting Period
              </span>
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
              <span className="font-medium">2026 Planning Scenario</span>
            </div>

            <button
              className="relative rounded-full border border-stone-200 p-1.5 text-stone-600 hover:bg-stone-50"
              aria-label="Notifications"
            >
              <svg
                className="h-4 w-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
              <span className="absolute top-1 right-1 h-1.5 w-1.5 rounded-full bg-amber-500" />
            </button>

            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#D1FAE5] font-sans text-[11px] font-bold text-[#065F46]">
              AO
            </div>
          </div>
        </header>

        <main
          id="main-content"
          className="flex-1 max-w-[1440px] w-full mx-auto p-6 md:p-8 space-y-6"
        >
          {children}
        </main>

        <footer className="border-t border-stone-200 bg-white px-6 py-4 text-xs text-stone-500 flex flex-wrap justify-between items-center gap-2">
          <span>
            NationOS Decision Intelligence Platform. Deterministic calculations derived without
            hallucination.
          </span>
          <span className="font-mono text-[11px] text-stone-400">Statutory Rules Enforced</span>
        </footer>
      </div>
    </div>
  );
}
