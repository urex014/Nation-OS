export function engineLabel(mode, aiStatus) {
  if (mode === "ai" || mode === "ai-checked") {
    return mode === "ai-checked" ? "AI · unsupported figure removed" : "AI · figures checked";
  }
  if (aiStatus === "not_configured") return "Rule-based · AI not configured";
  if (aiStatus === "error") return "Rule-based · AI error";
  return "Rule-based";
}
