import { formatGroupedNaira } from "@/lib/format/money";

export type Shortfall = {
  cut: number;
  capitalUntouched: true;
  sentence: string;
};

export function shortfall(drop: number, overheadNaira: number, mdaCount: number): Shortfall {
  if (!Number.isFinite(drop) || drop < 0 || drop > 100) {
    throw new Error("Drop must be a number from 0 to 100.");
  }
  const cut = overheadNaira * (drop / 100);
  const sentence =
    mdaCount === 0
      ? `No overhead records are loaded, so the cut is ${formatGroupedNaira(cut)}. Capital stays the same.`
      : `A ${drop}% drop cuts ${formatGroupedNaira(cut)} from overhead at all ${mdaCount} ministries. Capital stays the same.`;
  return { cut, capitalUntouched: true, sentence };
}
