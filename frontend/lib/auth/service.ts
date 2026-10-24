import { randomBytes } from "node:crypto";
import { deleteAccount, findAccount, publicSignUpEnabled, saveCitizen } from "./accounts";
import { verifyPassword } from "./passwords";
import { SESSION_TTL_SECONDS, sessionSecret, signSession, userFromToken } from "./token";
import type { PublicUser } from "./types";

export { userFromToken };

type Attempt = { count: number; resetAt: number };
const attempts = new Map<string, Attempt>();
/** Cost 10, same work as a demo check, so a missing account is not faster. */
const DUMMY_HASH = "$2b$10$oyKhd.M9jk7MBPS7CJG6QenvKAOQ4Nruf0z6WAEHJJDlEVJxGNqhm";

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
  const account = await findAccount(email);
  const matches = await verifyPassword(password, account?.passwordHash ?? DUMMY_HASH);
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

type SessionGate = {
  assertSecret(): void;
  open(user: PublicUser): { user: PublicUser; token: string };
};

const liveGate: SessionGate = {
  assertSecret() {
    sessionSecret();
  },
  open: openSession,
};

/**
 * The signing secret is checked before the account is saved.
 * If the cookie still cannot be signed, the new row is removed.
 */
export async function registerCitizen(
  input: { name: string; agency: string; email: string; password: string },
  gate: SessionGate = liveGate,
): Promise<{ user: PublicUser; token: string } | "exists" | "disabled"> {
  if (!publicSignUpEnabled()) return "disabled";
  gate.assertSecret();
  const created = await saveCitizen({
    ...input,
    id: `user-${randomBytes(9).toString("base64url")}`,
  });
  if (created === "exists" || created === "disabled") return created;
  try {
    return gate.open(created);
  } catch (error) {
    try {
      await deleteAccount(created.id);
    } catch (rollbackError) {
      const reason = error instanceof Error ? error.message : "session error";
      throw new Error(
        `Session was not created (${reason}) and the new account could not be removed.`,
        { cause: rollbackError },
      );
    }
    throw error;
  }
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
