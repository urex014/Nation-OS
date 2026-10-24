import { api } from "../../../../lib/nigeria/http.mjs";
import { currentUser } from "../../../../lib/auth/current";
import { runFullSync } from "../../../../lib/intelligence/sync";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const POST = api(async () => {
  const user = await currentUser();
  if (!user || user.role !== "government") {
    throw Object.assign(new Error("Unauthorized: Administrative synchronization requires a verified government role."), {
      status: 403,
    });
  }

  const results = await runFullSync();
  return { success: true, summaries: results };
});
