import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { parseNairaToKobo } from "../money";
import { safeFetch } from "../http-client";
import type { NormalizedStatus } from "../types";

export type TrackaDocument = {
  id: number;
  title: string;
  description: string;
  file_url: string;
  state: string;
  country: string;
  year: string;
  created_at: string;
};

export type ExtractedProjectObservation = {
  projectCode: string;
  title: string;
  state: string;
  lga: string;
  amountKobo: bigint;
  status: NormalizedStatus;
  remarks: string;
  documentTitle: string;
  sourceUrl: string;
  publicationDate: string;
  confidence: number;
};

export async function fetchTrackaDocumentList(country = "nigeria", page = 1): Promise<TrackaDocument[]> {
  const url = `https://apirebuild.yourtracka.org/documents?country=${country}&page=${page}&page_size=15`;
  const response = await safeFetch(url, {
    headers: { "User-Agent": "NationOS-Intelligence/1.0", Accept: "application/json" },
    signal: AbortSignal.timeout(15000),
  });
  if (!response.ok) {
    throw new Error(`Tracka Documents API HTTP ${response.status}`);
  }
  const data = await response.json();
  return (data?.data?.docs?.records || []) as TrackaDocument[];
}

export async function extractProjectsFromPdf(doc: TrackaDocument): Promise<ExtractedProjectObservation[]> {
  if (!doc.file_url) return [];
  const tempFile = path.join(os.tmpdir(), `tracka_${doc.id}_${Date.now()}.pdf`);

  try {
    const res = await safeFetch(doc.file_url, { signal: AbortSignal.timeout(20000) });
    if (!res.ok) return [];
    const arrayBuffer = await res.arrayBuffer();
    fs.writeFileSync(tempFile, Buffer.from(arrayBuffer));

    const p2t = spawnSync("/usr/bin/pdftotext", [tempFile, "-"]);
    if (p2t.status !== 0 || !p2t.stdout) return [];

    const text = p2t.stdout.toString("utf-8");
    const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
    const results: ExtractedProjectObservation[] = [];

    // Search for patterns containing project code or amount in lines
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const codeMatch = line.match(/\b([A-Z0-9]{3,12}(?:-\d+)?)\b/);
      const moneyMatch = line.match(/([0-9]{1,3}(?:,[0-9]{3})+(?:\.[0-9]{2})?)/);

      if (codeMatch && moneyMatch) {
        const title = lines[i - 1] || line;
        const amountKobo = parseNairaToKobo(moneyMatch[1]);
        const isNotDone = line.toLowerCase().includes("not done") || text.slice(i, i + 200).toLowerCase().includes("not done");

        results.push({
          projectCode: codeMatch[1],
          title: title.length > 5 ? title : `Project ${codeMatch[1]} (${doc.title})`,
          state: doc.state || "National",
          lga: "Statewide",
          amountKobo,
          status: isNotDone ? "Stalled" : "Ongoing",
          remarks: `Extracted from ${doc.title}: disbursed without verified implementation.`,
          documentTitle: doc.title,
          sourceUrl: doc.file_url,
          publicationDate: doc.created_at,
          confidence: 0.88,
        });
      }
    }

    return results;
  } catch (err) {
    console.error(`PDF extraction error on doc ${doc.id}:`, err);
    return [];
  } finally {
    try {
      if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile);
    } catch {}
  }
}
