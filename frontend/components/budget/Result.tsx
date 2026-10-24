import { formatNaira, millionToNaira } from "@/lib/format/money";
import type { Recommendation } from "@/lib/domain/recommend";

export function Result({ result }: { result: Recommendation }) {
  const entries = Object.entries(result.budgets);
  const max = Math.max(...entries.map(([, value]) => value), 1);
  return (
    <div className="stack">
      <ol className="stack">
        {result.investigationStages.map((stage) => (
          <li className="stage" key={stage.stage}>
            <span className="stage-index">{stage.stage}</span>
            <span>
              <strong>{stage.name}</strong>
              <span className="quiet"> · {stage.note}</span>
            </span>
          </li>
        ))}
      </ol>
      <div className="stack">
        {entries.map(([sector, amount]) => (
          <div className="priority" key={sector}>
            <div className="priority-row">
              <strong>{sector}</strong>
              <span>{formatNaira(millionToNaira(amount))}</span>
            </div>
            <div className="meter" aria-hidden="true">
              <span style={{ width: `${(amount / max) * 100}%` }} />
            </div>
          </div>
        ))}
      </div>
      <h3 className="eyebrow">Trade-offs</h3>
      <ul>
        {result.tradeoffs.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
      <h3 className="eyebrow">Risks</h3>
      <ul>
        {result.risks.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}
