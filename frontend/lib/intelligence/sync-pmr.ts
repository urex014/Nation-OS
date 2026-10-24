import { fetchLagosPmrProjects } from "./connectors/lagos-pmr";
import { evaluateProjectRisk } from "./risk";
import {
  upsertGovernmentProject,
  insertProjectSource,
  insertFinancialRecord,
  recordIngestionJob,
} from "./store";
import type { GovernmentProject } from "./types";
import type { SyncSummary } from "./sync";

export async function syncLagosPmr(limit = 40): Promise<SyncSummary> {
  const jobId = `job-pmr-${Date.now()}`;
  const now = new Date().toISOString();
  let created = 0;
  let updated = 0;

  try {
    const { projects } = await fetchLagosPmrProjects(1, limit);
    for (const item of projects) {
      const risk = evaluateProjectRisk({
        progressPercent: item.progressPercent,
        status: item.status,
        contractSumKobo: item.contractSumKobo,
        expendedKobo: item.expendedKobo,
        expectedCompletionDate: item.actualCompletionDate,
      });

      const project: GovernmentProject = {
        id: `gp-${item.canonicalId}`,
        canonicalId: item.canonicalId,
        name: item.name,
        description: item.description,
        state: "Lagos",
        lga: item.lga,
        agency: item.agency,
        sector: item.sector,
        status: item.status,
        progressPercent: item.progressPercent,
        contractSumKobo: item.contractSumKobo,
        expendedKobo: item.expendedKobo,
        startDate: item.startDate,
        expectedCompletionDate: null,
        actualCompletionDate: item.actualCompletionDate,
        riskLevel: risk.riskLevel,
        riskIndicators: risk.riskIndicators,
        sourceCount: 1,
        lastVerifiedAt: now,
        createdAt: now,
        updatedAt: now,
      };

      await upsertGovernmentProject(project);
      created += 1;

      await insertProjectSource({
        id: `src-${project.id}-${Date.now()}`,
        projectId: project.id,
        publisher: item.publisher,
        sourceUrl: item.sourceUrl,
        originalProjectId: item.originalId,
        documentTitle: "Lagos State Project Performance Management Report",
        retrievalTimestamp: now,
        sourceType: "api",
        confidence: 0.98,
        createdAt: now,
      });

      const zeroKobo = BigInt(0);
      if (item.contractSumKobo > zeroKobo) {
        await insertFinancialRecord({
          id: `fin-award-${project.id}`,
          projectId: project.id,
          recordType: "contract_award",
          amountKobo: item.contractSumKobo,
          currency: "NGN",
          fiscalYear: item.startDate ? new Date(item.startDate).getFullYear() : 2024,
          verified: true,
          dateRecorded: item.startDate || now.split("T")[0],
          createdAt: now,
        });
      }

      if (item.expendedKobo > zeroKobo) {
        await insertFinancialRecord({
          id: `fin-exp-${project.id}`,
          projectId: project.id,
          recordType: "expenditure",
          amountKobo: item.expendedKobo,
          currency: "NGN",
          fiscalYear: 2025,
          verified: true,
          dateRecorded: now.split("T")[0],
          createdAt: now,
        });
      }
    }

    await recordIngestionJob({
      id: jobId,
      sourceName: "Lagos State PMR",
      status: "success",
      startedAt: now,
      completedAt: new Date().toISOString(),
      recordsRetrieved: projects.length,
      recordsCreated: created,
      recordsUpdated: updated,
      recordsRejected: 0,
      sourceAvailability: "online",
      createdAt: now,
    });

    return { jobId, source: "Lagos State PMR", status: "success", recordsRetrieved: projects.length, recordsCreated: created, recordsUpdated: updated };
  } catch (err: any) {
    await recordIngestionJob({
      id: jobId,
      sourceName: "Lagos State PMR",
      status: "failed",
      startedAt: now,
      completedAt: new Date().toISOString(),
      recordsRetrieved: 0,
      recordsCreated: 0,
      recordsUpdated: 0,
      recordsRejected: 0,
      errorDetails: err.message,
      sourceAvailability: "degraded",
      createdAt: now,
    });
    throw err;
  }
}
