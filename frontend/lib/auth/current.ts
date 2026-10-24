import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { userFromToken } from "./service";
import { SESSION_COOKIE } from "./token";
import type { PublicUser, Role } from "./types";

export async function currentUser(): Promise<PublicUser | null> {
  const jar = await cookies();
  return userFromToken(jar.get(SESSION_COOKIE)?.value);
}

export async function requireRole(role: Role): Promise<PublicUser> {
  const user = await currentUser();
  if (!user) redirect("/sign-in");
  if (user.role !== role) redirect("/forbidden");
  return user;
}
