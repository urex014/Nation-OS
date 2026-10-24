/** Node 24 ships node:sqlite. @types/node 20 in this workspace does not describe it yet. */
declare module "node:sqlite" {
  interface StatementSync {
    get(...params: unknown[]): unknown;
    all(...params: unknown[]): unknown[];
    run(...params: unknown[]): { changes: number };
  }

  export class DatabaseSync {
    constructor(path: string, options?: { readOnly?: boolean; timeout?: number });
    exec(sql: string): void;
    prepare(sql: string): StatementSync;
    close(): void;
  }
}
