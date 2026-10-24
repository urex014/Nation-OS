import Link from "next/link";
import { homeFor } from "../../lib/auth/types";
import { Logo } from "./logo";
import { MobileMenu } from "./mobile-menu";

const PAGE_LINKS = [
  { href: "/#work", label: "What NationOS does" },
  { href: "/#roles", label: "Who it is for" },
  { href: "/#decision", label: "How a decision is kept" },
];

export function SiteHeader({ user }) {
  const links = user
    ? [{ href: homeFor(user.role), label: "Overview" }, ...PAGE_LINKS]
    : PAGE_LINKS;
  return (
    <header className="bg-[#0B3B2C] text-white max-md:sticky max-md:top-0 max-md:z-40">
      <a
        href="#content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-white focus:px-3 focus:py-2 focus:text-[#18352e]"
      >
        Skip to content
      </a>
      <div className="mx-auto hidden max-w-6xl items-center justify-between gap-4 px-5 py-4 md:flex">
        <Logo inverse />
        {user ? (
          <Link
            href={homeFor(user.role)}
            className="shrink-0 rounded-md bg-white px-4 py-2.5 text-sm font-medium text-[#0B3B2C] focus-visible:outline-white"
          >
            Overview
          </Link>
        ) : (
          <Link
            href="/sign-in"
            className="shrink-0 rounded-md bg-white px-4 py-2.5 text-sm font-medium text-[#0B3B2C] focus-visible:outline-white"
          >
            Sign in
          </Link>
        )}
      </div>
      <MobileMenu links={links} user={user} sticky={false} />
    </header>
  );
}
