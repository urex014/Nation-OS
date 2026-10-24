import Link from "next/link";
import { ROLE_PROFILES } from "../../lib/auth/types";
import { SiteHeader } from "./site-header";

const work = [
  {
    title: "Transparency for citizens",
    body: "Read the published budget, revenue, and decisions in plain language. Each figure names its source. Nothing on the citizen desk can be edited.",
  },
  {
    title: "Decision support for government",
    body: "Officials start from the same published figures, then keep a written reason when a choice is saved. A public sign-up cannot open this desk.",
  },
  {
    title: "Simulations with the source attached",
    body: "Move the published tax collection, or split that published revenue across sectors. The result is labelled a projection. It does not invent a new total.",
  },
];

const steps = [
  ["01", "Read the published figures", "Start from observations that name a publisher and a year."],
  [
    "02",
    "Test an allocation",
    "Move the assumptions. The workspace shows the formula, not a hidden score.",
  ],
  ["03", "Record the reason", "A decision keeps the question, the result, and the review history."],
];

function Evidence({ evidence }) {
  if (!evidence) {
    return (
      <p className="text-sm leading-6 text-stone-600">
        Published figures appear here once the local database is ready.
      </p>
    );
  }
  const items = [
    ["Lagos internally generated revenue", evidence.lagosIgr, `NBS · ${evidence.lagosYear}`],
    [
      "Lagos rank that year",
      evidence.lagosRank ? `${evidence.lagosRank} of ${evidence.coverage}` : "Not reported",
      "Nominal IGR, not a governance score",
    ],
    ["Tax within Lagos IGR", evidence.lagosTax, `NBS · ${evidence.lagosYear}`],
    [
      "Approved federal budget",
      evidence.budget,
      `${evidence.budgetYear} headline · not Lagos spending`,
    ],
  ];
  return (
    <dl className="grid gap-5">
      {items.map(([label, value, note]) => (
        <div key={label}>
          <dt className="text-xs font-medium uppercase tracking-widest text-stone-600">{label}</dt>
          <dd className="mt-1 text-2xl font-semibold tracking-tight text-[#18352e]">{value}</dd>
          <dd className="mt-1 text-sm text-stone-600">{note}</dd>
        </div>
      ))}
    </dl>
  );
}

export function Landing({ user, evidence }) {
  return (
    <div className="min-h-screen bg-[#F8FAF9] text-[#18352e]">
      <SiteHeader user={user} />
      <main id="content">
        <section className="mx-auto grid max-w-6xl items-center gap-12 px-5 py-16 md:grid-cols-[1.25fr_0.75fr] md:py-24">
          <div>
            <p className="text-xs font-medium uppercase tracking-widest text-emerald-800">
              Lagos State · citizens and government
            </p>
            <h1 className="mt-4 max-w-xl font-serif text-4xl font-semibold leading-tight tracking-tight md:text-5xl">
              See where public money goes. Test a decision before it is made.
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-stone-700">
              Citizens get a plain-language view of the published budget, revenue, and decisions,
              with the source beside each figure. Government officials get decision support:
              simulations of a budget split and of tax collections, starting from those same
              published numbers.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href={user ? "/dashboard" : "/sign-in"}
                className="rounded-md bg-[#0B3B2C] px-5 py-3 text-center text-sm font-medium text-white"
              >
                {user ? "Open your desk" : "Sign in to your desk"}
              </Link>
              <a
                href="#work"
                className="rounded-md border border-stone-300 bg-white px-5 py-3 text-center text-sm font-medium"
              >
                See how the two desks differ
              </a>
            </div>
          </div>
          <aside className="rounded-xl border border-stone-200 bg-white p-6 shadow-[0_1px_0_rgb(11_59_44_/_0.04),0_14px_32px_rgb(11_59_44_/_0.06)]">
            <h2 className="text-sm font-semibold">Published figures in this workspace</h2>
            <p className="mt-2 mb-6 text-sm leading-6 text-stone-600">
              Copied from public sources. They are not a Lagos appropriation bill.
            </p>
            <Evidence evidence={evidence} />
          </aside>
        </section>

        <section id="work" className="border-t border-stone-200">
          <div className="mx-auto max-w-6xl px-5 py-16 md:py-24">
            <h2 className="font-serif text-3xl font-semibold tracking-tight">What NationOS does</h2>
            <p className="mt-4 max-w-2xl text-base leading-7 text-stone-700">
              Transparency for the public. Decision support and simulations for government.
            </p>
            <div className="mt-10 grid gap-4 md:grid-cols-3">
              {work.map((item) => (
                <article
                  key={item.title}
                  className="rounded-xl border border-stone-200 bg-white p-6"
                >
                  <h3 className="text-lg font-semibold">{item.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-stone-700">{item.body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="roles" className="border-t border-stone-200 bg-white">
          <div className="mx-auto max-w-6xl px-5 py-16 md:py-24">
            <h2 className="font-serif text-3xl font-semibold tracking-tight">Who it is for</h2>
            <p className="mt-4 max-w-2xl text-base leading-7 text-stone-700">
              Sign-in sends each person to their own desk. A role cannot open another role&apos;s
              desk.
            </p>
            <div className="mt-10 grid gap-4 sm:grid-cols-2">
              {Object.values(ROLE_PROFILES).map((role) => (
                <article key={role.role} className="rounded-xl border border-stone-200 p-6">
                  <h3 className="text-lg font-semibold">{role.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-stone-700">{role.summary}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="border-t border-stone-200">
          <div className="mx-auto max-w-6xl px-5 py-16 md:py-24">
            <h2 className="font-serif text-3xl font-semibold tracking-tight">
              How a decision is kept
            </h2>
            <ol className="mt-10 grid gap-8 md:grid-cols-3">
              {steps.map(([index, title, body]) => (
                <li key={index}>
                  <p className="text-xs font-medium uppercase tracking-widest text-emerald-800">
                    {index}
                  </p>
                  <h3 className="mt-2 text-lg font-semibold">{title}</h3>
                  <p className="mt-2 text-sm leading-6 text-stone-700">{body}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="border-t border-stone-200 bg-[#0B3B2C] text-white">
          <div className="mx-auto flex max-w-6xl flex-col gap-6 px-5 py-16 md:flex-row md:items-end md:justify-between md:py-20">
            <div className="max-w-xl">
              <h2 className="font-serif text-3xl font-semibold tracking-tight">
                Open the desk for your role.
              </h2>
              <p className="mt-4 text-base leading-7 text-emerald-50">
                One demonstration seat is a government official. One is a citizen. A new account is
                always a citizen.
              </p>
            </div>
            <Link
              href="/sign-in"
              className="inline-flex shrink-0 justify-center rounded-md bg-white px-5 py-3 text-sm font-medium text-[#0B3B2C] focus-visible:outline-white"
            >
              Sign in
            </Link>
          </div>
        </section>
      </main>
      <footer className="border-t border-stone-200 px-5 py-8 text-sm leading-6 text-stone-600">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 sm:flex-row sm:justify-between">
          <p>NationOS · Lagos State planning workspace</p>
          <p>Public evidence. Not an official gazette or an appropriation law.</p>
        </div>
      </footer>
    </div>
  );
}
