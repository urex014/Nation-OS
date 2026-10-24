import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // One build worker keeps the demo practical on a modest development machine.
  poweredByHeader: false,
  reactStrictMode: true,
  experimental: { cpus: 1 },
  serverExternalPackages: ["node:sqlite", "postgres"],
  outputFileTracingRoot: process.cwd(),
  outputFileTracingIncludes: {
    "/*": ["./lib/nigeria/schema.sql", "./db/schema.sql", "./data/nigeria/normalized/**/*"],
    "/**": ["./lib/nigeria/schema.sql", "./db/schema.sql", "./data/nigeria/normalized/**/*"],
    "/api/**": ["./lib/nigeria/schema.sql", "./db/schema.sql", "./data/nigeria/normalized/**/*"],
  },
};

export default nextConfig;
