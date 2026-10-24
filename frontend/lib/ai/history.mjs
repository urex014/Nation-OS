/** Last 10 turns, trimmed so a follow-up still fits the chat body limit. */
export function recentTurns(history) {
  if (!Array.isArray(history)) return [];
  return history.slice(-10).map((turn) => ({
    role: turn?.role === "user" ? "user" : "advisor",
    text: String(turn?.text || "").slice(0, 800),
    work: Array.isArray(turn?.work)
      ? turn.work.slice(0, 3).map((item) => ({
          formula: String(item?.formula || "").slice(0, 240),
        }))
      : [],
  }));
}

export function pageSettings(page) {
  if (!page || typeof page !== "object" || Array.isArray(page)) return null;
  const budget = Number(page.annualBudgetNaira);
  return {
    path: String(page.path || "").slice(0, 80),
    annualBudgetNaira: Number.isSafeInteger(budget) ? budget : null,
    years: Number.isFinite(Number(page.years)) ? Number(page.years) : null,
    startYear: Number.isFinite(Number(page.startYear)) ? Number(page.startYear) : null,
    scope: typeof page.scope === "string" ? page.scope.slice(0, 40) : null,
    inflation: Number.isFinite(Number(page.inflation)) ? Number(page.inflation) : null,
    delivery: Number.isFinite(Number(page.delivery)) ? Number(page.delivery) : null,
    maintenance: Number.isFinite(Number(page.maintenance)) ? Number(page.maintenance) : null,
    useBudget: page.useBudget === true || page.fromLink === true,
    fromLink: page.fromLink === true,
  };
}

export function conversationText(message, history, page) {
  const turns = recentTurns(history);
  const settings = pageSettings(page);
  const lines = turns.map((turn) => {
    const who = turn.role === "user" ? "Person" : "Nation AI";
    const worked = turn.work.map((item) => item.formula).filter(Boolean).join("; ");
    return `${who}: ${turn.text}${worked ? ` (worked out: ${worked})` : ""}`;
  });
  const prompt = [
    message,
    lines.length ? `Recent conversation:\n${lines.join("\n")}` : "",
    settings ? `Page settings: ${JSON.stringify(settings)}` : "",
  ]
    .filter(Boolean)
    .join("\n\n");
  const allow = [
    message,
    ...turns.map((turn) => `${turn.text} ${turn.work.map((item) => item.formula).join(" ")}`),
    settings ? JSON.stringify(settings) : "",
  ].join("\n");
  return { turns, settings, prompt, allow };
}
