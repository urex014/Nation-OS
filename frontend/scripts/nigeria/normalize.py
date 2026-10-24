"""Normalize downloaded public data with the Python standard library; no Python web server.

Workbook money is converted with Decimal into integer kobo. Missing cells stay null.
Run from any directory. Generated NDJSON is one observation per line, not hand-authored code.
"""
from collections import Counter
from decimal import Decimal, ROUND_HALF_UP
from hashlib import sha256
from io import BytesIO
from pathlib import Path
import json
import re
from datetime import datetime, timezone
import xml.etree.ElementTree as ET
from zipfile import ZipFile

ROOT = Path(__file__).resolve().parents[2] / "data" / "nigeria"
RAW, OUT = ROOT / "raw", ROOT / "normalized"
OUT.mkdir(exist_ok=True)
NS = {"s": "http://schemas.openxmlformats.org/spreadsheetml/2006/main"}


def write_rows(name, rows):
    with (OUT / name).open("w", encoding="utf-8") as stream:
        for row in rows:
            stream.write(json.dumps(row, ensure_ascii=False, separators=(",", ":")) + "\n")


def clean_name(name):
    name = re.sub(r"\s+", " ", name.replace("*", "").strip()).casefold()
    if name == "nassarawa":
        return "nasarawa"  # Source-workbook spelling variant, matched to NG-NA.
    return "fct" if name in {"fct", "f.c.t", "federal capital territory", "abuja federal capital territory"} else name


def kobo(value):
    text = str(value).strip().replace(",", "")
    if text in {"", "-", "–", "N/A"}:
        return None
    amount = Decimal(text)
    if not amount.is_finite() or amount < 0:
        raise ValueError(f"Invalid source amount: {text}")
    return int((amount * 100).quantize(Decimal(1), rounding=ROUND_HALF_UP))


geometry = json.loads((RAW / "states.geojson").read_text(encoding="utf-8"))
states = [{"id": feature["properties"]["shapeISO"],
           "name": "Federal Capital Territory" if clean_name(feature["properties"]["shapeName"]) == "fct" else feature["properties"]["shapeName"],
           "type": "territory" if feature["properties"]["shapeISO"] == "NG-FC" else "state",
           "geometry": feature["geometry"], "sourceId": "geoboundaries-ng-2022"}
          for feature in geometry["features"]]
states.sort(key=lambda state: state["name"])
assert len(states) == 37 and len({state["id"] for state in states}) == 37
name_to_id = {clean_name(state["name"]): state["id"] for state in states}
write_rows("states.ndjson", states)

with ZipFile(RAW / "nbs-igr-2025.zip") as package:
    with ZipFile(BytesIO(package.read("IGR_DATA_2019_2025.xlsx"))) as workbook:
        strings = ["".join(item.itertext()) for item in ET.fromstring(workbook.read("xl/sharedStrings.xml")).findall("s:si", NS)]

        def cell_value(cell):
            value = cell.find("s:v", NS)
            if value is None:
                return ""
            return strings[int(value.text)] if cell.attrib.get("t") == "s" else value.text

        revenue = []
        for sheet in range(1, 6):
            rows = ET.fromstring(workbook.read(f"xl/worksheets/sheet{sheet}.xml")).findall("s:sheetData/s:row", NS)
            for row in rows:
                cells = {re.sub(r"\d", "", cell.attrib["r"]): cell_value(cell) for cell in row}
                state_id = name_to_id.get(clean_name(cells.get("B", "")))
                if state_id is None:
                    continue
                years = [(2019, "C", "D", "E"), (2020, "F", "G", "H"), (2021, "I", "J", "K")] if sheet == 1 else [(2020 + sheet, "K", "L", "M")]
                for year, tax_col, other_col, total_col in years:
                    total, tax, other = (kobo(cells.get(column, "")) for column in [total_col, tax_col, other_col])
                    components = []
                    if sheet > 1:
                        labels = ["PAYE", "Direct assessment", "Road taxes", "Stamp duties", "Capital gains tax", "Withholding tax", "Other taxes", "LGA revenue"]
                        components = [{"label": label, "kobo": kobo(cells.get(column, ""))} for label, column in zip(labels, "CDEFGHIJ")]
                    discrepancy = tax + other - total if None not in (tax, other, total) else None
                    revenue.append({"stateId": state_id, "sourceName": cells["B"].strip(), "year": year, "totalKobo": total,
                                    "taxKobo": tax, "otherKobo": other, "otherLabel": "Other revenue" if sheet == 1 else "MDA revenue",
                                    "components": components, "reconciliationKobo": discrepancy,
                                    "sourceId": "nbs-igr-2019-2025"})

assert Counter(row["year"] for row in revenue) == {year: 37 for year in range(2019, 2026)}
assert len({(row["stateId"], row["year"]) for row in revenue}) == 259
write_rows("revenue.ndjson", sorted(revenue, key=lambda row: (row["year"], row["stateId"])))

worldbank = json.loads((RAW / "worldbank.json").read_text(encoding="utf-8"))
assert len(worldbank) == 2 and worldbank[0]["pages"] == 1
indicators = [{"code": row["indicator"]["id"], "name": row["indicator"]["value"],
               "year": int(row["date"]), "value": row["value"], "sourceId": "worldbank-wdi-ng"}
              for row in worldbank[1]]
write_rows("indicators.ndjson", indicators)

budget_html = (RAW / "federal-budget-source.html").read_text(encoding="utf-8")
assert "54.99" in budget_html and "2025" in budget_html
budget = {"year": 2025, "scope": "Federal Government", "approvedNaira": 54990000000000,
          "sourceId": "fgn-budget-2025", "classification": "approved budget, not actual spending",
          "note": "Manually transcribed headline from the official budget-signing remarks; not a project register."}
(OUT / "federal-budget.json").write_text(json.dumps(budget, indent=2) + "\n", encoding="utf-8")

retrieved = datetime.now(timezone.utc).isoformat()
sources = [
    {"id": "nbs-igr-2019-2025", "title": "NBS: Internally Generated Revenue, 2019–2025", "publisher": "National Bureau of Statistics, Nigeria", "url": "https://microdata.nigerianstat.gov.ng/index.php/catalog/170/related-materials", "downloadUrl": "https://microdata.nigerianstat.gov.ng/index.php/catalog/170/download/1436", "period": "2019–2025", "file": "nbs-igr-2025.zip", "rights": "NBS source material; factual values reproduced with attribution. See publisher terms.", "note": "Audited/reconciled state submissions. IGR excludes federal transfers. Missing cells are not zero."},
    {"id": "worldbank-wdi-ng", "title": "World Development Indicators: Nigeria", "publisher": "World Bank", "url": "https://data.worldbank.org/country/nigeria", "downloadUrl": "https://api.worldbank.org/v2/country/NGA/indicator", "period": "2015–2025", "file": "worldbank.json", "rights": "World Bank open data; see dataset terms and original indicator providers.", "note": f"API last updated {worldbank[0]['lastupdated']}. Each indicator retains its own year; some values are modelled estimates."},
    {"id": "geoboundaries-ng-2022", "title": "geoBoundaries gbOpen: Nigeria ADM1", "publisher": "geoBoundaries / GRID3", "url": "https://www.geoboundaries.org/api/current/gbOpen/NGA/ADM1/", "period": "Boundaries represented: 2022", "file": "states.geojson", "rights": "CC BY 4.0; attribute geoBoundaries and GRID3.", "note": "37 state/FCT boundaries. Geometry has been simplified for display; not a legal boundary survey."},
    {"id": "fgn-budget-2025", "title": "Official remarks at the signing of the 2025 federal budget", "publisher": "State House, Federal Republic of Nigeria", "url": "https://statehouse.gov.ng/remarks-by-president-tinubu-at-the-signing-of-the-2025-budget/", "period": "2025 approved budget", "file": "federal-budget-source.html", "rights": "Official public statement; headline factual amount transcribed with attribution.", "note": "₦54.99 trillion approved federal budget. Not state IGR or actual expenditure."},
]
for source in sources:
    source["retrievedAt"] = retrieved
    source["sha256"] = sha256((RAW / source["file"]).read_bytes()).hexdigest()
(OUT / "sources.json").write_text(json.dumps(sources, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
print(json.dumps({"jurisdictions": len(states), "revenueRows": len(revenue), "indicatorRows": len(indicators),
                  "missingRevenueTotals": sum(row["totalKobo"] is None for row in revenue),
                  "componentDiscrepancies": sum(row["reconciliationKobo"] not in (None, 0) for row in revenue)}, indent=2))
