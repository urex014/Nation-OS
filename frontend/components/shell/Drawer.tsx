"use client";

import { useEffect, useRef, type RefObject } from "react";
import { Icon } from "@/components/shell/icons";
import { WorkspaceNav } from "@/components/shell/WorkspaceNav";

export function Drawer({
  open,
  onOpenChange,
  drawerId,
  returnFocus,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  drawerId: string;
  returnFocus: RefObject<HTMLButtonElement | null>;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const sheetRef = useRef<HTMLElement>(null);
  const opening = useRef(false);

  useEffect(() => {
    const drawer = rootRef.current;
    const scroller = scrollerRef.current;
    const sheet = sheetRef.current;
    if (!drawer || !scroller || !sheet || !drawer.showPopover) return;
    const main = document.getElementById("workspace");
    const threshold = 1 / Math.max(window.innerWidth, 1);

    function opened() {
      opening.current = false;
      if (main) main.inert = true;
      sheet?.focus();
    }

    function closed() {
      if (!drawer?.matches(":popover-open")) return;
      drawer.hidePopover();
      if (main) main.inert = false;
      returnFocus.current?.focus();
      onOpenChange(false);
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries.at(-1);
        if (!entry) return;
        if (entry.intersectionRatio === 1) opened();
        else if (entry.intersectionRatio < threshold && !opening.current) closed();
      },
      { root: drawer, threshold: [threshold, 1] },
    );
    observer.observe(sheet);

    function onScroll() {
      if (!drawer || !scroller || !sheet || CSS.supports("animation-timeline: scroll()")) return;
      const ratio = 1 - scroller.scrollLeft / Math.max(sheet.offsetWidth, 1);
      drawer.style.setProperty("--drawer-backdrop", String(Math.min(1, Math.max(0, ratio))));
    }
    scroller.addEventListener("scroll", onScroll, { passive: true });

    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape" && drawer?.matches(":popover-open")) closeDrawer();
    }
    document.addEventListener("keydown", onKey);
    return () => {
      observer.disconnect();
      scroller.removeEventListener("scroll", onScroll);
      document.removeEventListener("keydown", onKey);
      if (main) main.inert = false;
    };
  }, [onOpenChange, returnFocus]);

  async function openDrawer() {
    const drawer = rootRef.current;
    const scroller = scrollerRef.current;
    if (!drawer?.showPopover || !scroller) return;
    opening.current = true;
    if (!drawer.matches(":popover-open")) drawer.showPopover();
    if (!CSS.supports("scroll-initial-target", "nearest")) {
      scroller.scrollTo({ left: scroller.offsetWidth, behavior: "instant" });
      await new Promise((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve(null))),
      );
    }
    scroller.scrollTo({ left: 0, behavior: "auto" });
  }

  function closeDrawer() {
    const drawer = rootRef.current;
    const scroller = scrollerRef.current;
    if (!drawer?.matches(":popover-open") || !scroller) return;
    opening.current = false;
    scroller.scrollTo({ left: scroller.offsetWidth, behavior: "auto" });
  }

  function dismissNow() {
    const drawer = rootRef.current;
    const main = document.getElementById("workspace");
    if (main) main.inert = false;
    if (drawer?.matches(":popover-open")) drawer.hidePopover();
    onOpenChange(false);
  }

  useEffect(() => {
    if (open) void openDrawer();
    else closeDrawer();
  }, [open]);

  return (
    <div
      ref={rootRef}
      className="drawer"
      id={drawerId}
      popover="manual"
      onClick={(event) => {
        if (!sheetRef.current?.contains(event.target as Node)) closeDrawer();
      }}
    >
      <div ref={scrollerRef} className="drawer-scroller">
        <nav ref={sheetRef} className="drawer-sheet" tabIndex={-1} aria-label="Workspaces">
          <button
            type="button"
            className="icon-button drawer-close"
            aria-label="Close menu"
            onClick={closeDrawer}
          >
            <Icon name="close" />
          </button>
          <div>
            <p className="brand-kicker">NationOS</p>
            <p className="brand-title">Fiscal intelligence</p>
          </div>
          <WorkspaceNav onDismiss={dismissNow} />
        </nav>
      </div>
    </div>
  );
}
