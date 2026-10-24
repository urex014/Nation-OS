import bcrypt from "bcryptjs";

/** Production refuses a weak cost. Tests set NATIONOS_BCRYPT_COST=4. */
export function bcryptCost(): number {
  const raw = Number(process.env.NATIONOS_BCRYPT_COST ?? 12);
  const cost = Number.isInteger(raw) ? raw : 12;
  if (process.env.NODE_ENV === "production") return Math.max(12, Math.min(cost, 14));
  return Math.min(14, Math.max(4, cost));
}

export function hashPassword(password: string): string {
  return bcrypt.hashSync(password, bcryptCost());
}

export function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
