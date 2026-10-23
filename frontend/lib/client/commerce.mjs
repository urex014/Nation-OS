import engine from "../domain/commerce-engine.cjs";
import { states } from "./country.mjs";

// Build once per module instance; never allocate all citizen records to count firms.
export const commerce = engine.build(states);
