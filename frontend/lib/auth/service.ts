import { randomBytes } from "node:crypto";
import { hashPassword, verifyPassword } from "./passwords";
import {
  createSessionRow,
  deleteSessionRow,
  findByEmail,
  insertCitizen,
  userForSession,
} from "./store";
import { newSessionId, readSessionClaims, SESSION_TTL_SECONDS, signSession } from "./token";
import type { PublicUser } from "./types";

type Attempt = { count: number; resetAt: number };
const attempts = new Map<string, Attempt>();
let dummyHash: string | null = null;

function placeholderHash(): string {
  dummyHash ??= hashPassword("nationos-dummy-password");
  return dummyHash;
}

export function registerFailure(email: string): void {
  const now = Date.now();
  const current = attempts.get(email);
  if (!current || current.resetAt < now) {
    attempts.set(email, { count: 1, resetAt: now + 15 * 60 * 1000 });
    return;
  }
  current.count += 1;
}

export function clearFailures(email: string): void {
  attempts.delete(email);
}

export function tooManyAttempts(email: string): boolean {
  const current = attempts.get(email);
  return Boolean(current && current.resetAt >= Date.now() && current.count >= 8);
}

export async function authenticate(
  email: string,
  password: string,
): Promise<{ user: PublicUser; token: string } | null> {
  const account = findByEmail(email);
  const matches = await verifyPassword(password, account?.passwordHash ?? placeholderHash());
  if (!account || !matches) return null;
  const user: PublicUser = {
    id: account.id,
    email: account.email,
    name: account.name,
    agency: account.agency,
    role: account.role,
  };
  return openSession(user);
}

export function registerCitizen(input: {
  name: string;
  agency: string;
  email: string;
  password: string;
}): PublicUser | "exists" {
  return insertCitizen({ ...input, id: `user-${randomBytes(9).toString("base64url")}` });
}

export function openSession(user: PublicUser): { user: PublicUser; token: string } {
  const sid = newSessionId();
  const exp = Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS;
  createSessionRow(sid, user.id, exp);
  return { user, token: signSession({ sid, uid: user.id, role: user.role, exp }) };
}

export function userFromToken(token: string | undefined | null): PublicUser | null {
  const claims = readSessionClaims(token);
  if (!claims) return null;
  const user = userForSession(claims.sid);
  if (!user || user.id !== claims.uid || user.role !== claims.role) return null;
  return user;
}

export function endSession(token: string | undefined | null): void {
  const claims = readSessionClaims(token);
  if (claims) deleteSessionRow(claims.sid);
}
