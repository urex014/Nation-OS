"use client";
import React, { useState } from "react";
import { states, number, money } from "../../lib/client/country.mjs";
import economy from "../../lib/domain/economy-engine.cjs";
import { Heading, Panel, Stats, Field, Note } from "../ui/primitives";
import { CountryMap } from "./country-map";
import { EconomicAccounts } from "./economic-accounts";

export function CountryOverview() {
  const [scope, setScope] = useState("all");
  const state = states.find((item) => item.id === scope);
  return (
    <>
      <Heading eyebrow="Country profile" title="Republic of Aderin">
        A shared picture of the country: people, places, public services and the economy. All
        figures describe a fictional demonstration country.
      </Heading>
      <Stats
        items={[
          ["Population", "24.6M", "Unequal populations across 37 jurisdictions"],
          ["Jurisdictions", "36 + 1", "States and capital territory"],
          ["National GDP", money(economy.baseline.gdp), "Illustrative annual output"],
          ["Annual budget", money(economy.baseline.spending), "Consolidated public spending"],
        ]}
      />
      <div className="grid gap-6 xl:grid-cols-[1.2fr_1fr]">
        <Panel title="Geography & jurisdictions">
          <CountryMap selected={scope} onSelect={setScope} />
          <Field label="Geographic scope">
            <select value={scope} onChange={(event) => setScope(event.target.value)}>
              <option value="all">General / whole country</option>
              {states.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </Field>
          <p className="text-sm leading-7 text-stone-600">
            {state
              ? `${state.name} Â· ${number(state.citizenCount)} residents Â· Capital: ${state.capital}. ${state.desc}`
              : "Six zones connect farming areas, industrial centres and coastal markets. Select a state to inspect its distinct economic accounts."}
          </p>
        </Panel>
        <EconomicAccounts scope={scope} />
      </div>
      <Panel title="Natural resources">
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {economy.resources.map((resource) => (
            <article key={resource.name} className="border-l-2 border-stone-200 pl-4">
              <h3>{resource.name}</h3>
              <p className="mt-2 text-sm leading-6 text-stone-600">
                {resource.stock}
                <br />
                {resource.output}
              </p>
              <p className="mt-2 text-xs leading-5 text-stone-500">{resource.risk}</p>
            </article>
          ))}
        </div>
        <Note>
          Resources are recorded at zone level. A zone-level resource does not mean every state
          contains that deposit.
        </Note>
      </Panel>
    </>
  );
}
