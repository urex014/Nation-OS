import type { Role } from "./types";

/** Hackathon seats. Passwords are public demo credentials, not production secrets. */
export type DemoUser = {
  id: string;
  email: string;
  name: string;
  agency: string;
  role: Role;
  password: string;
  /** bcrypt cost 12. Checked in code so sign-in does not write a file. */
  passwordHash: string;
};

export const DEMO_USERS: readonly DemoUser[] = [
  {
    id: "user-government",
    email: "government@nationos.demo",
    name: "Government official",
    agency: "Lagos State budget and finance (demonstration)",
    role: "government",
    password: "Government-Demo-2026!",
    passwordHash: "$2b$12$5jHWbW5W5h8HT7Bwfpnr9.3thhXGGWwyvIXEn0O2g8F0Evwak52l6",
  },
  {
    id: "user-citizen",
    email: "citizen@nationos.demo",
    name: "Citizen",
    agency: "Lagos resident (demonstration)",
    role: "citizen",
    password: "Citizen-Demo-2026!",
    passwordHash: "$2b$12$JvVAuD9RcLyKoyJoS3.hS.x3pf6gGxnemx.8PArZp6AZ/cK3Kg2w.",
  },
];
