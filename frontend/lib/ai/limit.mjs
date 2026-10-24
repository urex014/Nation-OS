const hits = new Map();
const WINDOW_MS = 15 * 60 * 1000;
const MAX = 30;

export function chatLimitKey(request) {
  const cookie = request.headers.get("cookie") || "";
  const match = cookie.match(/(?:^|;\s*)nationos_session=([^;]+)/);
  return match ? `session:${match[1].slice(0, 24)}` : "guest";
}

/** In-memory limit for this process. It does not follow a person across servers. */
export function assertChatBudget(key) {
  const now = Date.now();
  const current = hits.get(key);
  if (!current || current.resetAt < now) {
    hits.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return;
  }
  current.count += 1;
  if (current.count > MAX) {
    throw Object.assign(Error("Too many questions. Wait a few minutes and try again."), {
      status: 429,
    });
  }
}
