"use client";

import { useId, useRef, useState, type ReactNode } from "react";
import { Drawer } from "@/components/shell/Drawer";
import { Icon } from "@/components/shell/icons";
import { WorkspaceNav } from "@/components/shell/WorkspaceNav";

export function AppShell({
  title,
  lede,
  children,
}: {
  title: string;
  lede: string;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const drawerId = useId();
  const menuRef = useRef<HTMLButtonElement>(null);

  return (
    <div className="app">
      <a className="skip" href="#workspace">
        Skip to content
      </a>
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark" aria-hidden="true">
            N
          </span>
          <div>
            <p className="brand-kicker">Federation ledger</p>
            <p className="brand-title">NationOS</p>
          </div>
        </div>
        <nav aria-label="Workspaces">
          <WorkspaceNav />
        </nav>
      </aside>
      <Drawer open={open} onOpenChange={setOpen} drawerId={drawerId} returnFocus={menuRef} />
      <div className="main" id="workspace">
        <header className="topbar">
          <div className="topbar-inner">
            <button
              ref={menuRef}
              type="button"
              className="icon-button menu"
              aria-label="Menu"
              aria-expanded={open}
              aria-controls={drawerId}
              onClick={() => setOpen(true)}
            >
              <Icon name="menu" />
            </button>
            <p className="topbar-brand">NationOS</p>
            <p className="topbar-meta">2026 · NGN</p>
          </div>
        </header>
        <div className="content">
          <header className="mast">
            <p className="eyebrow">Fiscal year 2026</p>
            <h1>{title}</h1>
            <p className="lede">{lede}</p>
          </header>
          {children}
        </div>
      </div>
    </div>
  );
}
