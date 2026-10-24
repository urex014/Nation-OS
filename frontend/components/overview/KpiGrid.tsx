import type { Overview } from "@/lib/types";

const CARDS = [
  ["approvedExpenditure", "Approved expenditure", "Third reading, 31 Mar 2026"],
  ["statutoryTransfers", "Statutory transfers", "Third reading component"],
  ["recurrentNonDebt", "Recurrent non-debt", "Third reading component"],
  ["debtService", "Debt service", "Third reading component"],
  ["capitalExpenditure", "Capital expenditure", "Third reading component"],
  ["revenueTarget", "Revenue target", "MTEF, 3 Dec 2025"],
] as const;

export function KpiGrid({ metrics }: { metrics: Overview["metrics"] }) {
  return (
    <div className="kpi-frame">
      <section className="kpi-grid" aria-label="Fiscal summary">
        {CARDS.map(([key, label, detail]) => (
          <article className={key === "approvedExpenditure" ? "kpi kpi-hero" : "kpi"} key={key}>
            <p className="kpi-label">{label}</p>
            <p className="kpi-value">{metrics[key]}</p>
            <p className="kpi-detail">{detail}</p>
          </article>
        ))}
      </section>
    </div>
  );
}
