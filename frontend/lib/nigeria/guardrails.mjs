import { SECTORS } from "./constants.mjs";
import { describeNaira } from "./money.mjs";

/**
 * Starting assumptions to be validated against past Lagos budgets.
 * These ranges are NOT sourced facts.
 */
export const GUARDRAILS = {
  note: "Starting assumptions to be validated against past Lagos budgets, NOT sourced facts.",
  projectCap: { warnAbovePercent: 10, blockAbovePercent: 25 },
  sectorUsualPercent: {
    education: [10, 30],
    health: [10, 30],
    transport: [8, 30],
    agriculture: [5, 25],
    energy: [8, 30],
    water: [5, 20],
  },
};

function whole(value, label) {
  const number = value ?? 0;
  if (!Number.isSafeInteger(number) || number < 0 || number > 1e14) {
    throw Object.assign(Error(`${label} must be whole naira.`), { status: 400 });
  }
  return number;
}

export function projectWarnPercent() {
  const chosen = Number(process.env.PROJECT_CAP_PERCENT);
  if (Number.isFinite(chosen) && chosen > 0 && chosen < GUARDRAILS.projectCap.blockAbovePercent) {
    return chosen;
  }
  return GUARDRAILS.projectCap.warnAbovePercent;
}

export function committedFrom(input = {}) {
  const salariesNaira = whole(input.salariesNaira, "Salaries");
  const debtServiceNaira = whole(input.debtServiceNaira, "Debt service");
  const committedMaintenanceNaira = whole(input.committedMaintenanceNaira, "Committed maintenance");
  const borrowingNaira = whole(input.borrowingNaira, "Borrowing");
  const projectNaira =
    input.projectNaira == null || input.projectNaira === ""
      ? null
      : whole(input.projectNaira, "Project");
  return {
    salariesNaira,
    debtServiceNaira,
    committedMaintenanceNaira,
    borrowingNaira,
    projectNaira,
    overrideProjectCap: input.overrideProjectCap === true,
    committedNaira: salariesNaira + debtServiceNaira + committedMaintenanceNaira,
  };
}

export function sharePercent(part, wholeAmount) {
  if (!wholeAmount) return 0;
  return Number((BigInt(part) * 10000n) / BigInt(wholeAmount)) / 100;
}

function percentLabel(value) {
  return Number(value.toFixed(2)).toString();
}

export function reviewProject({ budgetNaira, projectNaira, override = false, warnPercent } = {}) {
  if (projectNaira == null) return { blocked: false, overridden: false, warnings: [] };
  const share = sharePercent(projectNaira, budgetNaira);
  const warnAt = warnPercent ?? projectWarnPercent();
  const blockAt = GUARDRAILS.projectCap.blockAbovePercent;
  const shown = percentLabel(share);
  if (share > blockAt && !override) {
    const warning = `This gives one project ${shown}% of the budget. That's unusual, and it's above the ${blockAt}% limit, so it's blocked unless you explicitly override.`;
    return { blocked: true, overridden: false, warnings: [warning], share };
  }
  const warnings = [];
  if (share > warnAt) {
    warnings.push(
      `This gives one project ${shown}% of the budget. That's unusual. Are you sure?`,
    );
  }
  if (share > blockAt && override) {
    warnings.push(
      `You chose to override the ${blockAt}% project cap (${shown}% in one project). That override is recorded with this plan.`,
    );
    return { blocked: false, overridden: true, warnings, share };
  }
  return { blocked: false, overridden: false, warnings, share };
}

export function reviewSectors(allocations) {
  if (!allocations) return [];
  const total = Object.values(allocations).reduce((sum, value) => sum + value, 0);
  if (!total) return [];
  const warnings = [];
  for (const [key, label] of Object.entries(SECTORS)) {
    const [min, max] = GUARDRAILS.sectorUsualPercent[key];
    const share = sharePercent(allocations[key] || 0, total);
    if (share < min || share > max) {
      warnings.push(
        `${label} is ${percentLabel(share)}% of this split. The usual range we start from is ${min}–${max}%. ${GUARDRAILS.note}`,
      );
    }
  }
  return warnings;
}

export function reviewAffordability({ spendNaira, igrNaira = 0, faacNaira = null, borrowingNaira = 0 }) {
  const faac = faacNaira ?? 0;
  const available = Math.round(igrNaira) + faac + (borrowingNaira || 0);
  const gap = spendNaira - available;
  if (gap <= 0) return null;
  const faacText =
    faacNaira == null ? "FAAC isn't loaded for this place" : `FAAC ${describeNaira(faac).short}`;
  return `This is ${describeNaira(gap).short} (${describeNaira(gap).full}) more than the funds you can name. The gap is spend ${describeNaira(spendNaira).short} minus IGR ${describeNaira(Math.round(igrNaira)).short} + ${faacText} + borrowing you entered ${describeNaira(borrowingNaira || 0).short}.`;
}

export function reviewPlan(config, funds = {}) {
  const envelope = config.envelopeNaira ?? config.annualBudgetNaira;
  const project = reviewProject({
    budgetNaira: envelope,
    projectNaira: config.projectNaira,
    override: config.overrideProjectCap,
  });
  const warnings = [...project.warnings, ...reviewSectors(config.allocations)];
  if (config.committedNaira > 0) {
    const left = envelope - config.committedNaira;
    warnings.push(
      `Salaries, debt and maintenance take ${describeNaira(config.committedNaira).short} first. The sector split uses the ${describeNaira(left).short} left.`,
    );
  }
  const afford = reviewAffordability({
    spendNaira: envelope,
    igrNaira: funds.igrNaira ?? 0,
    faacNaira: funds.faacNaira ?? null,
    borrowingNaira: config.borrowingNaira ?? 0,
  });
  if (afford) warnings.push(afford);
  return {
    blocked: project.blocked ? project.warnings[0] : null,
    overridden: project.overridden,
    warnings,
  };
}
