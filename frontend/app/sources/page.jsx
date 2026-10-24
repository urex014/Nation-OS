import { getSources } from "../../lib/nigeria/repository.mjs";
import { getDatabase } from "../../lib/nigeria/database.mjs";
import { Heading, Card, Notice } from "../../components/nigeria/ui";
import { HashLine } from "../../components/nigeria/hash-line";
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
      <Heading eyebrow="Sources" title="Where the numbers come from">
        Public sources, the years they cover, and a copy you can rebuild. We don’t mix in made-up
        people, companies, banks, or state economic estimates.
      </Heading>
      <Notice>
        Coverage: 37 places; 259 state-and-year revenue rows (2019–2025); 121 national
        indicator-and-year rows (2015–2025), including {missing} missing values. Missing cells are
        not zero. The overview uses each indicator’s latest year that has a value.
      </Notice>
      <div className="mt-6 space-y-6">
        {sources.map((s) => (
          <div
            key={s.id}
            id={s.id}
            className="scroll-mt-8 max-md:scroll-mt-[calc(5rem+env(safe-area-inset-top,0px))]"
          >
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
                    <dd className="break-words leading-6">{value}</dd>
                  </div>
                ))}
              </dl>
              <a
                className="mt-5 inline-block text-sm text-emerald-800 underline max-md:inline-flex max-md:min-h-11 max-md:items-center"
                href={s.url}
                target="_blank"
                rel="noreferrer"
              >
                Open the publisher’s page ↗
              </a>
              <HashLine value={s.sha256} />
            </Card>
          </div>
        ))}
      </div>
      <Card className="mt-6" title="What we left out on purpose">
        <p className="text-sm leading-7 text-stone-600">
          This import has no checked list of individual people, no current state GDP or population
          series you can compare, no money-in-circulation set, no bank balance sheet, and no
          complete record of government spending. We don’t fill those gaps with invented numbers.
          Guesses in the planner are labelled separately from published figures.
        </p>
      </Card>
    </>
  );
}
