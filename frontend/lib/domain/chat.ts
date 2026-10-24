import { formatGroupedNaira } from "@/lib/format/money";

export type LedgerRow = {
  lga: string;
  mda: string;
  sector: string;
  kind: string;
  amountNaira: number;
};

const SECTORS: Record<string, string[]> = {
  education: ["education", "school", "teacher"],
  health: ["health", "healthcare", "hospital"],
  transport: ["transport", "road", "works"],
  food: ["food", "agriculture", "farm"],
  energy: ["energy", "power", "electric"],
  water: ["water", "sanitation"],
  administration: ["finance", "overhead"],
};

export function answerLedger(query: string, rows: LedgerRow[]): string {
  if (rows.length === 0) return "No spending records are loaded.";
  const text = query.toLowerCase();
  const places = placesNamed(text, [...new Set(rows.map((row) => row.lga))]);
  const sector = matchSector(text);
  if (places.length > 1) return `Name one place: ${orList(places)}.`;
  if (places.length === 0 || !sector) {
    return "Name a sector and a place.";
  }
  const lga = places[0];
  const hits = rows.filter(
    (row) => row.lga.toLowerCase() === lga.toLowerCase() && row.sector === sector,
  );
  if (hits.length === 0) return `No ${sector} spending in ${lga} for 2026.`;
  const total = hits.reduce((sum, row) => sum + row.amountNaira, 0);
  const mda = mode(hits.map((row) => row.mda));
  const kinds = new Set(hits.map((row) => row.kind));
  const kindPhrase =
    kinds.size > 1 ? "capital and recurrent projects" : `${[...kinds][0]} projects`;
  return `In ${lga}, the ${mda} spent ${formatGroupedNaira(total)} on ${hits.length} ${kindPhrase} in 2026.`;
}

function matchSector(text: string): string | null {
  for (const [sector, words] of Object.entries(SECTORS)) {
    if (words.some((word) => text.includes(word))) return sector;
  }
  return null;
}

function placesNamed(text: string, names: string[]): string[] {
  const hits = names.filter((name) => text.includes(name.toLowerCase()));
  const kept = hits.filter(
    (name) =>
      !hits.some(
        (other) => other.length > name.length && other.toLowerCase().includes(name.toLowerCase()),
      ),
  );
  kept.sort((a, b) => a.localeCompare(b));
  return kept;
}

function orList(names: string[]): string {
  if (names.length < 2) return names[0] ?? "";
  if (names.length === 2) return `${names[0]} or ${names[1]}`;
  return `${names.slice(0, -1).join(", ")}, or ${names.at(-1)}`;
}

function mode(values: string[]): string {
  const counts = new Map<string, number>();
  for (const value of values) counts.set(value, (counts.get(value) ?? 0) + 1);
  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0][0];
}
