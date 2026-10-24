import Link from "next/link";
import { formatNaira, millionToNaira } from "@/lib/format/money";
import type { DecisionRecord } from "@/lib/types";

export function DecisionList({ records }: { records: DecisionRecord[] }) {
  if (records.length === 0) {
    return (
      <section className="panel">
        <p>No decision has been preserved yet.</p>
        <p>
          <Link href="/budget">Run an investigation</Link> and preserve it.
        </p>
      </section>
    );
  }
  return (
    <div className="stack">
      {records.map((record) => (
        <article className="panel stack" key={record.id}>
          <div className="priority-row">
            <h2>{record.title}</h2>
            <time dateTime={record.createdAt}>
              {new Date(record.createdAt).toLocaleString("en-NG")}
            </time>
          </div>
          <p>{record.question}</p>
          <p className="quiet">
            {record.strategy} · {record.horizon}-year horizon
          </p>
          <h3 className="eyebrow">Assumptions</h3>
          <ul>
            {record.assumptions.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <h3 className="eyebrow">Trade-offs</h3>
          <ul>
            {record.tradeoffs.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <h3 className="eyebrow">Allocation</h3>
          <ul>
            {Object.entries(record.budgets).map(([sector, amount]) => (
              <li key={sector}>
                {sector}: {formatNaira(millionToNaira(amount))}
              </li>
            ))}
          </ul>
          {record.revisions.length > 0 ? (
            <>
              <h3 className="eyebrow">Revision</h3>
              <ul className="diff">
                {record.revisions.map((revision) => (
                  <li key={`${record.id}-${revision.field}`}>
                    {revision.field}: <s>{revision.before}</s> {revision.after}
                  </li>
                ))}
              </ul>
            </>
          ) : null}
        </article>
      ))}
    </div>
  );
}
