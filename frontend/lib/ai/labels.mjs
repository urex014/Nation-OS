export function engineLabel(mode) {
  if (mode === "ai") return "AI · figures checked";
  if (mode === "ai-checked") return "AI · unsupported figure removed";
  if (mode === "local-data") return "Rule-based";
  return "Rule-based";
}
