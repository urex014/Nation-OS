import { api } from "../../../../../lib/nigeria/http.mjs";
import { getDb } from "../../../../../lib/intelligence/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = api(async (_: Request, context: { params: Promise<{ jobId: string }> }) => {
  const { jobId } = await context.params;
  const db = getDb();
  const job: any = db.prepare("SELECT * FROM ingestion_jobs WHERE id = ?").get(jobId);
  if (!job) {
    throw Object.assign(new Error(`Ingestion job '${jobId}' not found.`), { status: 404 });
  }

  return {
    id: job.id,
    sourceName: job.source_name,
    status: job.status,
    startedAt: job.started_at,
    completedAt: job.completed_at,
    recordsRetrieved: Number(job.records_retrieved),
    recordsCreated: Number(job.records_created),
    recordsUpdated: Number(job.records_updated),
    recordsRejected: Number(job.records_rejected),
    errorDetails: job.error_details,
    sourceAvailability: job.source_availability,
  };
});
