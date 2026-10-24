import { randomBytes } from "node:crypto";
import { findAccount, saveCitizen } from "./accounts";
import { hashPassword, verifyPassword } from "./passwords";
import { SESSION_TTL_SECONDS, signSession, userFromToken } from "./token";
import type { PublicUser } from "./types";

export { userFromToken };

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
  const account = findAccount(email);
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
  return saveCitizen({ ...input, id: `user-${randomBytes(9).toString("base64url")}` });
}

/** The cookie carries the person. There is no session row to write. */
export function openSession(user: PublicUser): { user: PublicUser; token: string } {
  const iat = Math.floor(Date.now() / 1000);
  return {
    user,
    token: signSession({
      userId: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
      agency: user.agency,
      iat,
      exp: iat + SESSION_TTL_SECONDS,
    }),
  };
}
