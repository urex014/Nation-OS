export type NormalizedStatus =
  | "Planned"
  | "Procurement"
  | "Ongoing"
  | "Completed"
  | "Stalled"
  | "Abandoned"
  | "Cancelled"
  | "Unknown";

export type RiskLevel = "Low" | "Medium" | "High" | "Critical";

export type RiskIndicator = {
  code: "SCHEDULE_DELAY" | "STALLED_PROGRESS" | "FUNDING_GAP" | "DISCREPANCY" | "ABANDONED_REPORT";
  label: string;
  detail: string;
  sourceReference?: string;
};

export type GovernmentProject = {
  id: string;
  canonicalId: string;
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
  expectedCompletionDate: string | null;
  actualCompletionDate: string | null;
  riskLevel: RiskLevel;
  riskIndicators: RiskIndicator[];
  sourceCount: number;
  primarySource?: string;
  sources?: ProjectSource[];
  lastVerifiedAt: string;
  createdAt: string;
  updatedAt: string;
};

export type SourceType = "api" | "portal" | "pdf" | "ocds" | "report";

export type ProjectSource = {
  id: string;
  projectId: string;
  publisher: string;
  sourceUrl: string;
  originalProjectId: string;
  documentTitle?: string;
  pageNumber?: number;
  publicationDate?: string;
  retrievalTimestamp: string;
  sourceType: SourceType;
  confidence: number;
  rawPayloadJson?: string;
  createdAt: string;
};

export type FinancialRecordType =
  | "allocation"
  | "contract_award"
  | "disbursement"
  | "expenditure";

export type ProjectFinancialRecord = {
  id: string;
  projectId: string;
  recordType: FinancialRecordType;
  amountKobo: bigint;
  currency: string;
  fiscalYear: number;
  sourceId?: string;
  description?: string;
  verified: boolean;
  verifiedBy?: string;
  dateRecorded: string;
  createdAt: string;
};

export type ProjectStatusObservation = {
  id: string;
  projectId: string;
  reportedStatus: string;
  progressPercent?: number;
  observationDate: string;
  publisher: string;
  sourceId?: string;
  remarks?: string;
  conflicting: boolean;
  createdAt: string;
};

export type IngestionJobStatus = "pending" | "running" | "success" | "failed" | "partial";

export type IngestionJob = {
  id: string;
  sourceName: string;
  status: IngestionJobStatus;
  startedAt: string;
  completedAt?: string;
  recordsRetrieved: number;
  recordsCreated: number;
  recordsUpdated: number;
  recordsRejected: number;
  errorDetails?: string;
  sourceAvailability: "online" | "degraded" | "offline";
  createdAt: string;
};

export type PriorityWeights = {
  completeExisting: number;
  essentialServices: number;
  geographicEquity: number;
  economicGrowth: number;
};

export type DecisionAnalysis = {
  id: string;
  title: string;
  proposedBudgetKobo: bigint;
  priorityWeights: PriorityWeights;
  selectedLga?: string;
  selectedSector?: string;
  allocationResults: {
    totalAllocatedKobo: bigint;
    unallocatedKobo: bigint;
    existingProjectsCount: number;
    newProjectsCount: number;
    sectorBreakdown: Record<string, { amountKobo: bigint; percent: number }>;
    lgaBreakdown: Record<string, { amountKobo: bigint; percent: number; sources?: any[] }>;
    recommendedProjects: {
      projectId: string;
      name: string;
      lga: string;
      sector: string;
      allocatedKobo: bigint;
      remainingCostKobo: bigint;
      progressPercent: number;
      rationale: string;
      sources: {
        publisher: string;
        url: string;
        documentTitle?: string;
        publicationDate?: string;
        retrievalTimestamp?: string;
        originalProjectId?: string;
        pageNumber?: number;
        isOfficial?: boolean;
      }[];
    }[];
  };
  rationale: string;
  evidenceCitations: { title: string; url: string; note: string }[];
  createdBy?: string;
  createdAt: string;
};
