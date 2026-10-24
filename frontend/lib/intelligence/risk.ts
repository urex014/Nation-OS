import type { GovernmentProject, RiskIndicator, RiskLevel } from "./types";

export function evaluateProjectRisk(p: Partial<GovernmentProject> & { progressPercent: number; status: string; contractSumKobo: bigint; expendedKobo: bigint }): {
  riskLevel: RiskLevel;
  riskIndicators: RiskIndicator[];
} {
  const indicators: RiskIndicator[] = [];
  const nowYear = 2026;

  // 1. Schedule delay
  if (p.expectedCompletionDate) {
    const endYear = new Date(p.expectedCompletionDate).getFullYear();
    if (!isNaN(endYear) && endYear < nowYear && p.progressPercent < 100) {
      indicators.push({
        code: "SCHEDULE_DELAY",
        label: "Schedule Delay",
        detail: `Expected completion was ${p.expectedCompletionDate}, yet recorded progress is ${p.progressPercent}%.`,
      });
    }
  }

  // 2. Stalled or Abandoned status
  if (p.status === "Stalled") {
    indicators.push({
      code: "STALLED_PROGRESS",
      label: "Implementation Stalled",
      detail: "Independent civic monitoring or MDA reports identify work has halted on this site.",
    });
  } else if (p.status === "Abandoned") {
    indicators.push({
      code: "ABANDONED_REPORT",
      label: "Reported Abandoned",
      detail: "Credible field observation reports contract site has been vacated without commissioning.",
    });
  }

  // 3. Funding gap / disbursement discrepancy
  const zero = BigInt(0);
  const hundred = BigInt(100);
  if (p.expendedKobo > zero && p.contractSumKobo > zero) {
    const expenditureRatio = Number((p.expendedKobo * hundred) / p.contractSumKobo);
    if (expenditureRatio >= 50 && p.progressPercent < 20) {
      indicators.push({
        code: "FUNDING_GAP",
        label: "Financial Discrepancy",
        detail: `Over ${expenditureRatio}% of allocated budget disbursed, but recorded physical progress is only ${p.progressPercent}%.`,
      });
    }
  }

  // Determine overall risk level
  let riskLevel: RiskLevel = "Low";
  if (indicators.some((i) => i.code === "ABANDONED_REPORT")) {
    riskLevel = "Critical";
  } else if (indicators.some((i) => i.code === "FUNDING_GAP" || i.code === "STALLED_PROGRESS")) {
    riskLevel = "High";
  } else if (indicators.some((i) => i.code === "SCHEDULE_DELAY")) {
    riskLevel = "Medium";
  }

  return { riskLevel, riskIndicators: indicators };
}

export function computeUrgencyScore(p: GovernmentProject): number {
  let score = 50; // base score

  // Higher urgency for essential social sectors
  if (p.sector === "Healthcare" || p.sector === "Education" || p.sector === "Environment & Water") {
    score += 25;
  } else if (p.sector === "Infrastructure & Works" || p.sector === "Transportation") {
    score += 15;
  }

  // High progress unfinished projects have high completion payoff
  if (p.status === "Ongoing" && p.progressPercent >= 60 && p.progressPercent < 100) {
    score += 20;
  }

  // Stalled/delayed projects need critical intervention
  if (p.riskLevel === "High" || p.riskLevel === "Critical") {
    score += 15;
  }

  return Math.min(Math.max(score, 0), 100);
}
