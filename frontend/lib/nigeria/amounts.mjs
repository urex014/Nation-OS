const MONEY =
  /(?:(?:₦|NGN)\s*|(?<![A-Za-z])N\s*)(\d[\d,]*(?:\.\d+)?)(?:\s*(trillion|billion|million|thousand|tn|bn|mn|m|k))?\b|(\d[\d,]*(?:\.\d+)?)\s*(trillion|billion|million|thousand|tn|bn|mn|m)\b/gi;

const SCALE = {
  trillion: 1e12,
  tn: 1e12,
  billion: 1e9,
  bn: 1e9,
  million: 1e6,
  mn: 1e6,
  m: 1e6,
  thousand: 1e3,
  k: 1e3,
};

function toNaira(raw, unit) {
  const number = Number(String(raw).replace(/,/g, ""));
  if (!Number.isFinite(number)) return null;
  const naira = Math.round(number * (unit ? SCALE[unit.toLowerCase()] : 1));
  return Number.isSafeInteger(naira) && naira > 0 ? naira : null;
}

/** Pull naira amounts out of a sentence. Bare years are left alone. */
export function parseMoneyPhrases(text) {
  const source = String(text || "");
  const found = [];
  for (const match of source.matchAll(MONEY)) {
    const raw = match[1] || match[3];
    const unit = match[2] || match[4] || "";
    if (!unit && /^\d{4}$/.test(raw) && Number(raw) >= 1900 && Number(raw) <= 2100) continue;
    const naira = toNaira(raw, unit);
    if (!naira) continue;
    const index = match.index ?? 0;
    found.push({
      naira,
      index,
      raw: match[0],
      before: source.slice(Math.max(0, index - 60), index).toLowerCase(),
      after: source.slice(index, index + 60).toLowerCase(),
    });
  }
  return found;
}

function mentions(windowText, pattern) {
  return pattern.test(windowText);
}

export function classifyAmounts(text) {
  const budgetCue = /\b(budget|envelope|total)\b/;
  const projectCue = /\b(allocate|allocation|project|road|spend)\b/;
  let budget = null;
  let project = null;
  for (const item of parseMoneyPhrases(text)) {
    const around = `${item.before} ${item.after}`;
    const asBudget = mentions(item.before, budgetCue) || mentions(item.after.slice(0, 24), budgetCue);
    const asProject = mentions(around, projectCue);
    if (asBudget && !asProject) budget = item.naira;
    else if (asProject && !asBudget) project = item.naira;
    else if (asBudget && asProject) {
      const budgetAt = item.before.lastIndexOf("budget");
      const projectAt = Math.max(item.before.lastIndexOf("allocat"), item.before.lastIndexOf("project"));
      if (budgetAt > projectAt) budget = item.naira;
      else project = item.naira;
    } else if (!budget) budget = item.naira;
    else if (!project) project = item.naira;
  }
  return { budget, project };
}
