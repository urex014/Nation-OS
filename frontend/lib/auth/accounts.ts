import type { AccountRecord, AccountStore } from "./account-store";
import { DEMO_USERS } from "./demo-users";
import { DATABASE_REQUIRED, databaseUrl, requireDatabaseUrl } from "../runtime/database-url";
import type { PublicUser } from "./types";

export type { AccountRecord, AccountStore };
export { databaseUrl };

export const SIGN_UP_DISABLED = `${DATABASE_REQUIRED} Demonstration accounts can still sign in.`;

export type AccountMode = "postgres" | "disabled";

/** Postgres when a database URL is set. Otherwise sign-up stays off, including on your own computer. */
export function accountMode(): AccountMode {
  return databaseUrl() ? "postgres" : "disabled";
}

export function publicSignUpEnabled(): boolean {
  return accountMode() === "postgres";
}

export async function accountStore(): Promise<AccountStore> {
  requireDatabaseUrl();
  const { postgresAccounts } = await import("./postgres-accounts");
  return postgresAccounts();
}

export async function findAccount(email: string): Promise<AccountRecord | null> {
  const demo = DEMO_USERS.find((user) => user.email === email);
  if (demo) {
    return {
      id: demo.id,
      email: demo.email,
      name: demo.name,
      agency: demo.agency,
      role: demo.role,
      passwordHash: demo.passwordHash,
    };
  }
  if (accountMode() === "disabled") return null;
  return (await accountStore()).findByEmail(email);
}

export async function saveCitizen(
  input: {
    id: string;
    email: string;
    name: string;
    agency: string;
    password: string;
  },
  store?: AccountStore,
): Promise<PublicUser | "exists" | "disabled"> {
  if (!store && !publicSignUpEnabled()) return "disabled";
  if (DEMO_USERS.some((user) => user.email === input.email.toLowerCase())) return "exists";
  return (store ?? (await accountStore())).insertCitizen(input);
}

export async function deleteAccount(id: string, store?: AccountStore): Promise<void> {
  if (!store && accountMode() === "disabled") return;
  await (store ?? (await accountStore())).deleteById(id);
}
