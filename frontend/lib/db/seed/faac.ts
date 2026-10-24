import { round1 } from "@/lib/domain/formula";
import type { Jurisdiction } from "@/lib/db/seed/jurisdictions";
import { PUBLISHED_MILLION, STATES_TIER_MILLION } from "@/lib/db/seed/cited";

export { PUBLISHED_MILLION, STATES_TIER_MILLION };

export type FaacSeed = {
  id: string;
  amountMillion: number;
  provenance: "published";
  sharePercent: number;
};

export function buildFaac(jurisdictions: Jurisdiction[]): FaacSeed[] {
  const states = jurisdictions.filter((item) => item.id !== "NG-FC");
  const missing = states
    .filter((item) => PUBLISHED_MILLION[item.id] == null)
    .map((item) => item.id);
  if (missing.length > 0) throw new Error(`FAAC citation is missing ${missing.join(", ")}`);
  const rows = states.map((item) => {
    const amountMillion = PUBLISHED_MILLION[item.id];
    return {
      id: item.id,
      amountMillion,
      provenance: "published" as const,
      sharePercent: round1((amountMillion / STATES_TIER_MILLION) * 100),
    };
  });
  const total = rows.reduce((sum, row) => sum + row.amountMillion, 0);
  if (total !== STATES_TIER_MILLION) {
    throw new Error(`FAAC states tier ${total} != ${STATES_TIER_MILLION}`);
  }
  return rows;
}
