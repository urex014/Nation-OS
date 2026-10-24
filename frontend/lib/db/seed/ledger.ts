export type LineItem = {
  fiscalYear: number;
  jurisdictionId: string;
  lga: string;
  mda: string;
  sector: string;
  kind: "capital" | "recurrent";
  category: "capital" | "overhead" | "personnel";
  description: string;
  amountNaira: number;
};

/** No LGA spending series is in the cited files. */
export function buildLineItems(): LineItem[] {
  return [];
}
