export const sectorWords = {
  food: /\b(food|prices?|hunger|affordability|storage|farming)\b/i,
  education: /\b(education|schools?|teachers?|classrooms?|attendance|learning)\b/i,
  transport: /\b(transport|roads?|bridges?|buses|bus|journey|travel)\b/i,
  health: /\b(health|healthcare|hospitals?|clinics?|medicine)\b/i,
  energy: /\b(energy|electricity|power|solar|grid)\b/i,
  water: /\b(water|sanitation|boreholes?)\b/i,
};

/** Identify fictional states; an explicit dropdown scope takes precedence. */
export function targetsFor(question, scope, states) {
  const text = question.toLowerCase(),
    named = states.filter((s) => new RegExp(`\\b${s.name.toLowerCase()}\\b`).test(text));
  if (!named.length)
    for (const s of states) {
      const short = s.name.replace(" State", "").toLowerCase();
      if (
        s.type === "State" &&
        new RegExp(`\\b${short}\\b`).test(text) &&
        !text.includes("capital territory")
      )
        named.push(s);
    }
  return scope === "all" ? named : states.filter((s) => s.id === scope);
}
