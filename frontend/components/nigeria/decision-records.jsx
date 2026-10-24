"use client";
import { useState } from "react";
import { Heading, Card, Button, Notice, Download, Field } from "./ui";
import { PlanResult } from "./plan-result";
import { STATUSES } from "../../lib/nigeria/constants.mjs";
import { request } from "../../lib/nigeria/client.mjs";
export function DecisionRecords({ initial, canReview = false }) {
  const [list, setList] = useState(initial),
    [record, setRecord] = useState(null),
    [status, setStatus] = useState("Draft"),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  async function act(fn) {
    setError("");
    setBusy(true);
    try {
      await fn();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  function inspect(id) {
    return act(async () => {
      const r = await request(`decisions/${id}`);
      setRecord(r);
      setStatus(r.status);
    });
  }
  async function page(offset) {
    setList(await request(`decisions?offset=${offset}&limit=20`));
  }
  return (
    <>
      <Heading eyebrow="Decision & Audit Records" title="Keep the reasoning with the decision">
        Saved records retain their calculated plan, assumptions and source metadata. Status reviews
        append an audit event and preserve the original calculation.
      </Heading>
      {error && <Notice error>{error}</Notice>}
      <Card title={`${list.total} saved decision records`}>
        {!list.total ? (
          <p className="text-sm text-stone-500">
            {canReview
              ? "No records yet. Calculate a plan in Project Intelligence, then save it with your reasoning."
              : "No decision has been saved yet. When an official saves one, it appears here with the reason and the source."}
          </p>
        ) : (
          <>
            <div className="divide-y divide-stone-100">
              {list.records.map((r) => (
                <button
                  key={r.id}
                  disabled={busy}
                  className="flex w-full items-center justify-between gap-4 py-4 text-left"
                  onClick={() => inspect(r.id)}
                >
                  <span>
                    <strong className="block text-sm">{r.title}</strong>
                    <span className="text-xs text-stone-500">
                      {r.createdAt} · revision {r.revision}
                    </span>
                  </span>
                  <span className="rounded-full bg-stone-100 px-3 py-1 text-xs">{r.status}</span>
                </button>
              ))}
            </div>
            <div className="mt-4 flex gap-3">
              <Button
                secondary
                disabled={busy || list.offset === 0}
                onClick={() => act(() => page(Math.max(0, list.offset - 20)))}
              >
                Previous
              </Button>
              <Button
                secondary
                disabled={busy || !list.hasMore}
                onClick={() => act(() => page(list.offset + 20))}
              >
                Next
              </Button>
            </div>
          </>
        )}
      </Card>
      {record && (
        <>
          <Card className="mt-6" title={record.title}>
            <p className="whitespace-pre-wrap text-sm leading-6">{record.reason}</p>
            <p className="my-4 text-xs text-stone-500">
              Record {record.id} · revision {record.revision} · saved {record.createdAt}
            </p>
            <div className="flex flex-wrap items-end gap-4">
              {canReview && (
                <>
                  <Field label="Review status">
                    <select value={status} onChange={(e) => setStatus(e.target.value)}>
                      {STATUSES.map((s) => (
                        <option key={s}>{s}</option>
                      ))}
                    </select>
                  </Field>
                  <Button
                    disabled={busy || status === record.status}
                    onClick={() =>
                      act(async () => {
                        const r = await request(
                          `decisions/${record.id}`,
                          { status, expectedRevision: record.revision },
                          "PATCH",
                        );
                        setRecord(r);
                        await page(list.offset);
                      })
                    }
                  >
                    Record review
                  </Button>
                </>
              )}
              <Button secondary disabled={busy} onClick={() => inspect(record.id)}>
                Reload record
              </Button>
              <Download value={record} />
            </div>
            <p className="mt-4 text-xs text-stone-500">
              {canReview
                ? "Local operator review only. “Reviewed” does not signify formal government approval."
                : "You can read this record. Only a government account can change its status."}
            </p>
          </Card>
          <PlanResult result={record.result} />
          <Card className="mt-6" title="Audit trail">
            <ol className="space-y-4 text-sm">
              {record.audit.map((e, i) => (
                <li key={i}>
                  <strong>{e.action}</strong>
                  <span className="ml-3 text-xs text-stone-500">{e.createdAt}</span>
                  <pre className="mt-2 overflow-x-auto text-xs">
                    {JSON.stringify(e.details, null, 2)}
                  </pre>
                </li>
              ))}
            </ol>
            <p className="mt-5 text-xs text-stone-500">
              Source snapshots are included in the JSON export. The local database is not a
              tamper-proof or multi-user audit service.
            </p>
          </Card>
        </>
      )}
    </>
  );
}
