import { checkKadunaOcds } from "./connectors/kaduna-ocds";
import { recordIngestionJob } from "./store";
import { syncLagosPmr } from "./sync-pmr";
import { syncBudgitTracka, syncOcdsBpp } from "./sync-tracka";

export type SyncSummary = {
  jobId: string;
  source: string;
  status: "success" | "partial" | "failed";
  recordsRetrieved: number;
  recordsCreated: number;
  recordsUpdated: number;
  error?: string;
};

export { syncLagosPmr, syncBudgitTracka, syncOcdsBpp };

export async function runFullSync(): Promise<SyncSummary[]> {
  const summaries: SyncSummary[] = [];

  // 1. Sync Lagos State PMR
  try {
    const lagosSummary = await syncLagosPmr();
    summaries.push(lagosSummary);
  } catch (err: any) {
    summaries.push({
      jobId: `job-pmr-${Date.now()}`,
      source: "Lagos State PMR",
      status: "failed",
      recordsRetrieved: 0,
      recordsCreated: 0,
      recordsUpdated: 0,
      error: err.message,
    });
  }

  // 2. Sync BudgIT Tracka
  try {
    const trackaSummary = await syncBudgitTracka();
    summaries.push(trackaSummary);
  } catch (err: any) {
    summaries.push({
      jobId: `job-tracka-${Date.now()}`,
      source: "BudgIT Tracka",
      status: "failed",
      recordsRetrieved: 0,
      recordsCreated: 0,
      recordsUpdated: 0,
      error: err.message,
    });
  }

  // 3. Sync Nigeria BPP OCDS
  try {
    const bppSummary = await syncOcdsBpp();
    summaries.push(bppSummary);
  } catch (err: any) {
    summaries.push({
      jobId: `job-bpp-${Date.now()}`,
      source: "Nigeria BPP OCDS",
      status: "failed",
      recordsRetrieved: 0,
      recordsCreated: 0,
      recordsUpdated: 0,
      error: err.message,
    });
  }

  // 4. Check Kaduna OCDS
  try {
    const kadunaCheck = await checkKadunaOcds();
    const jobId = `job-kaduna-${Date.now()}`;
    await recordIngestionJob({
      id: jobId,
      sourceName: "Kaduna Open Contracting",
      status: kadunaCheck.available ? "success" : "failed",
      startedAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
      recordsRetrieved: kadunaCheck.mdaCount,
      recordsCreated: 0,
      recordsUpdated: 0,
      recordsRejected: 0,
      errorDetails: kadunaCheck.note,
      sourceAvailability: kadunaCheck.status,
      createdAt: new Date().toISOString(),
    });
    summaries.push({
      jobId,
      source: "Kaduna Open Contracting",
      status: kadunaCheck.available ? "success" : "failed",
      recordsRetrieved: kadunaCheck.mdaCount,
      recordsCreated: 0,
      recordsUpdated: 0,
      error: kadunaCheck.note,
    });
  } catch (err: any) {
    summaries.push({
      jobId: `job-kaduna-${Date.now()}`,
      source: "Kaduna Open Contracting",
      status: "failed",
      recordsRetrieved: 0,
      recordsCreated: 0,
      recordsUpdated: 0,
      error: err.message,
    });
  }

  return summaries;
}
