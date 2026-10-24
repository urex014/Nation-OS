import type { Role } from "./types";

/** Hackathon seats. Passwords are public demo credentials, not production secrets. */
export type DemoUser = {
  id: string;
  email: string;
  name: string;
  agency: string;
  role: Role;
  password: string;
};

export const DEMO_USERS: readonly DemoUser[] = [
  {
    id: "user-government",
    email: "government@nationos.demo",
    name: "Government official",
    agency: "Lagos State budget and finance (demonstration)",
    role: "government",
    password: "Government-Demo-2026!",
  },
  {
    id: "user-citizen",
    email: "citizen@nationos.demo",
    name: "Citizen",
    agency: "Lagos resident (demonstration)",
    role: "citizen",
    password: "Citizen-Demo-2026!",
  },
];
