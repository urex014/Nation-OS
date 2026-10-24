import Link from "next/link";
import { naira, number } from "../../lib/nigeria/format.mjs";
import { Notice, Stat } from "../nigeria/ui";

export function PublishedMoney({ snapshot }) {
  if (!snapshot) {
    return <Notice>Published figures show up here once the figures file is built.</Notice>;
  }
  return (
    <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <Stat
        label={`${snapshot.state} IGR · ${snapshot.year}`}
        value={naira(snapshot.totalNaira)}
        note={
          snapshot.igrSource
            ? `${snapshot.igrSource.publisher} · ${snapshot.igrSource.period}`
            : "Source not loaded"
        }
      />
      <Stat
        label="Tax within that IGR"
        value={naira(snapshot.taxNaira)}
        note={`${number(snapshot.taxShare, 1)}% of the published total. A share of collections, not a tax rate.`}
      />
      <Stat
        label="Rank among states and FCT"
        value={snapshot.rank ? `${snapshot.rank} of ${snapshot.coverage}` : "Not reported"}
        note="Higher nominal IGR is not better governance"
      />
      <Stat
        label={`Federal headline · ${snapshot.budget.year}`}
        value={naira(snapshot.budget.approvedNaira)}
        note={snapshot.budget.classification || "Not Lagos spending"}
      />
    </div>
  );
}

export function DecisionList({ records }) {
  if (!records?.length) {
    return (
      <p className="text-sm leading-6 text-stone-600">
        No decision has been saved yet.
      </p>
    );
  }
  return (
    <ul className="divide-y divide-stone-100">
      {records.map((item) => (
        <li key={item.id} className="py-3">
          <Link
            href="/decisions"
            className="font-medium text-emerald-800 underline underline-offset-4"
          >
            {item.title}
          </Link>
          <p className="mt-1 text-sm text-stone-600">
            {item.createdAt} · {item.status}
          </p>
        </li>
      ))}
    </ul>
  );
}
