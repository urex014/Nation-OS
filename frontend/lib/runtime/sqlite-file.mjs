import { copyFileSync, existsSync, mkdirSync } from "node:fs";
import path from "node:path";

/** Vercel sets this. The project directory cannot be written at run time. */
export function onVercel() {
  return process.env.VERCEL === "1";
}

/**
 * Local runs keep the requested file. On Vercel, open a copy under /tmp.
 * A bundled file is copied once. A missing file is created in /tmp on first use.
 * Published money is copied once. Accounts and decisions use Postgres when a URL is set.
 */
export function writableDatabasePath(preferred) {
  if (!preferred || preferred === ":memory:" || !onVercel()) return preferred;
  const slug = preferred
    .replace(/[^a-z0-9]+/gi, "-")
    .replace(/^-|-$/g, "")
    .slice(-80);
  const target = path.join("/tmp", "nationos", `${slug}.sqlite`);
  mkdirSync(path.dirname(target), { recursive: true });
  if (!existsSync(target) && existsSync(preferred)) copyFileSync(preferred, target);
  return target;
}
