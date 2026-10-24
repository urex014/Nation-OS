import { listCitations } from "@/lib/db/seed/cited";
import { Card, Heading, Notice } from "./ui";

export function Sources() {
  const citations = listCitations();
  return (
    <>
      <Heading eyebrow="Data Sources" title="Know what the numbers represent">
        Every loaded figure is copied from frontend/data/cited/ledger.json. Each block names the
        publisher, the date, the URL, and the printed amount.
      </Heading>
      <Notice>
        Seed version 3. 36 published FAAC states. No LGA spend lines. No quarterly collections. Map
        outlines are GRID3 / geoBoundaries 2022 (CC BY 4.0). They are shapes, not money figures.
      </Notice>
      <div className="mt-6 space-y-6">
        {citations.map((source) => (
          <div key={source.id} id={source.id} className="scroll-mt-8">
            <Card title={source.title}>
              <dl className="grid gap-3 text-sm md:grid-cols-[130px_1fr]">
                {[
                  ["Publisher", source.publisher],
                  ["Date", source.date],
                  ["Note", source.note],
                ].map(([label, value]) => (
                  <div key={label} className="contents">
                    <dt className="text-stone-500">{label}</dt>
                    <dd className="leading-6">{value}</dd>
                  </div>
                ))}
              </dl>
              <a
                className="mt-5 inline-block text-sm text-emerald-800 underline"
                href={source.url}
                target="_blank"
                rel="noreferrer"
              >
                Open publisher source
              </a>
              {source.also ? (
                <p className="mt-2 break-all text-xs text-stone-400">{source.also}</p>
              ) : null}
            </Card>
          </div>
        ))}
      </div>
    </>
  );
}
