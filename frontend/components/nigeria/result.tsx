import { formatNaira, millionToNaira } from "@/lib/format/money";
import type { Recommendation } from "@/lib/domain/recommend";
import { Card } from "./ui";

export function Result({ result }: { result: Recommendation }) {
  const entries = Object.entries(result.budgets);
  const max = Math.max(...entries.map(([, value]) => value), 1);
  return (
    <div className="mt-6 space-y-6">
      <Card title="How this was calculated">
        <ol className="space-y-3 text-sm">
          {result.investigationStages.map((stage) => (
            <li key={stage.stage}>
              <strong>
                {stage.stage}. {stage.name}
              </strong>
              <span className="text-stone-500"> · {stage.note}</span>
            </li>
          ))}
        </ol>
      </Card>
      <Card title="Sector split">
        <div className="space-y-4">
          {entries.map(([sector, amount]) => (
            <div key={sector}>
              <div className="mb-2 flex justify-between text-sm">
                <strong className="capitalize">{sector}</strong>
                <span>{formatNaira(millionToNaira(amount))}</span>
              </div>
              <div className="h-2 rounded bg-stone-100">
                <div
                  className="h-2 rounded bg-emerald-800"
                  style={{ width: `${(amount / max) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </Card>
      <Card title="Trade-offs">
        <ul className="space-y-2 text-sm leading-6">
          {result.tradeoffs.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </Card>
      <Card title="Risks">
        <ul className="space-y-2 text-sm leading-6">
          {result.risks.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
