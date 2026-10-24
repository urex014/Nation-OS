import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { isRole, type Role } from "./types";

const DEV_SECRET = "dev-only-nationos-session-secret-do-not-use-in-production";

export const SESSION_COOKIE = "nationos_session";
export const SESSION_TTL_SECONDS = 60 * 60 * 12;

export type SessionClaims = {
  sid: string;
  uid: string;
  role: Role;
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

export function newSessionId(): string {
  return randomBytes(16).toString("base64url");
}

export function signSession(claims: SessionClaims): string {
  const body = Buffer.from(JSON.stringify(claims)).toString("base64url");
  const signature = createHmac("sha256", sessionSecret()).update(body).digest("base64url");
  return `${body}.${signature}`;
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
    if (!parsed.sid || !parsed.uid || !parsed.role || typeof parsed.exp !== "number") return null;
    if (!isRole(parsed.role)) return null;
    if (parsed.exp < Math.floor(Date.now() / 1000)) return null;
    return { sid: parsed.sid, uid: parsed.uid, role: parsed.role, exp: parsed.exp };
  } catch {
    return null;
  }
}
