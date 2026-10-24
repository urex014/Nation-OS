"use client";
import { usePathname } from "next/navigation";
import { WorkspaceShell } from "./shell";

const PUBLIC_PATHS = new Set(["/", "/sign-in", "/forbidden"]);

export function AppFrame({ user, children }) {
  const pathname = usePathname();
  if (PUBLIC_PATHS.has(pathname)) return children;
  return <WorkspaceShell user={user}>{children}</WorkspaceShell>;
}
