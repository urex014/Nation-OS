/** Shared by the browser, route handlers, and proxy. Roles are assigned on the server. */
export const ROLES = ["government", "citizen"] as const;

export type Role = (typeof ROLES)[number];

export type PublicUser = {
  id: string;
  email: string;
  name: string;
  agency: string;
  role: Role;
};

export type AuthSuccess = {
  user: PublicUser;
  dashboardPath: string;
};

export type FieldErrors = Record<string, string>;

export type RoleLink = {
  href: string;
  label: string;
  note: string;
};

export type RoleProfile = {
  role: Role;
  title: string;
  path: string;
  summary: string;
  duties: string[];
  links: RoleLink[];
};

export const ROLE_PROFILES: Record<Role, RoleProfile> = {
  government: {
    role: "government",
    title: "Government official",
    path: "/dashboard/government",
    summary:
      "Decision support for budget and tax choices. Simulations start from published figures and stay labelled as projections.",
    duties: [
      "Read Lagos internally generated revenue, the tax part of it, and the federal budget headline before changing a plan.",
      "Run a projection: move the published tax collection by a percent, or split that published revenue across six sectors.",
      "The projection is arithmetic. It does not approve a budget or predict jobs, schools, or hospital results.",
    ],
    links: [
      { href: "/budget", label: "Project intelligence", note: "Ask the data and draft a plan" },
      { href: "/scenarios", label: "Scenario lab", note: "Five- and ten-year sensitivity" },
      { href: "/revenue", label: "Budget and revenue", note: "State collections side by side" },
      { href: "/decisions", label: "Decision records", note: "Save a reason and review it" },
    ],
  },
  citizen: {
    role: "citizen",
    title: "Citizen",
    path: "/dashboard/citizen",
    summary:
      "A read-only view of the published budget, revenue, and decisions, with the source beside each figure.",
    duties: [
      "See Lagos revenue, including tax, and how it ranks among states. Higher naira is not a governance score.",
      "Read the federal budget headline with its note: it is not Lagos spending.",
      "Open saved decisions and the publisher of each series. This seat cannot run the government simulation.",
    ],
    links: [
      { href: "/revenue", label: "Budget and revenue", note: "Published collections" },
      { href: "/decisions", label: "Decision records", note: "Reasons officials saved" },
      { href: "/sources", label: "Data sources", note: "Who published each series" },
      { href: "/overview", label: "National overview", note: "Country indicators and the map" },
    ],
  },
};

const BY_PATH = Object.fromEntries(
  Object.values(ROLE_PROFILES).map((profile) => [profile.path, profile.role]),
) as Record<string, Role>;

export const SHARED_PATHS = ["/overview", "/revenue", "/decisions", "/sources"] as const;
export const GOVERNMENT_PATHS = ["/budget", "/scenarios"] as const;

const WRITE_PATHS = new Set([
  "/api/plans",
  "/api/allocations",
  "/api/scenarios",
  "/api/allocate",
  "/api/v1/budgets/recommend",
  "/api/decisions",
  "/api/v1/decisions",
]);

export function isRole(value: string): value is Role {
  return (ROLES as readonly string[]).includes(value);
}

export function roleForDashboard(pathname: string): Role | null {
  return BY_PATH[pathname] ?? null;
}

export function homeFor(role: Role): string {
  return ROLE_PROFILES[role].path;
}

/** True when this request would change a plan, a decision, or a simulation. */
export function isGovernmentWrite(pathname: string, method: string): boolean {
  if (method === "GET" || method === "HEAD") return false;
  if (WRITE_PATHS.has(pathname)) return true;
  return pathname.startsWith("/api/decisions/");
}

/** Sends a person to their desk, or back to a page that role may open. */
export function destinationFor(role: Role, next?: string | null): string {
  const home = homeFor(role);
  if (
    !next ||
    !next.startsWith("/") ||
    next.startsWith("//") ||
    next.includes("\\") ||
    next.includes("://")
  ) {
    return home;
  }
  const path = next.split("?")[0] ?? "";
  if (path === home || (SHARED_PATHS as readonly string[]).includes(path)) return path;
  if (role === "government" && (GOVERNMENT_PATHS as readonly string[]).includes(path)) return path;
  return home;
}
