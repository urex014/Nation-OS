import { safeFetch } from "../http-client";

export type KadunaMda = {
  id: string;
  name: string;
  sector?: string | null;
  email?: string | null;
};

export type KadunaHealthCheck = {
  sourceName: "Kaduna Open Contracting";
  available: boolean;
  status: "online" | "degraded" | "offline";
  mdaCount: number;
  note: string;
};

export async function checkKadunaOcds(): Promise<KadunaHealthCheck> {
  const url = "https://www.ocds.kdsg.gov.ng/api/mda_list";
  try {
    const res = await safeFetch(url, {
      headers: { "User-Agent": "NationOS-Intelligence/1.0" },
      signal: AbortSignal.timeout(10000),
    });

    if (res.ok) {
      const data = (await res.json()) as KadunaMda[];
      return {
        sourceName: "Kaduna Open Contracting",
        available: true,
        status: "degraded", // MDA list works (200), project tables return 500
        mdaCount: Array.isArray(data) ? data.length : 0,
        note: "Kaduna MDA registry online. Procurement transaction endpoints report HTTP 500 upstream. Records remain isolated to Kaduna State.",
      };
    }

    return {
      sourceName: "Kaduna Open Contracting",
      available: false,
      status: "offline",
      mdaCount: 0,
      note: `Kaduna OCDS portal responded with HTTP ${res.status}`,
    };
  } catch (err: any) {
    return {
      sourceName: "Kaduna Open Contracting",
      available: false,
      status: "offline",
      mdaCount: 0,
      note: `Connection error: ${err.message}`,
    };
  }
}
