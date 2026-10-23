import { DecisionMemory } from "../../components/decisions/decision-memory";

export const metadata = {
  title: "Decision Records - NationOS",
  description:
    "Preserve the evidence, assumptions, trade-offs and revision history behind budget proposals.",
};

export default function DecisionsPage() {
  return <DecisionMemory />;
}
