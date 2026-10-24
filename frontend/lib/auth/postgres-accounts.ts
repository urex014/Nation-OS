import type { AccountStore } from "./account-store";
import { hashPassword } from "./passwords";
import { getSql, schemaStatements } from "../runtime/postgres";
import { isRole, type PublicUser } from "./types";

/** Tagged query used by Postgres and by the conflict test. */
export type Query = (
  strings: TemplateStringsArray,
  ...values: unknown[]
) => Promise<Record<string, unknown>[]>;

type Runnable = Query & { unsafe?: (statement: string) => Promise<unknown> };

const prepared = new WeakMap<object, Promise<void>>();

function prepare(sql: Runnable): Promise<void> {
  const key = sql as object;
  const existing = prepared.get(key);
  if (existing) return existing;
  const pending = (async () => {
    if (typeof sql.unsafe !== "function") return;
    for (const statement of schemaStatements()) await sql.unsafe(statement);
  })().catch((error: unknown) => {
    prepared.delete(key);
    throw error;
  });
  prepared.set(key, pending);
  return pending;
}

function userFrom(row: Record<string, unknown>): PublicUser | null {
  const role = row.role;
  if (typeof row.id !== "string" || typeof row.email !== "string") return null;
  if (typeof row.name !== "string" || typeof row.agency !== "string") return null;
  if (typeof role !== "string" || !isRole(role)) return null;
  return { id: row.id, email: row.email, name: row.name, agency: row.agency, role };
}

/** One insert. A duplicate email, in any letter case, returns no row. */
export function createPostgresAccounts(sql: Runnable): AccountStore {
  return {
    async findByEmail(email: string) {
      await prepare(sql);
      const rows = await sql`
        select id, email, name, agency, role, password_hash
        from users
        where lower(email) = ${email.toLowerCase()}
      `;
      const row = rows[0];
      if (!row || typeof row.password_hash !== "string") return null;
      const user = userFrom(row);
      if (!user) return null;
      return { ...user, passwordHash: row.password_hash };
    },
    async insertCitizen(input) {
      await prepare(sql);
      const email = input.email.toLowerCase();
      const passwordHash = await hashPassword(input.password);
      const rows = await sql`
        insert into users (id, email, name, agency, role, password_hash)
        values (${input.id}, ${email}, ${input.name}, ${input.agency}, 'citizen', ${passwordHash})
        on conflict do nothing
        returning id, email, name, agency, role
      `;
      const user = rows[0] ? userFrom(rows[0]) : null;
      return user ?? "exists";
    },
    async deleteById(id: string) {
      await prepare(sql);
      await sql`delete from users where id = ${id}`;
    },
  };
}

export function postgresAccounts(): AccountStore {
  return createPostgresAccounts(getSql() as unknown as Runnable);
}
