import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { DatabaseSync } from "node:sqlite";

const root = new URL("..", import.meta.url).pathname;
const sources = JSON.parse(readFileSync(join(root, "data/sources.json"), "utf8"));
const rawRoot = join(root, "data/kaggle/raw");
const dbPath = join(root, "data/nationos.sqlite");

if (!existsSync(dbPath)) {
  const seeded = spawnSync("npx", ["tsx", "scripts/seed-cli.ts"], { cwd: root, stdio: "inherit" });
  if (seeded.status !== 0) process.exit(seeded.status ?? 1);
}

mkdirSync(rawRoot, { recursive: true });
let downloaded = 0;
for (const dataset of sources.datasets) {
  const folder = join(rawRoot, dataset.slug.replace("/", "__"));
  if (existsSync(folder) && readdirSync(folder).length > 0) continue;
  const creds = existsSync(join(process.env.HOME ?? "", ".kaggle/kaggle.json"));
  if (!creds) continue;
  mkdirSync(folder, { recursive: true });
  const result = spawnSync(
    "kaggle",
    ["datasets", "download", "-d", dataset.slug, "-p", folder, "--unzip"],
    {
      stdio: "inherit",
    },
  );
  if (result.status === 0) downloaded += 1;
}

const files = collectCsv(rawRoot);
if (files.length === 0) {
  console.log("No Kaggle CSV is available yet. The cited ledger is unchanged.");
  console.log(
    "Add ~/.kaggle/kaggle.json or drop CSV files in data/kaggle/raw, then rerun npm run import:kaggle.",
  );
  process.exit(0);
}

const db = new DatabaseSync(dbPath);
let updates = 0;
for (const file of files) {
  const table = parseCsv(readFileSync(file, "utf8"));
  if (table.length < 2) continue;
  const headers = table[0].map((cell) => cell.trim().toLowerCase());
  updates += applyIndicators(db, headers, table.slice(1), file);
  updates += applyFaac(db, headers, table.slice(1));
}
db.close();
console.log(`Kaggle import finished. Downloaded ${downloaded}. Updated ${updates} values.`);

function collectCsv(dir, found = []) {
  if (!existsSync(dir)) return found;
  for (const name of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, name.name);
    if (name.isDirectory()) collectCsv(path, found);
    else if (name.name.toLowerCase().endsWith(".csv")) found.push(path);
  }
  return found;
}

function applyIndicators(db, headers, rows, file) {
  const rateIndex = headers.findIndex((header) => /exchange|fx/.test(header));
  if (rateIndex < 0) return 0;
  const yearIndex = headers.findIndex((header) => header === "year" || header === "label");
  let chosen = rows[rows.length - 1];
  if (yearIndex >= 0) {
    chosen = [...rows].sort((a, b) => Number(b[yearIndex]) - Number(a[yearIndex]))[0];
  }
  const rate = Number(String(chosen[rateIndex]).replace(/[^0-9.]/g, ""));
  if (!Number.isFinite(rate)) return 0;
  db.prepare(
    "UPDATE indicators SET value = ?, period = ?, source = ? WHERE fiscal_year = 2026 AND title = ?",
  ).run(
    `₦${Math.round(rate).toLocaleString("en-NG")}/$`,
    "Kaggle series",
    dirname(file),
    "Exchange rate",
  );
  return 1;
}

function applyFaac(db, headers, rows) {
  const stateIndex = headers.findIndex((header) => header === "state" || header === "jurisdiction");
  const amountIndex = headers.findIndex((header) => /amount|allocation/.test(header));
  if (stateIndex < 0 || amountIndex < 0) return 0;
  const update = db.prepare(
    "UPDATE faac SET amount_million = ?, provenance = 'published' WHERE fiscal_year = 2026 AND jurisdiction_id = ?",
  );
  let count = 0;
  for (const row of rows) {
    const id = row[stateIndex].trim();
    const amount = Number(String(row[amountIndex]).replace(/[^0-9.]/g, ""));
    if (!id.startsWith("NG-") || !Number.isFinite(amount)) continue;
    count += update.run(amount, id).changes ?? 0;
  }
  return count;
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = "";
  let quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    if (quoted) {
      if (char === '"' && text[index + 1] === '"') {
        cell += '"';
        index += 1;
      } else if (char === '"') quoted = false;
      else cell += char;
    } else if (char === '"') quoted = true;
    else if (char === ",") {
      row.push(cell);
      cell = "";
    } else if (char === "\n") {
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else if (char !== "\r") cell += char;
  }
  if (cell.length > 0 || row.length > 0) {
    row.push(cell);
    rows.push(row);
  }
  return rows.filter((entry) => entry.some((value) => value.trim() !== ""));
}
