import { fetchTrackaProjects } from "./connectors/budgit-tracka";
import { fetchOcdsProjects } from "./connectors/ocds-bpp";
import { evaluateProjectRisk } from "./risk";
import {
  upsertGovernmentProject,
  insertProjectSource,
  insertFinancialRecord,
  recordIngestionJob,
} from "./store";
import type { GovernmentProject } from "./types";
import type { SyncSummary } from "./sync";

export async function syncBudgitTracka(limit = 40): Promise<SyncSummary> {
  const jobId = `job-tracka-${Date.now()}`;
  const now = new Date().toISOString();
  let created = 0;
  let updated = 0;

  try {
    const { projects } = await fetchTrackaProjects("Lagos", 1, limit);
    for (const item of projects) {
      const risk = evaluateProjectRisk({
        progressPercent: item.progressPercent,
        status: item.status,
        contractSumKobo: item.contractSumKobo,
        expendedKobo: item.expendedKobo,
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
        documentTitle: "BudgIT Tracka Project Monitoring",
        retrievalTimestamp: now,
        sourceType: "portal",
        confidence: 0.95,
        createdAt: now,
      });

      const zeroKobo = BigInt(0);
      if (item.contractSumKobo > zeroKobo) {
        await insertFinancialRecord({
          id: `fin-alloc-${project.id}`,
          projectId: project.id,
          recordType: "allocation",
          amountKobo: item.contractSumKobo,
          currency: "NGN",
          fiscalYear: item.raw.year || 2024,
          verified: false,
          dateRecorded: now.split("T")[0],
          createdAt: now,
        });
      }
    }

    await recordIngestionJob({
      id: jobId,
      sourceName: "BudgIT Tracka",
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

    return { jobId, source: "BudgIT Tracka", status: "success", recordsRetrieved: projects.length, recordsCreated: created, recordsUpdated: updated };
  } catch (err: any) {
    await recordIngestionJob({
      id: jobId,
      sourceName: "BudgIT Tracka",
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

export async function syncOcdsBpp(limit = 20): Promise<SyncSummary> {
  const jobId = `job-bpp-${Date.now()}`;
  const now = new Date().toISOString();
  let created = 0;

  try {
    const projects = await fetchOcdsProjects(limit);
    for (const item of projects) {
      const risk = evaluateProjectRisk({
        progressPercent: item.progressPercent,
        status: item.status,
        contractSumKobo: item.contractSumKobo,
        expendedKobo: item.expendedKobo,
      });

      const project: GovernmentProject = {
        id: `gp-${item.canonicalId}`,
        canonicalId: item.canonicalId,
        name: item.name,
        description: item.description,
        state: "Lagos",
        lga: "Statewide",
        agency: item.agency,
        sector: item.sector,
        status: item.status,
        progressPercent: item.progressPercent,
        contractSumKobo: item.contractSumKobo,
        expendedKobo: item.expendedKobo,
        startDate: item.startDate,
        expectedCompletionDate: null,
        actualCompletionDate: null,
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
        documentTitle: "Nigeria Bureau of Public Procurement NOCOPO OCDS Dataset",
        retrievalTimestamp: now,
        sourceType: "ocds",
        confidence: 0.99,
        createdAt: now,
      });
    }

    await recordIngestionJob({
      id: jobId,
      sourceName: "Nigeria BPP OCDS",
      status: "success",
      startedAt: now,
      completedAt: new Date().toISOString(),
      recordsRetrieved: projects.length,
      recordsCreated: created,
      recordsUpdated: 0,
      recordsRejected: 0,
      sourceAvailability: "online",
      createdAt: now,
    });

    return { jobId, source: "Nigeria BPP OCDS", status: "success", recordsRetrieved: projects.length, recordsCreated: created, recordsUpdated: 0 };
  } catch (err: any) {
    await recordIngestionJob({
      id: jobId,
      sourceName: "Nigeria BPP OCDS",
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
