"use client";
import React, { useState } from "react";
import { commerce } from "../../lib/client/commerce.mjs";
import { money, number } from "../../lib/client/country.mjs";
import { Button, DataTable, Heading, Note, Panel, Stats } from "../ui/primitives";
import { BusinessRegister } from "./business-register";

export function CommerceWorkspace() {
  const [tab, setTab] = useState("Businesses");
  return (
    <>
      <Heading eyebrow="Enterprise & monetary accounts" title="Businesses & banking">
        Distinguish where a business operates from who controls it. Inspect bank balance sheets and
        national monetary stocks.
      </Heading>
      <Stats
        items={[
          ["Registered firms", "24,600", "Synthetic formal register"],
          ["Banks", "8", "Domestic, foreign and joint control"],
          ["Public cash", money(commerce.financial.currencyOutsideBanks), "Cash outside banks"],
          [
            "Included deposits",
            money(commerce.financial.totalDeposits),
            "Overnight + short-term deposits",
          ],
        ]}
      />
      <div className="flex flex-wrap gap-2">
        {["Businesses", "Banks", "Money in circulation"].map((item) => (
          <Button key={item} primary={tab === item} onClick={() => setTab(item)}>
            {item}
          </Button>
        ))}
      </div>
      {tab === "Businesses" && <BusinessRegister />}
      {tab === "Banks" && (
        <Panel title="Bank register">
          <DataTable headers={["Bank", "Ownership", "Branches", "Deposits", "Loans", "Assets"]}>
            {commerce.banks.map((bank) => (
              <tr key={bank.id}>
                <td>{bank.name}</td>
                <td>{bank.ownership}</td>
                <td>{number(bank.branches)}</td>
                <td>{money(bank.deposits)}</td>
                <td>{money(bank.loans)}</td>
                <td>{money(bank.totalAssets)}</td>
              </tr>
            ))}
          </DataTable>
          <Note>
            Bank links in firm records are fictional relationships, not account balances. All banks
            have balanced synthetic assets and liabilities plus equity.
          </Note>
        </Panel>
      )}
      {tab === "Money in circulation" && (
        <Panel title="National monetary stocks">
          <DataTable headers={["Measure", "Aâ‚¦ millions"]}>
            {Object.entries(commerce.financial)
              .filter(([, value]) => typeof value === "number")
              .map(([key, value]) => (
                <tr key={key}>
                  <td>{key}</td>
                  <td>{money(value)}</td>
                </tr>
              ))}
          </DataTable>
          <Note>
            Currency issued = public cash + vault cash. Demo narrow money = public cash + overnight
            deposits. Demo extended money adds short-term deposits. These measures overlap; do not
            add them together or to GDP.
          </Note>
        </Panel>
      )}
    </>
  );
}
