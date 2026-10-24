import bcrypt from "bcryptjs";

/**
 * Cost for a new password hash. Production never stores a new hash below 12.
 * Tests may set NATIONOS_BCRYPT_COST=4. Checking a password uses the cost
 * already inside that hash, so the demo seats can stay at cost 10.
 */
export function bcryptCost(): number {
  const raw = Number(process.env.NATIONOS_BCRYPT_COST ?? 12);
  const cost = Number.isInteger(raw) ? raw : 12;
  if (process.env.NODE_ENV === "production") return Math.max(12, Math.min(cost, 14));
  return Math.min(14, Math.max(4, cost));
}

export function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, bcryptCost());
}

export function verifyPassword(password: string, hash: string): Promise<boolean> {
  return new Promise((resolve, reject) => {
    bcrypt.compare(password, hash, (error, same) => {
      if (error) reject(error);
      else resolve(Boolean(same));
    });
  });
}
