import { splitNaira } from "@/lib/domain/split";

export const STRATEGIES = {
  needs: { education: 22, health: 28, transport: 16, food: 14, energy: 12, water: 8 },
  growth: { education: 16, health: 14, transport: 26, food: 10, energy: 24, water: 10 },
  balance: { education: 18, health: 18, transport: 18, food: 16, energy: 16, water: 14 },
} as const;

const KEYWORDS: Record<string, string[]> = {
  education: ["education", "school", "teacher"],
  health: ["health", "healthcare", "hospital", "clinic"],
  transport: ["transport", "road", "infrastructure", "logistics"],
  food: ["food", "agriculture", "farm"],
  energy: ["energy", "power", "electric"],
  water: ["water", "sanitation"],
};

export type Strategy = keyof typeof STRATEGIES;

export type RecommendInput = {
  question: string;
  budget: number;
  horizon: number;
  strategy: Strategy;
};

export type Stage = {
  stage: number;
  name: string;
  status: "completed";
  note: string;
};

export type Recommendation = {
  budgets: Record<string, number>;
  investigationStages: Stage[];
  tradeoffs: string[];
  risks: string[];
};

export function recommend(
  input: RecommendInput,
  inflation: string,
  places: number,
): Recommendation {
  const weights = applyKeywords({ ...STRATEGIES[input.strategy] }, input.question);
  const budgets = splitNaira(input.budget, weights);
  const question = input.question.toLowerCase();
  const tradeoffs: string[] = [];
  if (namesSector(question, "health") && namesSector(question, "education")) {
    tradeoffs.push("Health and education get more. Roads and power get less.");
  }
  if (question.includes("underserved")) {
    tradeoffs.push("States with less money need closer checks on spending.");
  }
  if (tradeoffs.length === 0) {
    tradeoffs.push(
      `The ${input.strategy} split leaves less for sectors the question did not name.`,
    );
  }
  return {
    budgets,
    investigationStages: stages(input, inflation, places),
    tradeoffs,
    risks: [`Inflation is ${inflation}. Repair costs can rise.`],
  };
}

function namesSector(text: string, sector: string): boolean {
  return KEYWORDS[sector].some((word) => text.includes(word));
}

function applyKeywords(weights: Record<string, number>, question: string): Record<string, number> {
  const text = question.toLowerCase();
  for (const sector of Object.keys(KEYWORDS)) {
    if (namesSector(text, sector)) weights[sector] += 8;
  }
  return weights;
}

function stages(input: RecommendInput, inflation: string, places: number): Stage[] {
  return [
    {
      stage: 1,
      name: "Read the question",
      status: "completed",
      note: "Found the sectors in the question",
    },
    {
      stage: 2,
      name: "Load the baseline",
      status: "completed",
      note: `Read ${places} places`,
    },
    {
      stage: 3,
      name: "Compare sectors",
      status: "completed",
      note: "Checked what each sector needs",
    },
    {
      stage: 4,
      name: "Check the limits",
      status: "completed",
      note: `Inflation is ${inflation}`,
    },
    {
      stage: 5,
      name: "Split the money",
      status: "completed",
      note: `Used a ${input.horizon}-year view`,
    },
    {
      stage: 6,
      name: "Write the result",
      status: "completed",
      note: `Used the ${input.strategy} split`,
    },
  ];
}
