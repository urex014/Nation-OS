import { api } from "../../../../lib/nigeria/http.mjs";
import { getLgaProfile, getAllLgaProfiles } from "../../../../lib/intelligence/lga-sources";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = api(async (request: Request) => {
  const url = new URL(request.url);
  const lga = url.searchParams.get("lga") || undefined;
  if (lga) {
    return { profile: getLgaProfile(lga) };
  }
  return { profiles: getAllLgaProfiles() };
});
