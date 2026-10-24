import Link from "next/link";
import { ROLE_PROFILES } from "../../lib/auth/types";
import { SiteHeader } from "./site-header";

const work = [
  {
    title: "Transparency for citizens",
    body: "Read the published budget, revenue, and decisions in plain language. Each figure names its source. You can't edit a plan or a saved decision.",
  },
  {
    title: "Help for government decisions",
    body: "Officials start from the same published figures, then write down why a choice was saved. A public sign-up can't open the budget tools.",
  },
  {
    title: "What-ifs with the source attached",
    body: "Move the published tax collection, or split that published revenue across sectors. The result is labelled a projection. It doesn't invent a new total.",
  },
];

const steps = [
  ["01", "Read the published figures", "Start from numbers that name a publisher and a year."],
  ["02", "Try a split", "Change the guesses. You see the formula, not a hidden score."],
  ["03", "Write down why", "A decision keeps the question, the result, and the review history."],
];

function Evidence({ evidence }) {
  if (!evidence) {
    return (
      <p className="text-sm leading-6 text-stone-600">
        These published numbers show up once the figures file is built.
      </p>
    );
  }
  const items = [
    ["Lagos IGR (money the state raises itself)", evidence.lagosIgr, `NBS · ${evidence.lagosYear}`],
    [
      "Lagos rank that year",
      evidence.lagosRank ? `${evidence.lagosRank} of ${evidence.coverage}` : "Not reported",
      "Ranked by amount, not by how well the state is run",
    ],
    ["Tax within Lagos IGR", evidence.lagosTax, `NBS · ${evidence.lagosYear}`],
    [
      "Approved federal budget",
      evidence.budget,
      `${evidence.budgetYear} headline · not what Lagos spent`,
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
        <section className="mx-auto grid max-w-6xl items-center gap-12 px-5 py-16 lg:grid-cols-[1.25fr_0.75fr] lg:py-24">
          <div>
            <p className="text-xs font-medium uppercase tracking-widest text-emerald-800">
              Lagos State · citizens and government
            </p>
            <h1 className="mt-4 max-w-xl font-serif text-4xl font-semibold leading-tight tracking-tight md:text-5xl">
              See where public money goes. Try a decision before it’s made.
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-stone-700">
              Citizens get a plain view of the published budget, revenue, and decisions, with the
              source next to each figure. Government officials can try a budget split or a change in
              tax collections, starting from those same published numbers.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href={user ? "/dashboard" : "/sign-in"}
                className="rounded-md bg-[#0B3B2C] px-5 py-3 text-center text-sm font-medium text-white"
              >
                {user ? "Open the overview" : "Sign in"}
              </Link>
              <a
                href="#work"
                className="rounded-md border border-stone-300 bg-white px-5 py-3 text-center text-sm font-medium"
              >
                See how the two roles differ
              </a>
            </div>
          </div>
          <aside className="rounded-xl border border-stone-200 bg-white p-6 shadow-[0_1px_0_rgb(11_59_44_/_0.04),0_14px_32px_rgb(11_59_44_/_0.06)]">
            <h2 className="text-sm font-semibold">Published figures in this workspace</h2>
            <p className="mt-2 mb-6 text-sm leading-6 text-stone-600">
              Copied from public sources. This is not a Lagos budget law.
            </p>
            <Evidence evidence={evidence} />
          </aside>
        </section>

        <section id="work" className="scroll-mt-24 border-t border-stone-200">
          <div className="mx-auto max-w-6xl px-5 py-16 md:py-24">
            <h2 className="font-serif text-3xl font-semibold tracking-tight">What NationOS does</h2>
            <p className="mt-4 max-w-2xl text-base leading-7 text-stone-700">
              A clear view for the public. Decision help and what-ifs for government.
            </p>
            <div className="mt-10 grid gap-4 lg:grid-cols-3">
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

        <section id="roles" className="scroll-mt-24 border-t border-stone-200 bg-white">
          <div className="mx-auto max-w-6xl px-5 py-16 md:py-24">
            <h2 className="font-serif text-3xl font-semibold tracking-tight">Who it is for</h2>
            <p className="mt-4 max-w-2xl text-base leading-7 text-stone-700">
              Sign-in opens the overview. Government can also open the budget and what-if pages. A
              citizen cannot.
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

        <section id="decision" className="scroll-mt-24 border-t border-stone-200">
          <div className="mx-auto max-w-6xl px-5 py-16 md:py-24">
            <h2 className="font-serif text-3xl font-semibold tracking-tight">
              How a decision is kept
            </h2>
            <ol className="mt-10 grid gap-8 lg:grid-cols-3">
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
                Open the overview for your role.
              </h2>
              <p className="mt-4 text-base leading-7 text-emerald-50">
                One demo seat is a government official. One is a citizen. A new account is always a
                citizen.
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
          <p>Public figures. Not an official gazette or a budget law.</p>
        </div>
      </footer>
    </div>
  );
}
