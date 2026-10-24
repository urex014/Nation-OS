import Link from "next/link";
import { homeFor } from "../../lib/auth/types";
import { Logo } from "./logo";

export function SiteHeader({ user }) {
  return (
    <header className="bg-[#0B3B2C] text-white">
      <a
        href="#content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-white focus:px-3 focus:py-2 focus:text-[#18352e]"
      >
        Skip to content
      </a>
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-4">
        <Logo inverse />
        {user ? (
          <Link
            href={homeFor(user.role)}
            className="shrink-0 rounded-md bg-white px-4 py-2.5 text-sm font-medium text-[#0B3B2C] focus-visible:outline-white"
          >
            Your desk
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
    </header>
  );
}
