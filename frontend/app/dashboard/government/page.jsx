import { redirect } from "next/navigation";
import { currentUser } from "../../../lib/auth/current";
import { landingFor } from "../../../lib/auth/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function Page() {
  const user = await currentUser();
  redirect(user ? landingFor(user.role) : "/sign-in");
}
