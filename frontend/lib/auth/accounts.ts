import type { AccountRecord, AccountStore } from "./account-store";
import { DEMO_USERS } from "./demo-users";
import { memoryAccounts } from "./memory-accounts";
import { sqliteAccounts } from "./store";
import type { PublicUser } from "./types";

export type { AccountRecord, AccountStore };

/**
 * Demo seats are not stored here. They live in demo-users.ts.
 * sqlite keeps new citizens in a local file. memory keeps them in this process.
 * On Vercel the default is memory, because each copy has its own disk.
 * Replace this function to use a hosted database such as Neon. The cookie does not change.
 */
export function accountStore(): AccountStore {
  const choice = process.env.NATIONOS_AUTH_STORE?.trim();
  if (choice === "memory") return memoryAccounts;
  if (choice === "sqlite") return sqliteAccounts;
  if (process.env.VERCEL === "1") return memoryAccounts;
  return sqliteAccounts;
}

export function findAccount(email: string): AccountRecord | null {
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
  return accountStore().findByEmail(email);
}

export function saveCitizen(input: {
  id: string;
  email: string;
  name: string;
  agency: string;
  password: string;
}): PublicUser | "exists" {
  if (DEMO_USERS.some((user) => user.email === input.email.toLowerCase())) return "exists";
  return accountStore().insertCitizen(input);
}
