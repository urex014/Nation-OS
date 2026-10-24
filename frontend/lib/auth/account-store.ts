import type { PublicUser } from "./types";

export type AccountRecord = PublicUser & { passwordHash: string };

export type NewCitizen = {
  id: string;
  email: string;
  name: string;
  agency: string;
  password: string;
};

/** Hosted or local accounts. The session cookie does not read this. */
export type AccountStore = {
  findByEmail(email: string): Promise<AccountRecord | null>;
  insertCitizen(input: NewCitizen): Promise<PublicUser | "exists">;
  deleteById(id: string): Promise<void>;
};
