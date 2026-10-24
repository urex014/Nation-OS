import { getSources } from "../../lib/nigeria/repository.mjs";
import { getDatabase } from "../../lib/nigeria/database.mjs";
import { Heading, Card, Notice } from "../../components/nigeria/ui";
export const dynamic = "force-dynamic";
export const runtime = "nodejs";
// Provenance is a first-class page, including missing observations and source terms.
export default function Page() {
  const sources = getSources(),
    missing = getDatabase()
      .prepare("select count(*) as n from indicators where value is null")
      .get().n;
  return (
    <>
      <Heading eyebrow="Data Sources" title="Know what the numbers represent">
        Primary public sources, retained reporting periods and reproducible local imports. No
        synthetic citizens, companies, banks or state economic estimates are mixed into these
        observations.
      </Heading>
      <Notice>
        Coverage: 37 jurisdictions; 259 state/year revenue rows (2019–2025); 121 national
        indicator/year rows (2015–2025), including {missing} missing values. The overview selects
        each indicator’s latest non-missing observation.
      </Notice>
      <div className="mt-6 space-y-6">
        {sources.map((s) => (
          <div key={s.id} id={s.id} className="scroll-mt-8">
            <Card title={s.title}>
              <dl className="grid gap-3 text-sm md:grid-cols-[130px_1fr]">
                {[
                  ["Publisher", s.publisher],
                  ["Period", s.period],
                  ["Retrieved", s.retrievedAt],
                  ["Terms", s.rights],
                  ["Coverage notes", s.note],
                ].map(([label, value]) => (
                  <div key={label} className="contents">
                    <dt className="text-stone-500">{label}</dt>
                    <dd className="leading-6">{value}</dd>
                  </div>
                ))}
              </dl>
              <a
                className="mt-5 inline-block text-sm text-emerald-800 underline"
                href={s.url}
                target="_blank"
                rel="noreferrer"
              >
                Open publisher source ↗
              </a>
              <p className="mt-4 break-all font-mono text-[10px] text-stone-400">
                SHA-256 {s.sha256}
              </p>
            </Card>
          </div>
        ))}
      </div>
      <Card className="mt-6" title="Data that is deliberately absent">
        <p className="text-sm leading-7 text-stone-600">
          There is no verified person-level registry, current comparable state GDP/population
          series, money-in-circulation dataset, bank balance sheet or complete government
          expenditure dataset in this import. The platform does not fill those gaps with invented
          data. The planner’s assumptions are labelled separately from observations.
        </p>
      </Card>
    </>
  );
}
