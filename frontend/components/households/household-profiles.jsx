"use client";
import React, { useState } from "react";
import engine from "../../lib/domain/citizen-engine.cjs";
import register from "../../data/citizen-states.cjs";
import { Button, Field, Heading, Note, Panel } from "../ui/primitives";
import { number } from "../../lib/client/country.mjs";

const states = engine.prepare(register);
export function HouseholdProfiles() {
  const [scope, setScope] = useState(states[0].id),
    [group, setGroup] = useState(0);
  const state = states.find((item) => item.id === scope);
  const offset = state.offset + group * 4;
  const people = Array.from(
    { length: Math.min(4, state.offset + state.count - offset) },
    (_, index) => engine.citizen(offset + index, states),
  );
  const household = people[0];
  return (
    <>
      <Heading eyebrow="People & places" title="Understand household circumstances">
        Inspect fictional households to understand the kinds of access barriers a national average
        can hide.
      </Heading>
      <Field label="State / territory">
        <select
          value={scope}
          onChange={(event) => {
            setScope(event.target.value);
            setGroup(0);
          }}
        >
          {states.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </select>
      </Field>
      <Panel title={household.householdId}>
        <p className="text-sm leading-7">
          {household.settlement} settlement Â· monthly household income Aâ‚¦{" "}
          {number(household.householdMonthlyIncome)} Â· {household.housingTenure} housing Â· climate
          exposure {household.climateExposure}
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          {people.map((person) => (
            <article key={person.id} className="border border-stone-200 p-4 text-sm leading-7">
              <h3>{person.name}</h3>
              <p>
                {person.age} years Â· {person.occupation}
              </p>
              <p>Education: {person.educationLevel}</p>
              <p>
                Primary care: {person.primaryCareAccess ? "Access" : "Access gap"} Â· journey{" "}
                {person.healthcareJourneyMinutes} minutes
              </p>
              <p>{person.disabilitySupportNeed}</p>
            </article>
          ))}
        </div>
        <div className="flex gap-2">
          <Button disabled={!group} onClick={() => setGroup(group - 1)}>
            Previous household
          </Button>
          <Button disabled={(group + 1) * 4 >= state.count} onClick={() => setGroup(group + 1)}>
            Next household
          </Button>
        </div>
      </Panel>
      <Note>
        Households are generated groups of up to four people, not calibrated family structures.
        Individual circumstances do not establish eligibility for any real benefit.
      </Note>
    </>
  );
}
