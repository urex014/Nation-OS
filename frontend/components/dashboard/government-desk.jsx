import Link from "next/link";
import { number } from "../../lib/nigeria/format.mjs";
import { ROLE_PROFILES } from "../../lib/auth/types";
import { Card, Heading, Notice } from "../nigeria/ui";
import { Advisor } from "./advisor";
import { DecisionList, PublishedMoney } from "./published";
import { Simulator } from "./simulator";

export function GovernmentDesk({ user, snapshot }) {
  const profile = ROLE_PROFILES.government;
  return (
    <>
      <Heading eyebrow={profile.title} title="Help with decisions">
        {profile.summary} Signed in as {user.name} · {user.agency}.
      </Heading>
      <PublishedMoney snapshot={snapshot} />
      {snapshot && (
        <div className="mb-6 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <Card title="How to use this desk">
            <ul className="list-disc space-y-3 pl-5 text-sm leading-6 text-stone-700">
              {profile.duties.map((duty) => (
                <li key={duty}>{duty}</li>
              ))}
            </ul>
            <p className="mt-4 text-sm leading-6 text-stone-700">{snapshot.warning}</p>
          </Card>
          <Card title="Background, not something you edit">
            <p className="text-sm leading-6 text-stone-700">
              The federal headline is a national figure. {snapshot.budget.note} The what-if doesn’t
              spend it.
            </p>
            {snapshot.inflation && (
              <p className="mt-3 text-sm leading-6 text-stone-700">
                National consumer inflation was {number(snapshot.inflation.value, 2)}% in{" "}
                {snapshot.inflation.year}
                {snapshot.inflation.source ? ` (${snapshot.inflation.source.publisher})` : ""}.{" "}
                {snapshot.inflation.note} The slider doesn’t use this rate.
              </p>
            )}
          </Card>
        </div>
      )}
      {snapshot ? (
        <Simulator snapshot={snapshot} />
      ) : (
        <Notice>The what-if waits until the published Lagos revenue is loaded.</Notice>
      )}
      <div className="mt-6">
        <Advisor
          heading="AI advisor"
          intro="Ask what a budget or tax change would mean. The advisor uses the published figures. If AI isn't set up, you still get an answer from the data."
          prompts={[
            "What if Lagos tax collections were 10% lower than the published figure?",
            "What is the federal budget headline, and is it Lagos spending?",
            "Compare Lagos and Rivers revenue.",
          ]}
        />
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card title="Continue in the workspace">
          <ul className="space-y-4">
            {profile.links.map((link) => (
              <li key={link.href}>
                <Link
                  className="inline-flex font-medium text-emerald-800 underline underline-offset-4 max-md:min-h-11 max-md:items-center"
                  href={link.href}
                >
                  {link.label}
                </Link>
                <p className="mt-1 text-sm text-stone-600">{link.note}</p>
              </li>
            ))}
          </ul>
        </Card>
        <Card title="Saved decisions">
          <DecisionList records={snapshot?.decisions} />
        </Card>
      </div>
    </>
  );
}
