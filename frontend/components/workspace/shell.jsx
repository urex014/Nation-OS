"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { GOVERNMENT_PATHS, ROLE_PROFILES } from "../../lib/auth/types";
import { MobileMenu, signOutAndLeave } from "../public/mobile-menu";
import { Logo } from "../public/logo";

const navigation = [
  ["/overview", "National Overview", "Country indicators and geography"],
  ["/revenue", "Budget & Revenue", "State revenue and comparisons"],
  ["/budget", "Project Intelligence", "Ask the data and explore plans"],
  ["/scenarios", "Scenario Lab", "Five- and ten-year sensitivity analysis"],
  ["/decisions", "Decision & Audit Records", "Reasoning and review history"],
  ["/sources", "Data Sources", "Provenance and coverage"],
];

export function WorkspaceShell({ children, user }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const visible = navigation.filter(
    ([path]) => user?.role === "government" || !GOVERNMENT_PATHS.includes(path),
  );
  const items = user
    ? [[ROLE_PROFILES[user.role].path, "Your desk", ROLE_PROFILES[user.role].title], ...visible]
    : visible;
  const active = items.find(([path]) => path === pathname);

  const menuLinks = items.map(([href, label, description]) => ({
    href,
    label,
    description,
    current: pathname === href,
  }));

  return (
    <div className="min-h-screen bg-[#F8FAF9] lg:grid lg:grid-cols-[260px_1fr]">
      <MobileMenu
        links={menuLinks}
        user={user}
        logoHref={user ? ROLE_PROFILES[user.role].path : "/overview"}
      />
      <aside className="hidden flex-col bg-[#0B3B2C] text-white md:flex lg:sticky lg:top-0 lg:h-screen">
        <div className="flex items-center justify-between border-b border-white/10 p-6">
          <Logo inverse href="/overview" />
          <button
            aria-label="Toggle navigation"
            aria-expanded={open}
            aria-controls="workspace-nav"
            onClick={() => setOpen(!open)}
            className="lg:hidden"
            type="button"
          >
            Menu
          </button>
        </div>
        <nav
          id="workspace-nav"
          aria-label="Main navigation"
          className={`${open ? "block" : "hidden"} space-y-2 px-3 py-6 lg:block`}
        >
          {items.map(([path, label, description], index) => (
            <Link
              key={path}
              href={path}
              onClick={() => setOpen(false)}
              aria-current={pathname === path ? "page" : undefined}
              className={`block rounded-lg px-4 py-3 focus-visible:outline-white ${pathname === path ? "bg-white/10 text-white" : "text-emerald-50 hover:bg-white/5"}`}
            >
              <span className="mr-3 text-xs text-emerald-100">0{index + 1}</span>
              <span className="text-sm font-medium">{label}</span>
              <span className="mt-1 block pl-7 text-[11px] leading-4 text-emerald-50">
                {description}
              </span>
            </Link>
          ))}
        </nav>
        <div className="mt-auto hidden border-t border-white/10 p-6 text-xs leading-6 text-emerald-50/80 lg:block">
          {user ? (
            <>
              {user.name}
              <br />
              {ROLE_PROFILES[user.role].title}
            </>
          ) : (
            <>
              Federal Republic of Nigeria
              <br />
              Public evidence. Explicit assumptions.
            </>
          )}
        </div>
      </aside>
      <div className="min-w-0">
        <header className="flex items-center justify-between gap-4 border-b border-stone-200 bg-white px-6 py-5 text-xs text-stone-600">
          <span className="min-w-0 truncate">Workspace / {active?.[1] || "Page"}</span>
          {user ? (
            <button
              type="button"
              onClick={() => signOutAndLeave(router)}
              className="hidden shrink-0 rounded-md border border-stone-300 bg-white px-3 py-2 text-xs font-medium text-[#18352e] md:inline"
            >
              Sign out
            </button>
          ) : (
            <Link href="/sign-in" className="hidden font-medium text-emerald-800 md:inline">
              Sign in
            </Link>
          )}
        </header>
        <main className="mx-auto max-w-[1500px] p-5 md:p-8 xl:p-10">{children}</main>
        <footer className="px-8 pb-6 text-xs text-stone-600">
          Observations retain their reporting years. Planning results depend on your assumptions.
        </footer>
      </div>
    </div>
  );
}
