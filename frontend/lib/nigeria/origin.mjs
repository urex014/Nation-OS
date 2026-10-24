// Next may reconstruct an internal URL while Host retains the browser-facing authority.
// Forwarded headers are deliberately not trusted as an origin allowlist.
export function acceptsOrigin(request) {
  const origin = request.headers.get("origin");
  if (!origin) return true; // Non-browser local clients do not always send Origin.
  try {
    const parsed = new URL(origin);
    if (!["http:", "https:"].includes(parsed.protocol) || parsed.origin !== origin) return false;
  } catch {
    return false;
  }
  // Browsers protect Sec-Fetch-* headers from page scripts. A same-origin request
  // remains same-origin in a preview even when a proxy replaces Host and protocol.
  if (request.headers.get("sec-fetch-site") === "same-origin") return true;
  const target = new URL(request.url);
  const allowed = new Set([target.origin]);
  const host = request.headers.get("host");
  if (host && !/[\s,/@\\?#]/.test(host)) {
    try {
      allowed.add(new URL(`${target.protocol}//${host}`).origin);
    } catch {
      /* Invalid Host cannot authorize a request. */
    }
  }
  // Explicit deployment configuration supports a trusted HTTPS reverse proxy.
  for (const entry of (process.env.NATIONOS_ALLOWED_ORIGINS || "").split(",")) {
    try {
      const url = new URL(entry.trim());
      if (["http:", "https:"].includes(url.protocol) && url.origin === entry.trim())
        allowed.add(url.origin);
    } catch {
      /* Ignore malformed configuration; never relax the check. */
    }
  }
  return allowed.has(origin);
}
