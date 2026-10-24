import type { Indicator } from "@/lib/types";

export function IndicatorRow({ indicators }: { indicators: Indicator[] }) {
  return (
    <div className="indicator-frame">
      <section className="indicator-grid" aria-label="Macro indicators">
        {indicators.map((indicator) => (
          <article className="indicator" key={indicator.title}>
            <p className="kpi-label">{indicator.title}</p>
            <p className="kpi-value">{indicator.value}</p>
            <p className="quiet">{indicator.period}</p>
            <p className="kpi-detail">{indicator.source}</p>
            {indicator.bars.length > 0 ? (
              <div className="bars" aria-hidden="true">
                {indicator.bars.map((bar, index) => (
                  <span key={`${indicator.title}-${index}`} style={{ height: `${bar}%` }} />
                ))}
              </div>
            ) : null}
          </article>
        ))}
      </section>
    </div>
  );
}
