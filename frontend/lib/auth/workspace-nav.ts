import { GOVERNMENT_PATHS, type PublicUser } from "./types";

/** Shared by the desktop sidebar and the mobile menu. */
export const WORKSPACE_NAV: [string, string, string][] = [
  ["/overview", "The country", "National figures and the map"],
  ["/revenue", "Money in", "What each state collected"],
  ["/budget", "Plan a budget", "Ask questions and try a plan"],
  ["/scenarios", "What-if tests", "See what changes the plan"],
  ["/decisions", "Saved decisions", "The reason and the review history"],
  ["/sources", "Sources", "Who published each number"],
];

export function workspaceItems(user: Pick<PublicUser, "role"> | null | undefined) {
  const visible = WORKSPACE_NAV.filter(
    ([path]) =>
      user?.role === "government" || !(GOVERNMENT_PATHS as readonly string[]).includes(path),
  );
  const items = visible;
  if (user?.role !== "citizen") return items;
  return [
    ...items.filter(([path]) => path === "/overview"),
    ...items.filter(([path]) => path !== "/overview"),
  ];
}
