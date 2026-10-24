import type { AccountStore } from "./account-store";
import { hashPassword } from "./passwords";
import type { PublicUser } from "./types";

type Row = PublicUser & { passwordHash: string };

const rows = new Map<string, Row>();

/**
 * This process only. Two copies of the server do not share it.
 * Public sign-up on Vercel does not use this store.
 */
export const memoryAccounts: AccountStore = {
  async findByEmail(email: string): Promise<Row | null> {
    return rows.get(email.toLowerCase()) ?? null;
  },
  async insertCitizen(input): Promise<PublicUser | "exists"> {
    const email = input.email.toLowerCase();
    if (rows.has(email)) return "exists";
    const passwordHash = await hashPassword(input.password);
    if (rows.has(email)) return "exists";
    const user: PublicUser = {
      id: input.id,
      email,
      name: input.name,
      agency: input.agency,
      role: "citizen",
    };
    rows.set(email, { ...user, passwordHash });
    return user;
  },
  async deleteById(id: string): Promise<void> {
    for (const [email, row] of rows) {
      if (row.id === id) rows.delete(email);
    }
  },
};
