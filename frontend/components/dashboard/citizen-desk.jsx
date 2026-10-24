import Link from "next/link";
import { naira, number } from "../../lib/nigeria/format.mjs";
import { ROLE_PROFILES } from "../../lib/auth/types";
import { Card, Heading, Notice } from "../nigeria/ui";
import { Advisor } from "./advisor";
import { DecisionList, PublishedMoney } from "./published";

export function CitizenDesk({ user, snapshot }) {
  const profile = ROLE_PROFILES.citizen;
  return (
    <>
      <Heading eyebrow={profile.title} title="Transparency desk">
        {profile.summary} Signed in as {user.name} · {user.agency}.
      </Heading>
      <PublishedMoney snapshot={snapshot} />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Where the published Lagos revenue went">
          {snapshot ? (
            <div className="space-y-3 text-sm leading-6 text-stone-700">
              <p>
                In {snapshot.year}, {snapshot.state} reported {naira(snapshot.totalNaira)} of
                internally generated revenue. Tax was {naira(snapshot.taxNaira)}. Other collections
                were {naira(snapshot.otherNaira)}. Tax is {number(snapshot.taxShare, 1)}% of that
                published total. That percentage is calculated here from the two published amounts.
                It is not a tax rate.
              </p>
              <p>{snapshot.warning}</p>
              {snapshot.igrSource && (
                <p>
                  Source: {snapshot.igrSource.publisher}, {snapshot.igrSource.title} (
                  {snapshot.igrSource.period}). {snapshot.igrSource.note}
                </p>
              )}
            </div>
          ) : (
            <p className="text-sm leading-6 text-stone-600">
              Published revenue appears here once the local database is ready.
            </p>
          )}
        </Card>
        <Card title="The federal headline is a different figure">
          {snapshot ? (
            <div className="space-y-3 text-sm leading-6 text-stone-700">
              <p>
                The {snapshot.budget.year} approved federal budget is{" "}
                {naira(snapshot.budget.approvedNaira)}. {snapshot.budget.note}{" "}
                {snapshot.budget.classification}.
              </p>
              {snapshot.budget.source && (
                <p>
                  Source: {snapshot.budget.source.publisher}, {snapshot.budget.source.title}.
                </p>
              )}
              <p>This desk cannot change a budget, a tax figure, or a saved decision.</p>
            </div>
          ) : (
            <p className="text-sm leading-6 text-stone-600">The federal headline is not loaded.</p>
          )}
        </Card>
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card title="Decisions officials saved">
          <DecisionList records={snapshot?.decisions} />
        </Card>
        <Card title="Read the evidence">
          <ul className="space-y-4">
            {profile.links.map((link) => (
              <li key={link.href}>
                <Link
                  className="font-medium text-emerald-800 underline underline-offset-4"
                  href={link.href}
                >
                  {link.label}
                </Link>
                <p className="mt-1 text-sm text-stone-600">{link.note}</p>
              </li>
            ))}
          </ul>
        </Card>
      </div>
      <div className="mt-6">
        <Advisor
          heading="AI advisor"
          intro="Ask where the published money goes. This seat cannot run a simulation. If no AI key is set, you still get the rule-based answer."
          prompts={[
            "Where does Lagos internally generated revenue come from?",
            "What is the federal budget headline, and is it Lagos spending?",
            "Compare Lagos and Rivers revenue.",
          ]}
        />
      </div>
      <div className="mt-6">
        <Notice>
          These pages show published Nigerian observations already loaded in the workspace. They do
          not approve a Lagos budget or invent a missing figure.
        </Notice>
      </div>
    </>
  );
}
