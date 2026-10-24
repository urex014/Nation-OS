const TOKEN = /\d[\d,]*(?:\.\d+)?/g;

export function numericTokens(text) {
  return [...String(text).matchAll(TOKEN)].map((match) => ({
    raw: match[0],
    value: match[0].replace(/,/g, ""),
    index: match.index ?? 0,
  }));
}

function allowedValues(toolResults) {
  return new Set(numericTokens(JSON.stringify(toolResults ?? [])).map((token) => token.value));
}

function isAllowed(value, allowed) {
  if (allowed.has(value)) return true;
  if (!value.includes(".")) return false;
  for (const item of allowed) {
    if (item.startsWith(value)) return true;
  }
  return false;
}

/** Drop any sentence whose number is not in a tool result. */
export function groundReply(text, toolResults) {
  const allowed = allowedValues(toolResults);
  const parts = String(text)
    .split(/\n+|(?<=[.!?])\s+/)
    .map((part) => part.trim())
    .filter(Boolean);
  const removed = [];
  const kept = [];
  for (const part of parts) {
    const bad = numericTokens(part).filter((token) => !isAllowed(token.value, allowed));
    if (bad.length) removed.push(...bad.map((token) => token.raw));
    else kept.push(part);
  }
  if (removed.length) {
    kept.push("A figure was removed because it was not in the tool results.");
  }
  return {
    text: kept.join("\n\n"),
    removed,
    flagged: removed.length > 0,
  };
}
