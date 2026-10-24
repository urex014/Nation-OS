import { mkdir, writeFile } from "node:fs/promises";
// Refreshes public artifacts only. Run normalization and db:init explicitly afterwards.
const folder = new URL("../../data/nigeria/raw/", import.meta.url);
await mkdir(folder, { recursive: true });
const codes = [
  "SP.POP.TOTL",
  "NY.GDP.MKTP.CD",
  "NY.GDP.MKTP.KD.ZG",
  "FP.CPI.TOTL.ZG",
  "SL.UEM.TOTL.ZS",
  "EG.ELC.ACCS.ZS",
  "SE.PRM.ENRR",
  "SH.H2O.BASW.ZS",
  "SH.DYN.MORT",
  "SH.XPD.CHEX.GD.ZS",
  "NY.GDP.TOTL.RT.ZS",
];
async function fetchFile(name, url, validate) {
  const response = await fetch(url, { signal: AbortSignal.timeout(120000) });
  if (!response.ok) throw Error(`${name}: HTTP ${response.status}`);
  const bytes = Buffer.from(await response.arrayBuffer());
  validate?.(bytes);
  await writeFile(new URL(name, folder), bytes);
  console.log(name, bytes.length);
  return bytes;
}
await fetchFile(
  "worldbank.json",
  `https://api.worldbank.org/v2/country/NGA/indicator/${codes.join(";")}?source=2&format=json&date=2015:2025&per_page=1000`,
  (b) => {
    const d = JSON.parse(b);
    if (!Array.isArray(d[1]) || d[0].pages !== 1) throw Error("Unexpected World Bank response");
  },
);
await fetchFile(
  "nbs-igr-2025.zip",
  "https://microdata.nigerianstat.gov.ng/index.php/catalog/170/download/1436",
  (b) => {
    if (b.subarray(0, 2).toString() !== "PK") throw Error("Expected NBS ZIP");
  },
);
const metadata = JSON.parse(
  await fetchFile(
    "boundary-metadata.json",
    "https://www.geoboundaries.org/api/current/gbOpen/NGA/ADM1/",
  ),
);
await fetchFile("states.geojson", metadata.simplifiedGeometryGeoJSON, (b) => {
  if (JSON.parse(b).features.length !== 37) throw Error("Expected 37 jurisdictions");
});
await fetchFile(
  "federal-budget-source.html",
  "https://statehouse.gov.ng/remarks-by-president-tinubu-at-the-signing-of-the-2025-budget/",
);
