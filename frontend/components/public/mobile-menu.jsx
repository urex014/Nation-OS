"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { Logo } from "./logo";

function MenuIcon({ open }) {
  const path = open ? "M5 5l10 10M15 5L5 15" : "M3 5h14M3 10h14M3 15h14";
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true">
      <path d={path} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export async function signOutAndLeave(router) {
  await fetch("/api/auth/sign-out", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: "{}",
  });
  router.push("/");
  router.refresh();
}

function lockPageScroll() {
  const scrollY = window.scrollY;
  const { style } = document.body;
  const previous = {
    overflow: style.overflow,
    position: style.position,
    top: style.top,
    left: style.left,
    right: style.right,
    width: style.width,
  };
  style.overflow = "hidden";
  style.position = "fixed";
  style.top = `-${scrollY}px`;
  style.left = "0";
  style.right = "0";
  style.width = "100%";
  return () => {
    style.overflow = previous.overflow;
    style.position = previous.position;
    style.top = previous.top;
    style.left = previous.left;
    style.right = previous.right;
    style.width = previous.width;
    window.scrollTo(0, scrollY);
  };
}

function focusableItems(menu) {
  return [...menu.querySelectorAll("[data-menu-item]")];
}

/**
 * Sticky bar for viewports below 768px. Desktop callers hide it with md:hidden.
 * The open list sits over the page so every link is reachable without scrolling.
 */
export function MobileMenu({ links, user, logoHref = "/", sticky = true }) {
  const router = useRouter();
  const pathname = usePathname();
  const menuId = `mobile-menu-${useId().replace(/:/g, "")}`;
  const [openPath, setOpenPath] = useState(null);
  const open = openPath === pathname;
  const buttonRef = useRef(null);
  const menuRef = useRef(null);
  const wasOpen = useRef(false);

  useEffect(() => {
    if (!open) {
      if (wasOpen.current) {
        wasOpen.current = false;
        buttonRef.current?.focus();
      }
      return;
    }
    wasOpen.current = true;
    const unlock = lockPageScroll();
    focusableItems(menuRef.current)[0]?.focus();

    function onKey(event) {
      if (event.key === "Escape") {
        event.preventDefault();
        setOpenPath(null);
        return;
      }
      if (event.key !== "Tab" || !menuRef.current) return;
      const items = focusableItems(menuRef.current);
      const first = items[0];
      const last = items[items.length - 1];
      if (!first || !last) return;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKey);
    return () => {
      unlock();
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function close() {
    setOpenPath(null);
  }

  return (
    <div className={`${sticky ? "sticky top-0" : "relative"} z-40 md:hidden`}>
      <div className="relative z-50 flex items-center justify-between gap-3 bg-[#0B3B2C] px-4 py-2 text-white">
        <Logo inverse href={logoHref} onClick={close} className="min-h-11" />
        <button
          ref={buttonRef}
          type="button"
          className="inline-flex h-11 w-11 items-center justify-center rounded-md text-white focus-visible:outline-white"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          aria-controls={menuId}
          onClick={() => setOpenPath(open ? null : pathname)}
        >
          <MenuIcon open={open} />
        </button>
      </div>
      {open ? (
        <div
          className="fixed inset-0 z-40 bg-[#071f18]/45"
          onPointerDown={close}
          aria-hidden="true"
        />
      ) : null}
      <nav
        id={menuId}
        ref={menuRef}
        aria-label="Pages"
        hidden={!open}
        className="absolute inset-x-0 top-full z-50 max-h-[calc(100dvh-4.5rem)] overflow-y-auto overscroll-contain border-t border-white/10 bg-[#0B3B2C] text-white shadow-lg"
      >
        <ul className="py-2">
          {links.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                data-menu-item
                onClick={close}
                aria-current={link.current ? "page" : undefined}
                className={`flex min-h-11 flex-col justify-center px-4 py-2 focus-visible:outline-white ${link.current ? "bg-white/10" : ""}`}
              >
                <span className="text-base font-medium">{link.label}</span>
                {link.description ? (
                  <span className="text-sm leading-5 text-emerald-100">{link.description}</span>
                ) : null}
              </Link>
            </li>
          ))}
        </ul>
        <div className="border-t border-white/10 p-2">
          {user ? (
            <button
              type="button"
              data-menu-item
              onClick={() => {
                close();
                void signOutAndLeave(router);
              }}
              className="flex min-h-11 w-full items-center rounded-md px-3 text-left text-base font-medium text-white focus-visible:outline-white"
            >
              Sign out
            </button>
          ) : (
            <Link
              href="/sign-in"
              data-menu-item
              onClick={close}
              className="flex min-h-11 items-center rounded-md px-3 text-base font-medium text-white focus-visible:outline-white"
            >
              Sign in
            </Link>
          )}
        </div>
      </nav>
    </div>
  );
}
