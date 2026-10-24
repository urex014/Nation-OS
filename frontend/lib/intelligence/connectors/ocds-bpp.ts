import { createGunzip } from "node:zlib";
import { parseNairaToKobo } from "../money";
import { safeFetch } from "../http-client";
import type { NormalizedStatus } from "../types";

export type IngestedOcdsProject = {
  canonicalId: string;
  originalId: string;
  name: string;
  description: string;
  state: string;
  lga: string;
  agency: string;
  sector: string;
  status: NormalizedStatus;
  progressPercent: number;
  contractSumKobo: bigint;
  expendedKobo: bigint;
  startDate: string | null;
  actualCompletionDate: string | null;
  publisher: "Nigeria BPP (NOCOPO OCDS)";
  sourceUrl: string;
  raw: any;
};

function inferSector(title: string, agency: string): string {
  const text = `${title} ${agency}`.toLowerCase();
  if (text.includes("road") || text.includes("bridge") || text.includes("build") || text.includes("works"))
    return "Infrastructure & Works";
  if (text.includes("hospital") || text.includes("health") || text.includes("medical"))
    return "Healthcare";
  if (text.includes("school") || text.includes("polytechnic") || text.includes("university") || text.includes("education"))
    return "Education";
  if (text.includes("water") || text.includes("environment"))
    return "Environment & Water";
  if (text.includes("power") || text.includes("solar") || text.includes("electr"))
    return "Power & Energy";
  return "General Public Service";
}

export async function fetchOcdsProjects(maxRecords = 25): Promise<IngestedOcdsProject[]> {
  const url = "https://data.open-contracting.org/en/publication/64/download?name=2026.jsonl.gz";
  const res = await safeFetch(url, {
    headers: { "User-Agent": "NationOS-Intelligence/1.0" },
    signal: AbortSignal.timeout(25000),
  });

  if (!res.ok) {
    throw new Error(`OCDS API HTTP ${res.status}: ${res.statusText}`);
  }

  const arrayBuffer = await res.arrayBuffer();
  const gunzip = createGunzip();
  const chunks: Buffer[] = [];

  const buffer = Buffer.from(arrayBuffer);
  const decompressed = await new Promise<string>((resolve, reject) => {
    gunzip.on("data", (chunk) => chunks.push(chunk));
    gunzip.on("end", () => resolve(Buffer.concat(chunks).toString("utf-8")));
    gunzip.on("error", reject);
    gunzip.end(buffer);
  });

  const lines = decompressed.split("\n").filter((l) => l.trim().length > 0);
  const projects: IngestedOcdsProject[] = [];

  for (let i = 0; i < Math.min(lines.length, maxRecords); i++) {
    try {
      const record = JSON.parse(lines[i]);
      const ocid = record.ocid || `ocds-${i}`;
      const budget = record.planning?.budget;
      const title = budget?.project || record.tender?.title || record.planning?.rationale || "Federal Procurement Project";
      const agency = record.buyer?.name || "Federal Government Agency";
      const amount = budget?.amount?.amount || record.tender?.value?.amount || 0;
      const contractSumKobo = parseNairaToKobo(amount);

      projects.push({
        canonicalId: `BPP-OCDS-${ocid}`,
        originalId: ocid,
        name: title.trim(),
        description: budget?.description || record.tender?.description || record.planning?.rationale || "",
        state: "Federal / Lagos",
        lga: "Statewide",
        agency: agency.trim(),
        sector: inferSector(title, agency),
        status: "Procurement",
        progressPercent: 20,
        contractSumKobo,
        expendedKobo: BigInt(0),
        startDate: record.date ? record.date.split("T")[0] : null,
        actualCompletionDate: null,
        publisher: "Nigeria BPP (NOCOPO OCDS)",
        sourceUrl: `https://data.open-contracting.org/en/publication/64`,
        raw: record,
      });
    } catch {}
  }

  return projects;
}
