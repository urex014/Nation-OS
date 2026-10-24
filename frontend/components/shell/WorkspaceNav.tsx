"use client";

import { usePathname, useRouter } from "next/navigation";
import { NavLinks } from "@/components/shell/NavLinks";

const ORDER = ["/", "/revenue", "/budget", "/scenarios", "/decisions"];

type TransitionDocument = Document & {
  startViewTransition?: (options: { update: () => void; types?: string[] }) => unknown;
};

export function WorkspaceNav({ onDismiss }: { onDismiss?: () => void }) {
  const pathname = usePathname();
  const router = useRouter();

  function onNavigate(href: string) {
    onDismiss?.();
    if (href === pathname) return;
    const from = Math.max(0, ORDER.indexOf(pathname));
    const to = Math.max(0, ORDER.indexOf(href));
    const direction = to >= from ? "forward" : "backward";
    const go = () => router.push(href);
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const doc = document as TransitionDocument;
    if (reduce || typeof doc.startViewTransition !== "function") {
      go();
      return;
    }
    doc.startViewTransition({ update: go, types: [direction] });
  }

  return <NavLinks pathname={pathname} onNavigate={onNavigate} />;
}
