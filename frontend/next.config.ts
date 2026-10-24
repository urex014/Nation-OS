import { spawnSync } from "node:child_process";
import { closeSync, existsSync, openSync, statSync, unlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import type { NextConfig } from "next";
import { PHASE_PRODUCTION_BUILD } from "next/constants";

const traced = [
  "./lib/nigeria/schema.sql",
  "./db/schema.sql",
  "./data/nigeria/normalized/**/*",
  "./data/intelligence/normalized/**/*",
  "./data/nigeria/nationos.sqlite",
  "./data/nationos.sqlite",
];

const buildLock = path.join(tmpdir(), "nationos-published-sqlite.lock");

/** Vercel runs `next build`, which skips the npm script that used to create these files. */
function buildPublishedSqlite() {
  try {
    if (existsSync(buildLock) && Date.now() - statSync(buildLock).mtimeMs > 60_000)
      unlinkSync(buildLock);
  } catch {
    // Another worker removed the stale lock.
  }
  let fd: number;
  try {
    fd = openSync(buildLock, "wx");
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "EEXIST") throw error;
    const start = Date.now();
    while (existsSync(buildLock)) {
      if (Date.now() - start > 120_000) {
        throw new Error("Timed out waiting for the read-only SQLite files.");
      }
      Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 200);
    }
    return;
  }
  try {
    const cli = path.join(process.cwd(), "node_modules/tsx/dist/cli.mjs");
    const result = spawnSync(process.execPath, [cli, "scripts/build-published-sqlite.mjs"], {
      cwd: process.cwd(),
      stdio: "inherit",
      env: process.env,
    });
    if (result.error || result.status !== 0) {
      throw new Error(
        "next build could not write the read-only SQLite files. They have to exist before file tracing.",
      );
    }
  } finally {
    closeSync(fd);
    unlinkSync(buildLock);
  }
}

const nextConfig = (phase: string): NextConfig => {
  if (phase === PHASE_PRODUCTION_BUILD) buildPublishedSqlite();
  return {
    poweredByHeader: false,
    reactStrictMode: true,
    experimental: { cpus: 1 },
    serverExternalPackages: ["node:sqlite", "postgres"],
    outputFileTracingRoot: process.cwd(),
    outputFileTracingIncludes: {
      "/*": traced,
      "/**": traced,
      "/api/**": traced,
      "/api/chat": traced,
      "/api/plans": traced,
      "/api/decisions": traced,
      "/api/decisions/**": traced,
      "/api/v1/**": traced,
      "/overview": traced,
      "/revenue": traced,
      "/budget": traced,
      "/scenarios": traced,
      "/sources": traced,
      "/decisions": traced,
      "/dashboard/**": traced,
    },
  };
};

export default nextConfig;
