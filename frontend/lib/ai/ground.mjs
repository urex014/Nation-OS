const TOKEN = /\d[\d,]*(?:\.\d+)?/g;
const SCALES = [
  [/^[\s\u00a0]*(?:tn|trillion)\b/i, 1e12],
  [/^[\s\u00a0]*(?:bn|billion)\b/i, 1e9],
  [/^[\s\u00a0]*(?:mn|million)\b/i, 1e6],
  [/^[\s\u00a0]*m\b/i, 1e6],
  [/^[\s\u00a0]*(?:kobo)\b/i, 0.01],
];
const WORDS = {
  one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9,
  ten: 10, eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15, sixteen: 16,
  seventeen: 17, eighteen: 18, nineteen: 19, twenty: 20, thirty: 30, forty: 40, fifty: 50,
  sixty: 60, seventy: 70, eighty: 80, ninety: 90, hundred: 100,
};
const WORD_SCALE = { thousand: 1e3, million: 1e6, billion: 1e9, trillion: 1e12 };
const WORD_RE =
  /\b(one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety|hundred)(?:\s+(thousand|million|billion|trillion))?\b/gi;

function stepOf(digits) {
  const fraction = digits.split(".")[1] || "";
  return fraction ? 10 ** -fraction.length : 1;
}

function isYearContext(before) {
  return /(?:\byear\b|\bfiscal\b|\bfy\b|"year"\s*:\s*)$/i.test(before.trimEnd());
}

export function readNumbers(text, fromUser = false) {
  const source = String(text ?? "");
  const found = [];
  for (const match of source.matchAll(TOKEN)) {
    const digits = match[0].replace(/,/g, "");
    const value = Number(digits);
    if (!Number.isFinite(value)) continue;
    const index = match.index ?? 0;
    const after = source.slice(index + match[0].length);
    const before = source.slice(Math.max(0, index - 32), index);
    let scale = 1;
    let scaled = false;
    for (const [pattern, factor] of SCALES) {
      if (pattern.test(after)) {
        scale = factor;
        scaled = true;
        break;
      }
    }
    const year = !scaled && digits.length === 4 && value >= 1900 && value <= 2100 && isYearContext(before);
    found.push({
      raw: match[0], digits, scale, scaled, fromUser,
      magnitude: value * scale,
      step: stepOf(digits) * scale,
      percent: /^[\s\u00a0]*%/.test(after),
      year,
    });
  }
  for (const match of source.matchAll(WORD_RE)) {
    const count = WORDS[match[1].toLowerCase()];
    const unit = match[2] ? WORD_SCALE[match[2].toLowerCase()] : 1;
    if (!count) continue;
    found.push({
      raw: match[0],
      digits: String(count * unit),
      scale: unit,
      scaled: Boolean(match[2]),
      fromUser,
      magnitude: count * unit,
      step: unit,
      percent: false,
      year: false,
      word: true,
    });
  }
  return found;
}

function matches(candidate, allowed) {
  if (candidate.year) {
    const typed =
      allowed.fromUser &&
      !allowed.word &&
      !allowed.scaled &&
      allowed.scale === 1 &&
      allowed.magnitude === candidate.magnitude;
    return Boolean(typed || (allowed.year && allowed.magnitude === candidate.magnitude));
  }
  if (allowed.year) return false;
  if (candidate.digits === allowed.digits && candidate.scale === allowed.scale) return true;
  if (
    candidate.scale === allowed.scale &&
    candidate.digits.includes(".") &&
    allowed.digits.startsWith(candidate.digits)
  ) {
    return true;
  }
  const room = Math.max(candidate.step, allowed.step) / 2 + 1e-6;
  if (Math.abs(candidate.magnitude - allowed.magnitude) <= room) return true;
  if (candidate.percent && Math.abs(candidate.magnitude / 100 - allowed.magnitude) <= room / 100) {
    return true;
  }
  return false;
}

/** Drop a figure that is not in a tool result or the person's own words. Units have to match. */
export function groundReply(text, toolResults, userMessage = "") {
  const allowed = [
    ...readNumbers(JSON.stringify(toolResults ?? [])),
    ...readNumbers(userMessage ?? "", true),
  ];
  const reply = String(text);
  const parts = reply
    .split(/\n+|(?<=[.!?])\s+/)
    .map((part) => part.trim())
    .filter(Boolean);
  const removed = [];
  const kept = [];
  for (const part of parts) {
    const claims = readNumbers(part).map((token) => {
      if (!token.scaled && /^20\d{2}$/.test(token.digits)) return { ...token, year: true };
      return token;
    });
    const bad = claims.filter((token) => !allowed.some((item) => matches(token, item)));
    if (bad.length) removed.push(...bad.map((token) => token.raw));
    else kept.push(part);
  }
  if (removed.length) {
    kept.push("A figure was removed because it was not in the tool results or your question.");
  }
  return { text: kept.join("\n\n"), removed, flagged: removed.length > 0 };
}
