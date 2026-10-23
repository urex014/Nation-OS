import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // One build worker keeps the demo practical on a modest development machine.
  poweredByHeader: false,
  experimental: { cpus: 1 },
  outputFileTracingRoot: process.cwd(),
};

export default nextConfig;
