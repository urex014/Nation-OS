import { number } from "../../lib/nigeria/format.mjs";
import { Notice } from "../nigeria/ui";
import { Simulator } from "./simulator";

/** The tax slider used to live on the government desk. Plan a budget is its home. */
export function TaxWhatIf({ snapshot }) {
  if (!snapshot) {
    return (
      <div className="mb-10">
        <Notice>The what-if waits until the published Lagos revenue is loaded.</Notice>
      </div>
    );
  }
  return (
    <div className="mb-10 grid gap-6">
      <p className="text-sm leading-6 text-stone-700">
        {snapshot.inflation ? (
          <>
            National consumer inflation was {number(snapshot.inflation.value, 2)}% in{" "}
            {snapshot.inflation.year}
            {snapshot.inflation.source ? ` (${snapshot.inflation.source.publisher})` : ""}.{" "}
            {snapshot.inflation.note}{" "}
          </>
        ) : null}
        The slider does not use that rate. The federal headline is a national figure.{" "}
        {snapshot.budget.note} This what-if does not spend it.
      </p>
      <Simulator snapshot={snapshot} />
    </div>
  );
}
