import Link from "next/link";
import { SiteHeader } from "../../components/public/site-header";
import { currentUser } from "../../lib/auth/current";
import { homeFor } from "../../lib/auth/types";

export const dynamic = "force-dynamic";
export const metadata = { title: "Wrong role · NationOS" };

export default async function Page() {
  const user = await currentUser();
  return (
    <div className="min-h-screen bg-[#F8FAF9]">
      <SiteHeader user={user} />
      <main id="content" className="mx-auto max-w-xl px-5 py-16 md:py-24">
        <p className="text-xs font-medium uppercase tracking-widest text-emerald-800">Access</p>
        <h1 className="mt-3 font-serif text-4xl font-semibold tracking-tight">
          This page is for a different role.
        </h1>
        <p className="mt-4 text-base leading-7 text-stone-700">
          We checked who you are. You can go back to the overview, and the shared pages linked from
          it.
        </p>
        <div className="mt-8">
          {user ? (
            <Link
              href={homeFor(user.role)}
              className="inline-flex min-h-11 items-center rounded-md bg-[#0B3B2C] px-5 py-3 text-sm font-medium text-white"
            >
              Open the overview
            </Link>
          ) : (
            <Link
              href="/sign-in"
              className="inline-flex min-h-11 items-center rounded-md bg-[#0B3B2C] px-5 py-3 text-sm font-medium text-white"
            >
              Sign in
            </Link>
          )}
        </div>
      </main>
    </div>
  );
}
