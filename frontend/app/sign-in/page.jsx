import { Suspense } from "react";
import { redirect } from "next/navigation";
import { AuthPanel } from "../../components/public/auth-panel";
import { SiteHeader } from "../../components/public/site-header";
import { currentUser } from "../../lib/auth/current";
import { destinationFor } from "../../lib/auth/types";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Sign in · NationOS",
  description: "Sign in to NationOS. Both roles open the country overview.",
};

export default async function Page({ searchParams }) {
  const params = await searchParams;
  const user = await currentUser();
  const next = typeof params?.next === "string" ? params.next : null;
  if (user) redirect(destinationFor(user.role, next));
  return (
    <div className="min-h-screen bg-[#F8FAF9]">
      <SiteHeader />
      <main id="content" className="mx-auto max-w-lg px-5 py-12 md:py-20">
        <Suspense fallback={<p className="text-sm text-stone-600">Loading the form…</p>}>
          <AuthPanel />
        </Suspense>
      </main>
    </div>
  );
}
