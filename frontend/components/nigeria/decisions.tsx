import Link from "next/link";
import { formatNaira, millionToNaira } from "@/lib/format/money";
import type { DecisionRecord } from "@/lib/types";
import { Card, Heading } from "./ui";

export function Decisions({ records }: { records: DecisionRecord[] }) {
  return (
    <>
      <Heading eyebrow="Decision & Audit Records" title="Keep the reasoning with the decision">
        Each saved split keeps the question, the assumptions, the trade-offs, and any change from
        the previous record.
      </Heading>
      {records.length === 0 ? (
        <Card>
          <p className="text-sm text-stone-500">No decision has been preserved yet.</p>
          <p className="mt-3 text-sm">
            <Link className="underline" href="/budget">
              Run an investigation
            </Link>{" "}
            and preserve it.
          </p>
        </Card>
      ) : (
        <div className="space-y-6">
          {records.map((record) => (
            <Card key={record.id} title={record.title}>
              <p className="text-xs text-stone-500">
                {new Date(record.createdAt).toLocaleString("en-NG")} · {record.strategy} ·{" "}
                {record.horizon}-year horizon
              </p>
              <p className="mt-3 text-sm leading-6">{record.question}</p>
              <h3 className="mt-5 text-sm font-semibold">Assumptions</h3>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
                {record.assumptions.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
              <h3 className="mt-5 text-sm font-semibold">Trade-offs</h3>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
                {record.tradeoffs.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
              <h3 className="mt-5 text-sm font-semibold">Allocation</h3>
              <ul className="mt-2 space-y-1 text-sm">
                {Object.entries(record.budgets).map(([sector, amount]) => (
                  <li key={sector} className="flex justify-between">
                    <span className="capitalize">{sector}</span>
                    <strong>{formatNaira(millionToNaira(amount))}</strong>
                  </li>
                ))}
              </ul>
              {record.revisions.length > 0 ? (
                <>
                  <h3 className="mt-5 text-sm font-semibold">Revision</h3>
                  <ul className="mt-2 space-y-1 text-sm">
                    {record.revisions.map((revision) => (
                      <li key={`${record.id}-${revision.field}`}>
                        {revision.field}: <s>{revision.before}</s> {revision.after}
                      </li>
                    ))}
                  </ul>
                </>
              ) : null}
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
