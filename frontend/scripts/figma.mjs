/**
 * Utility script for querying Figma REST API directly from the workspace.
 */
import { readFileSync, existsSync } from "node:fs";
import path from "node:path";

function loadToken() {
  if (process.env.FIGMA_ACCESS_TOKEN) return process.env.FIGMA_ACCESS_TOKEN;
  if (process.env.FIGMA_API_KEY) return process.env.FIGMA_API_KEY;

  const candidatePaths = [
    path.resolve(process.cwd(), ".env.local"),
    path.resolve(process.cwd(), "frontend", ".env.local"),
    path.resolve(path.dirname(new URL(import.meta.url).pathname), "..", ".env.local"),
  ];

  for (const envPath of candidatePaths) {
    if (existsSync(envPath)) {
      const raw = readFileSync(envPath, "utf8");
      for (const line of raw.split("\n")) {
        const trimmed = line.trim();
        if (trimmed.startsWith("FIGMA_ACCESS_TOKEN=")) {
          return trimmed.replace("FIGMA_ACCESS_TOKEN=", "").trim();
        }
        if (trimmed.startsWith("FIGMA_API_KEY=")) {
          return trimmed.replace("FIGMA_API_KEY=", "").trim();
        }
      }
    }
  }
  return null;
}

const token = loadToken();
if (!token) {
  console.error("Error: Missing FIGMA_ACCESS_TOKEN in environment or .env.local");
  process.exit(1);
}

const headers = { "X-Figma-Token": token };

async function apiGet(endpoint) {
  const res = await fetch(`https://api.figma.com/v1${endpoint}`, { headers });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Figma API HTTP ${res.status}: ${err}`);
  }
  return res.json();
}

function parseUrl(urlStr) {
  try {
    const parsed = new URL(urlStr);
    const parts = parsed.pathname.split("/").filter(Boolean);
    const designIdx = parts.findIndex((p) => p === "design" || p === "file");
    const fileKey = designIdx !== -1 ? parts[designIdx + 1] : parts[0];
    const nodeId = parsed.searchParams.get("node-id");
    return { fileKey, nodeId: nodeId ? decodeURIComponent(nodeId).replace("-", ":") : null };
  } catch {
    return { fileKey: urlStr, nodeId: null };
  }
}

async function run() {
  const args = process.argv.slice(2);
  const command = args[0] || "verify";

  if (command === "verify") {
    const user = await apiGet("/me");
    console.log(
      JSON.stringify({ status: "connected", user: user.handle, email: user.email }, null, 2),
    );
    return;
  }

  if (command === "file" || command === "inspect") {
    const target = args[1];
    if (!target) {
      console.error("Usage: node scripts/figma.mjs file <fileKey|url>");
      process.exit(1);
    }
    const { fileKey, nodeId } = parseUrl(target);
    if (nodeId) {
      const data = await apiGet(`/files/${fileKey}/nodes?ids=${nodeId}`);
      console.log(JSON.stringify(data, null, 2));
    } else {
      const data = await apiGet(`/files/${fileKey}?depth=2`);
      console.log(
        JSON.stringify(
          { name: data.name, lastModified: data.lastModified, document: data.document },
          null,
          2,
        ),
      );
    }
    return;
  }

  if (command === "images") {
    const target = args[1];
    const nodeIds = args[2];
    const format = args[3] || "svg";
    const { fileKey } = parseUrl(target);
    const data = await apiGet(`/images/${fileKey}?ids=${nodeIds}&format=${format}`);
    console.log(JSON.stringify(data, null, 2));
    return;
  }

  console.log(
    "Usage: node scripts/figma.mjs [verify | file <key|url> | images <key|url> <nodeId> <svg|png>]",
  );
}

run().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
