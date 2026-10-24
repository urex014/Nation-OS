import dns from "node:dns";
import { Agent, setGlobalDispatcher } from "undici";

// Configure undici globally with IPv4 preference and permissive TLS for monitored civic endpoints
const ALLOWED_HOSTS = new Set([
  "lybrah-api.lagosmepb.org",
  "pmr.lagosmepb.org",
  "apirebuild.yourtracka.org",
  "www.yourtracka.org",
  "tracka-mobile-images.s3.amazonaws.com",
  "tracka-mobile-images.s3.eu-west-2.amazonaws.com",
  "data.open-contracting.org",
  "fastly.data.open-contracting.org",
  "nocopo.bpp.gov.ng",
  "www.ocds.kdsg.gov.ng",
  "ocds.kdsg.gov.ng",
]);

let dispatcherConfigured = false;

export function ensureHttpClient(): void {
  if (dispatcherConfigured) return;
  try {
    const agent = new Agent({
      connect: {
        rejectUnauthorized: false,
        lookup: (hostname, options, callback) => {
          dns.lookup(hostname, { ...options, family: 4 }, callback);
        },
      },
    });
    setGlobalDispatcher(agent);
    dispatcherConfigured = true;
  } catch (err) {
    console.error("Failed to initialize custom HTTP dispatcher:", err);
  }
}

export async function safeFetch(url: string, init?: RequestInit): Promise<Response> {
  ensureHttpClient();
  const parsed = new URL(url);
  if (!ALLOWED_HOSTS.has(parsed.hostname)) {
    throw new Error(`SSRF Prevention: Host '${parsed.hostname}' is not in the verified source allowlist.`);
  }

  let attempt = 0;
  const maxRetries = 2;
  while (attempt <= maxRetries) {
    try {
      const res = await fetch(url, {
        ...init,
        signal: init?.signal || AbortSignal.timeout(20000),
      });
      return res;
    } catch (err: any) {
      attempt++;
      if (attempt > maxRetries) throw err;
      await new Promise((resolve) => setTimeout(resolve, attempt * 1000));
    }
  }
  throw new Error(`Failed to fetch ${url} after ${maxRetries} attempts.`);
}
