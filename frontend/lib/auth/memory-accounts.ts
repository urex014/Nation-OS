import type { AccountStore } from "./account-store";
import { hashPassword } from "./passwords";
import type { PublicUser } from "./types";

type Row = PublicUser & { passwordHash: string };

const rows = new Map<string, Row>();

/** Sign-ups kept in this process only. The next server copy starts empty. */
export const memoryAccounts: AccountStore = {
  findByEmail(email: string): Row | null {
    return rows.get(email) ?? null;
  },
  insertCitizen(input: {
    id: string;
    email: string;
    name: string;
    agency: string;
    password: string;
  }): PublicUser | "exists" {
    const email = input.email.toLowerCase();
    if (rows.has(email)) return "exists";
    const user: PublicUser = {
      id: input.id,
      email,
      name: input.name,
      agency: input.agency,
      role: "citizen",
    };
    rows.set(email, { ...user, passwordHash: hashPassword(input.password) });
    return user;
  },
};
