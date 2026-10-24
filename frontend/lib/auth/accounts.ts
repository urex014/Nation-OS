import type { AccountRecord, AccountStore } from "./account-store";
import { DEMO_USERS } from "./demo-users";
import { memoryAccounts } from "./memory-accounts";
import { databaseUrl } from "../runtime/database-url";
import type { PublicUser } from "./types";

export type { AccountRecord, AccountStore };
export { databaseUrl };

export const SIGN_UP_DISABLED =
  "Public sign-up is off until a shared database is connected. Demonstration accounts can still sign in.";

export type AccountMode = "memory" | "sqlite" | "postgres" | "disabled";

/**
 * Postgres when a database URL is set.
 * SQLite on your own computer.
 * On Vercel, with no database URL, public sign-up is off.
 * An explicit sqlite or memory choice is only for a single machine or a test.
 */
export function accountMode(): AccountMode {
  const choice = process.env.NATIONOS_AUTH_STORE?.trim() || "";
  const url = databaseUrl();
  if (choice === "postgres" || (!choice && url)) return "postgres";
  if (choice === "memory") return "memory";
  if (choice === "sqlite") return "sqlite";
  if (process.env.VERCEL === "1") return "disabled";
  return "sqlite";
}

/** Memory and local files are not shared across Vercel copies, so sign-up stays off. */
export function publicSignUpEnabled(): boolean {
  const mode = accountMode();
  if (mode === "disabled") return false;
  if (mode === "postgres" && !databaseUrl()) return false;
  if (process.env.VERCEL === "1" && mode !== "postgres") return false;
  return true;
}

const disabledAccounts: AccountStore = {
  async findByEmail() {
    return null;
  },
  async insertCitizen() {
    throw new Error(SIGN_UP_DISABLED);
  },
  async deleteById() {},
};

export async function accountStore(): Promise<AccountStore> {
  const mode = accountMode();
  if (mode === "memory") return memoryAccounts;
  if (mode === "sqlite") {
    const { sqliteAccounts } = await import("./store");
    return sqliteAccounts;
  }
  if (mode === "postgres") {
    const { postgresAccounts } = await import("./postgres-accounts");
    return postgresAccounts();
  }
  return disabledAccounts;
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

export async function saveCitizen(input: {
  id: string;
  email: string;
  name: string;
  agency: string;
  password: string;
}): Promise<PublicUser | "exists" | "disabled"> {
  if (!publicSignUpEnabled()) return "disabled";
  if (DEMO_USERS.some((user) => user.email === input.email.toLowerCase())) return "exists";
  return (await accountStore()).insertCitizen(input);
}

export async function deleteAccount(id: string): Promise<void> {
  if (accountMode() === "disabled") return;
  await (await accountStore()).deleteById(id);
}
