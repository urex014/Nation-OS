import type { Role } from "./types";

/** Hackathon seats. Passwords are public demo credentials, not production secrets. */
export type DemoUser = {
  id: string;
  email: string;
  name: string;
  agency: string;
  role: Role;
  password: string;
  /** bcrypt cost 10. Checked in code so sign-in does not write a file. */
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
    passwordHash: "$2b$10$rRd0ri.wxznT0QRDxRqJDuCuJ2oOv2xWjLeCHbHPpRYe837QhJsru",
  },
  {
    id: "user-citizen",
    email: "citizen@nationos.demo",
    name: "Citizen",
    agency: "Lagos resident (demonstration)",
    role: "citizen",
    password: "Citizen-Demo-2026!",
    passwordHash: "$2b$10$pn78B8HKhJlTnZq5PtwkMOhBj2Fy4TLX1gIuN5lgBQmdCk0M7IAuO",
  },
];
