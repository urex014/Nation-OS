import { createHmac, timingSafeEqual } from "node:crypto";
import { isRole, type PublicUser, type Role } from "./types";

const DEV_SECRET = "dev-only-nationos-session-secret-do-not-use-in-production";

export const SESSION_COOKIE = "nationos_session";
export const SESSION_TTL_SECONDS = 60 * 60 * 12;

/** Everything the next request needs. Nothing here is looked up in a database. */
export type SessionClaims = {
  userId: string;
  email: string;
  role: Role;
  name: string;
  agency: string;
  iat: number;
  exp: number;
};

export function sessionSecret(): string {
  const configured = process.env.NATIONOS_SESSION_SECRET?.trim() ?? "";
  if (configured.length >= 32) return configured;
  if (process.env.NODE_ENV === "production") {
    throw new Error("Set NATIONOS_SESSION_SECRET to 32 or more characters.");
  }
  return DEV_SECRET;
}

export function cookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge,
  };
}

export function signSession(claims: SessionClaims): string {
  const body = Buffer.from(JSON.stringify(claims)).toString("base64url");
  const signature = createHmac("sha256", sessionSecret()).update(body).digest("base64url");
  return `${body}.${signature}`;
}

function text(value: unknown, max: number): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > max) return null;
  return trimmed;
}

export function readSessionClaims(token: string | undefined | null): SessionClaims | null {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [body, signature] = parts;
  if (!body || !signature) return null;
  const expected = createHmac("sha256", sessionSecret()).update(body).digest("base64url");
  const actualBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  if (
    actualBuffer.length !== expectedBuffer.length ||
    !timingSafeEqual(actualBuffer, expectedBuffer)
  ) {
    return null;
  }
  try {
    const parsed = JSON.parse(Buffer.from(body, "base64url").toString()) as Partial<SessionClaims>;
    const userId = text(parsed.userId, 80);
    const email = text(parsed.email, 254);
    const name = text(parsed.name, 80);
    const agency = text(parsed.agency, 120);
    if (!userId || !email || !email.includes("@") || !name || !agency) return null;
    if (typeof parsed.role !== "string" || !isRole(parsed.role)) return null;
    if (typeof parsed.iat !== "number" || typeof parsed.exp !== "number") return null;
    const now = Math.floor(Date.now() / 1000);
    if (parsed.exp <= now || parsed.exp - parsed.iat > SESSION_TTL_SECONDS + 60) return null;
    return {
      userId,
      email,
      role: parsed.role,
      name,
      agency,
      iat: parsed.iat,
      exp: parsed.exp,
    };
  } catch {
    return null;
  }
}

/** The cookie is the whole session. A missing or edited signature means signed out. */
export function userFromToken(token: string | undefined | null): PublicUser | null {
  const claims = readSessionClaims(token);
  if (!claims) return null;
  return {
    id: claims.userId,
    email: claims.email,
    name: claims.name,
    agency: claims.agency,
    role: claims.role,
  };
}
