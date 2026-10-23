/** Bounded keyword retrieval; matching evidence never proves an intervention works. */
const synonyms = {
  schools: "education attendance teachers classrooms",
  school: "education attendance teachers classroom",
  hospital: "health healthcare clinics",
  hospitals: "health healthcare clinics",
  electricity: "energy power",
  roads: "transport road bridge",
  road: "transport bridge travel",
  prices: "food affordability",
  budget: "economic revenue spending funding",
  jobs: "unemployment economic",
  water: "water sanitation",
  religion: "method inclusion",
  businesses: "business ownership firms",
  banks: "banking deposits loans",
  cash: "money circulation",
  currency: "money circulation",
  deposits: "money banking",
  best: "comparison performance",
  compare: "comparison ranking",
};
export function retrieveFrom(sources, states, question, scope = "all") {
  const text = question.toLowerCase();
  const named = states.filter(
    (s) =>
      text.includes(s.name.toLowerCase()) ||
      text.includes(s.name.replace(" State", "").toLowerCase()),
  );
  const scopes = scope === "all" ? named.map((s) => s.id) : [scope];
  const tokens =
    (
      text +
      " " +
      Object.entries(synonyms)
        .filter(([k]) => new RegExp(`\\b${k}\\b`).test(text))
        .map(([, v]) => v)
        .join(" ")
    ).match(/[a-z]{3,}/g) || [];
  const stop = new Set([
    "the",
    "what",
    "which",
    "should",
    "could",
    "would",
    "about",
    "have",
    "does",
    "with",
    "and",
    "for",
    "our",
    "country",
    "state",
    "states",
  ]);
  const terms = [...new Set(tokens.filter((t) => !stop.has(t)))];
  const comparison = /\b(which|compare|lowest|highest|worst|best|biggest|largest|states)\b/.test(
    text,
  );
  const ranked = sources
    .filter(
      (s) =>
        s.id !== "METHOD" && (scopes.length === 0 || s.scope === "all" || scopes.includes(s.scope)),
    )
    .map((s) => {
      const content = (s.title + " " + s.summary + " " + s.sector).toLowerCase();
      return {
        s,
        score:
          terms.reduce((n, t) => n + (content.includes(t) ? 1 : 0) + (s.sector === t ? 4 : 0), 0) +
          (scopes.includes(s.scope) ? 2 : 0) +
          (comparison && s.id.startsWith("RANKING-") && terms.includes(s.sector) ? 8 : 0),
      };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 7)
    .map((x) => x.s);
  return [
    ...(ranked.length
      ? ranked
      : [sources.find((s) => s.id === "COUNTRY"), sources.find((s) => s.id === "ECON-NATIONAL")]),
    sources.find((s) => s.id === "METHOD"),
  ];
}
