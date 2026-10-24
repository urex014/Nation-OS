import type { PublicUser } from "./types";

export type AccountRecord = PublicUser & { passwordHash: string };

export type NewCitizen = {
  id: string;
  email: string;
  name: string;
  agency: string;
  password: string;
};

/** Swap this for a hosted database. The session cookie does not read it. */
export type AccountStore = {
  findByEmail(email: string): AccountRecord | null;
  insertCitizen(input: NewCitizen): PublicUser | "exists";
};
