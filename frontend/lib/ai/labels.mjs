export function engineLabel(mode, aiStatus) {
  if (mode === "ai" || mode === "ai-checked") {
    return mode === "ai-checked" ? "AI · a number was removed" : "AI · numbers checked";
  }
  if (aiStatus === "not_configured") return "From the data · AI isn't set up";
  if (aiStatus === "error") return "From the data · AI hit an error";
  return "From the data";
}
