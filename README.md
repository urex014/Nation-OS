# NationOS

NationOS shows Nigeria’s 2026 money figures. It shows the budget headlines, FAAC money to the 36 states, a simple budget split, a “what if revenue falls” path, and the choices you save.

It is a Next.js 16 app with React 19 and TypeScript. All data sits in one SQLite file. Pages and API routes read that file. There is no Python service. There is no language model on the request. The same inputs always give the same numbers.

Open it at [http://127.0.0.1:4173](http://127.0.0.1:4173).

## Where the numbers live

Every number on screen is copied from `frontend/data/cited/ledger.json`. That file is the backup. Each block names the publisher, the date, the URL, and the figures as they were printed.

If a number is not in that file, the app does not show it.

Seed code in `frontend/lib/db/seed/cited.ts` reads the file and writes SQLite.

## Run it

You need Node.js 20 or newer. SQLite comes with Node (`node:sqlite`). You do not need Python.

```bash
cd frontend
npm install
npm run dev
```

The app listens on `127.0.0.1:4173`. `npm start` serves a production build on the same host and port.

| Command | What it does |
| --- | --- |
| `npm run check:lines` | Each source file under `frontend/` must be 300 lines or fewer. It skips `node_modules`, `.next`, and `data`. |
| `npm run lint` | ESLint |
| `npm run format:check` | Prettier |
| `npm run check` | Domain tests |
| `npm run test:ui` | UI tests in JSDOM |
| `npm run build` | Production build |
| `npm run seed` | Fill SQLite from the backup file. Run this after `SEED_VERSION` changes. |
| `npm run import:kaggle` | Optional. Does nothing until a CSV is present. |

## How a number gets to the screen

1. We type a published figure into `frontend/data/cited/ledger.json`, with who printed it, when, and the URL.
2. `getDb()` in `frontend/lib/db/connection.ts` opens `frontend/data/nationos.sqlite` (or `NATION_DB_PATH`). Tests use a memory database. A file database turns on WAL. Foreign keys stay on. Then the schema is applied and `seed()` runs.
3. `seed()` in `frontend/lib/db/seed/run.ts` stops if `meta.seed_version` is already `"3"`. If the version is old, it drops the money tables, builds them again, and fills them from the backup. It keeps `decisions` and `meta`. Change `SEED_VERSION` only when the seed itself must be rebuilt.
4. A page reads SQLite while it renders. A form posts to an API route, and that route reads the same SQLite. One connection is stored on `globalThis`.
5. Math lives in `frontend/lib/domain/`. Money text lives in `frontend/lib/format/money.ts`.
6. React draws the page. Client bits update after a click or a slider move.

```
Browser
  │
  ├─ Pages (/, /revenue, /budget, /scenarios, /decisions)
  │     read SQLite while they render
  │
  └─ Forms
        POST or GET /api/...
              │
              ▼
        Next.js routes (Node)
              │
              ▼
        lib/db/*  →  lib/domain/*  →  format/money.ts
              │
              ▼
        frontend/data/nationos.sqlite  ←  frontend/data/cited/ledger.json
```

## Where each number comes from

### The six big cards on Overview

Money is stored in naira. The screen uses `formatNaira`.

| Card | Stored | Shown | Who printed it |
| --- | --- | --- | --- |
| Approved spend | 68.3 trillion | ₦68.3tn | BusinessDay, 31 Mar 2026, [third reading](https://businessday.ng/news/article/national-assembly-passes-n68-3tn-2026-budget-for-third-reading/) |
| Statutory transfers | 4.79 trillion | ₦4.79tn | Same article |
| Recurrent (not debt) | 15.4 trillion | ₦15.4tn | Same article |
| Debt service | 15.8 trillion | ₦15.8tn | Same article |
| Capital | 32.2 trillion | ₦32.2tn | Same article |
| Revenue target | 34.33 trillion | ₦34.33tn | BusinessDay, 3 Dec 2025, [FEC/MTEF](https://businessday.ng/news/article/2026-budget-fg-targets-2-06m-bpd-64-crude-oil-n1512-1-exchange-rate/) |

The first five come from the third reading. The four parts add to ₦68.19tn. The headline is ₦68.3tn. We keep both as printed.

The sixth card is older. It is the December 2025 MTEF revenue target. It is a plan, not money already collected.

Tinubu signed ₦68.32tn on 17 Apr 2026 ([BusinessDay](https://businessday.ng/politics/article/tinubu-signs-%e2%82%a668-32tn-2026-budget/)). That story has no split, so we cite 68.32 in the backup and we use 68.3 as the stored total.

If you pick a state, we multiply the six cards by that state’s share of the 36-state FAAC sum. That is a share of the national figures. It is that state’s FAAC share, applied to the national cards.

### The four small cards

These are stored as text, so we do not reformat them. Each card shows its source.

| Card | Value | Period | Who printed it |
| --- | --- | --- | --- |
| Inflation | 15.06% | Feb 2026 | NBS, 16 Mar 2026, [X post](https://x.com/NBS_Nigeria/status/2033535372580258032) (also [Punch](https://punchng.com/?p=2091219)) |
| GDP growth | 4.07% | Q4 2025 | NBS, 27 Feb 2026, [X post](https://x.com/NBS_Nigeria/status/2027400896384999717) (also [Vanguard](https://www.vanguardngr.com/2026/02/nigerias-gdp-grows-4-07-in-q4-2025-as-services-oil-lift-economy-nbs/)) |
| Exchange rate | ₦1,512/$ | MTEF plan | FEC/MTEF, 3 Dec 2025, [BusinessDay](https://businessday.ng/news/article/2026-budget-fg-targets-2-06m-bpd-64-crude-oil-n1512-1-exchange-rate/) |
| Public debt | ₦159.27tn | 31 Dec 2025 | DMO via [Vanguard, 16 Apr 2026](https://www.vanguardngr.com/2026/04/nigerias-public-debt-up-10-to-n159trn-in-2025-dmo/) |

Inflation is the February headline rate, year on year. GDP growth is real growth in Q4 2025. The same NBS release said full-year 2025 growth was 3.87%; we store 4.07%. The exchange rate is a budget plan, not a market price. Some stories round the debt stock to ₦159.28tn. We keep 159.27, as the 16 April Vanguard story printed it.

These cards have no little bars.

### Budget items on the project table

Same 31 March BusinessDay third-reading story. These are extra lines in the Act. They are not progress reports. Progress is blank.

| Item | Amount |
| --- | --- |
| Unfunded 2025 capital still unpaid | ₦5.71tn |
| Extra priority capital left out of the rollover | ₦2tn |
| MOFI share of the Presidential Legacy light rail (Lagos, Kano, Kaduna, Ogun) plus studies | ₦478.60bn |
| Extra health money (about US$344.83m) | ₦482.76bn |
| Judiciary ceiling put back | ₦268.54bn |
| Court of Appeal | ₦98.50bn |
| Supreme Court | ₦36.7bn |
| Study money for Calabar–Maiduguri and Maiduguri–Sokoto | ₦8.96bn |

### Places

`frontend/lib/db/seed/jurisdictions.ts` lists 36 states and the FCT. Each has an id like `NG-LA` and a zone. Population is empty. The revenue table says “Not loaded”.

### FAAC, January to September 2026

Source: Agora Policy, 21 Oct 2026, [Gross FAAC Allocation to States](https://x.com/AgoraPolicy/status/2112965242862927974), built from FAAC.

Headline to the 36 states: ₦8.43tn. That is up 25% from ₦6.76tn in the same months of 2025. Statutory ₦4.92tn. VAT ₦3.51tn. 4.92 + 3.51 = 8.43. The FCT is missing from this table.

Each state amount is in billion naira, two decimals. We multiply by 1,000 to get million naira. Those 36 amounts add to **8,434,240** million naira (₦8.43424tn). We store that sum. We do not squeeze the rows to 8.43.

| Rank | Id | State | Billion naira | Million naira |
| --- | --- | --- | --- | --- |
| 1 | NG-LA | Lagos | 708.38 | 708,380 |
| 2 | NG-DE | Delta | 649.53 | 649,530 |
| 3 | NG-RI | Rivers | 576.46 | 576,460 |
| 4 | NG-AK | Akwa Ibom | 515.32 | 515,320 |
| 5 | NG-BY | Bayelsa | 501.36 | 501,360 |
| 6 | NG-KN | Kano | 259.78 | 259,780 |
| 7 | NG-OY | Oyo | 248.49 | 248,490 |
| 8 | NG-IM | Imo | 205.35 | 205,350 |
| 9 | NG-KD | Kaduna | 203.60 | 203,600 |
| 10 | NG-ON | Ondo | 199.21 | 199,210 |
| 11 | NG-KT | Katsina | 198.87 | 198,870 |
| 12 | NG-ED | Edo | 198.00 | 198,000 |
| 13 | NG-BO | Borno | 192.80 | 192,800 |
| 14 | NG-BA | Bauchi | 185.07 | 185,070 |
| 15 | NG-JI | Jigawa | 183.94 | 183,940 |
| 16 | NG-NI | Niger | 182.57 | 182,570 |
| 17 | NG-AN | Anambra | 182.57 | 182,570 |
| 18 | NG-BE | Benue | 177.68 | 177,680 |
| 19 | NG-AB | Abia | 176.04 | 176,040 |
| 20 | NG-SO | Sokoto | 174.38 | 174,380 |
| 21 | NG-KO | Kogi | 171.62 | 171,620 |
| 22 | NG-PL | Plateau | 166.39 | 166,390 |
| 23 | NG-AD | Adamawa | 165.75 | 165,750 |
| 24 | NG-KE | Kebbi | 165.62 | 165,620 |
| 25 | NG-ZA | Zamfara | 162.52 | 162,520 |
| 26 | NG-EN | Enugu | 159.98 | 159,980 |
| 27 | NG-OG | Ogun | 159.16 | 159,160 |
| 28 | NG-YO | Yobe | 157.49 | 157,490 |
| 29 | NG-CR | Cross River | 156.49 | 156,490 |
| 30 | NG-GO | Gombe | 154.75 | 154,750 |
| 31 | NG-TA | Taraba | 152.86 | 152,860 |
| 32 | NG-OS | Osun | 151.77 | 151,770 |
| 33 | NG-KW | Kwara | 151.08 | 151,080 |
| 34 | NG-EK | Ekiti | 147.59 | 147,590 |
| 35 | NG-NA | Nasarawa | 146.36 | 146,360 |
| 36 | NG-EB | Ebonyi | 145.41 | 145,410 |

`buildFaac()` throws if a state is missing or if the 36 amounts do not add to 8,434,240. Every state row is marked `published`. The FCT is marked `outside`.

A state’s share is its amount divided by 8,434,240.

The same thread also gave zone shares (South-South 30.8%, South-West 19.1%, North-West 16.0%, North-East 12.0%, North-Central 11.8%, South-East 10.3%), top five ₦2.95tn, and bottom ten ₦1.52tn. We do not store extra zone rows; the 36-state table already has the parts.

January–August 2026 ₦7.41tn is a different stretch of months. We keep it out of this table.

### The three-way split (federal / states / local)

The shares sit in `frontend/lib/domain/formula.ts`. They come from NBS FAAC notes:

- [July 2018 FAAC PDF](https://www.nigerianstat.gov.ng/pdfuploads/Federation_Account_Allocation_Committee_(FAAC)_JULY_2018_Disbursement.pdf)
- [NBS download 1227](https://nigerianstat.gov.ng/download/1227)

Federal 52.68%. States 26.72%. Local 20.60%. Those three add to 100%.

We know the states total: 8,434,240 million naira. The pool is `states / 0.2672`. Federal is `pool * 0.5268`. Local is `pool - federal - states`.

Then we round pool, federal, and states to one decimal (million naira). Local takes the leftover tenth so the three still add up.

We calculated this pool. FAAC did not publish this pool as a total.

Agora’s 19 Oct 2026 thread on money after deductions (FG ₦7.35tn, states ₦7.01tn, LGAs ₦4.92tn, derivation ₦1.53tn, gross ₦31.46tn) is a different cut. We leave it off these cards so two different cuts do not look like one pool.

### Money to states (statutory and VAT)

Same 21 Oct Agora thread. We store the printed amounts, in million naira.

| Line | Trillion naira | Million naira |
| --- | --- | --- |
| Statutory to states | 4.92 | 4,920,000 |
| VAT to states | 3.51 | 3,510,000 |

The revenue page bars these two against their own sum (the ₦8.43tn headline). We do not scale them onto the calculated pool.

### Local spending lines

None. The backup has no LGA spend file. Chat says `No spending records are loaded.` A revenue-drop test with no overhead rows says `No overhead records are loaded, so the cut is ₦0. Capital stays the same.`

### Kaggle

`frontend/data/sources.json` names two Kaggle sets. The app does not use them. There is no `kaggle.json` here, and `data/kaggle/raw` has no CSV. `npm run import:kaggle` exits 0 and leaves the backup as it is.

If a CSV later overwrites the exchange rate, that CSV becomes a new source.

### Saved decisions

The only rows you write are saved investigations. They sit in `decisions`. The server runs the split again on save.

### What we left out

| Thing | Why |
| --- | --- |
| Actual 2026 collections and spend | No run report is in the backup |
| Quarter-by-quarter revenue | Same |
| State populations | No census file was cited |
| A market exchange rate | We only have the MTEF plan of ₦1,512/$ |
| LGA spend lines | No spend file |
| Project percent done | The third-reading story lists budget lines, not work done |
| ₦58.47tn proposal sector lines (security ₦5.41tn, infrastructure ₦3.56tn, education ₦3.52 or ₦3.54tn, health ₦2.48tn) | Those belong to the old proposal, and education is printed two ways |
| Made-up receipt shares (VAT 0.28, CIT 0.22, royalties 0.24, customs 0.18, EMTL 0.08) | Guessed |
| Guessed FAAC for “missing” states | All 36 January–September amounts are published |
| Sparkline bar heights | Decoration |

## SQLite tables

`frontend/lib/db/schema.ts` makes:

| Table | What is in it |
| --- | --- |
| `meta` | `seed_version` (`"3"`) |
| `jurisdictions` | id, name, zone, empty population |
| `faac` | year, place, million naira, `published` |
| `revenue_sources` | year, id, name, printed million naira |
| `snapshots` | year and the six national figures, in naira |
| `indicators` | title, text value, period, empty bars, source |
| `trajectory` | empty |
| `priorities` | empty |
| `projects` | budget items, naira, empty progress |
| `line_items` | empty. Indexed by year, LGA, and sector |
| `decisions` | saved investigations |

## Each page

The look comes from the `ITAI` branch (Tailwind, forest side bar, map). The numbers still come from the cited SQLite ledger and the same API routes.

Six links: Overview, Budget & Revenue, Project Intelligence, Scenario Lab, Decision & Audit Records, Data Sources.

### Overview, `/`

`frontend/app/page.tsx` reads the 2026 snapshot and FAAC table. Missing figures are a 404.

You see six cited cards, a Nigeria map coloured by FAAC amount, a side panel for the selected state, appropriated items, and four indicator cards. Click a state on the map. The FCT is grey because it is missing from the FAAC table.

`GET /api/v1/fiscal/overview` returns the same numbers. The page does not call this route. It reads SQLite itself.

### Revenue, `/revenue`

`readRevenue(2026)` joins FAAC to places, adds the 36 amounts, runs the three-way split, rounds as above, and loads statutory ₦4.92tn and VAT ₦3.51tn.

You see the calculated pool (labelled as calculated), then federal / states / local, then the two printed receipts, then the 36 states sorted by amount. Population says “Not loaded”. Every state is Published.

API amounts are million naira. The page multiplies by 1,000,000 before it formats.

### Project Intelligence, `/budget`

Chat posts `{ query }` to `POST /api/chat`. The form posts `{ question, budget, horizon, strategy }` to `POST /api/v1/budgets/recommend`. Nothing in the form runs until you submit.

Checks:

- `question` is 8 to 500 characters
- `budget` is a whole number of million naira, from 1 to 1000000000 (the default `100000` is ₦100bn)
- `horizon` is a whole number from 1 to 30
- `strategy` is `needs`, `growth`, or `balance`

Start weights, which already add to 100:

| Sector | Needs | Growth | Balance |
| --- | --- | --- | --- |
| Education | 22 | 16 | 18 |
| Health | 28 | 14 | 18 |
| Transport | 16 | 26 | 18 |
| Food | 14 | 10 | 16 |
| Energy | 12 | 24 | 16 |
| Water | 8 | 10 | 14 |

These weights are a rule in code. They are not a published budget. A keyword in the question adds 8 to that sector. Then we split so the six integers add to the budget exactly.

Risk line: `Inflation is 15.06%. Repair costs can rise.` That 15.06% is the stored NBS figure (or the same fallback if the row is gone).

### Scenarios, `/scenarios`

For 2026 the lab uses:

- start revenue = ₦34.33tn (MTEF target)
- capital = ₦32.2tn (third reading)
- overhead = 0
- ministries = 0
- growth = 0.0407 (Q4 2025 real GDP)

A 15% drop with no overhead rows cuts ₦0. Capital stays put.

Each year: start revenue grows by 4.07% from the year before. The stressed path is that amount times `(1 - drop/100)`. Overhead stays 0. Capital stays ₦32.2tn. This is a path from cited starting points. It is not a published forecast.

### Decisions, `/decisions`

Newest first. An empty list says no decision has been saved and links to `/budget`.

### Data Sources, `/sources`

Lists every citation in `frontend/data/cited/ledger.json`: publisher, date, note, and URL. Map outlines are named as GRID3 / geoBoundaries 2022 (CC BY 4.0). They are shapes, not money figures.

## API

Overview money is already a display string. Revenue and recommend money is million naira. Chat and allocate use grouped naira (`₦1,250,000,000`).

`GET /api/v1/fiscal/overview?fiscalYear=2026&jurisdictionId=all`

```json
{
  "fiscalYear": 2026,
  "currency": "NGN",
  "unit": "million",
  "metrics": {
    "approvedExpenditure": "₦68.3tn",
    "statutoryTransfers": "₦4.79tn",
    "recurrentNonDebt": "₦15.4tn",
    "debtService": "₦15.8tn",
    "capitalExpenditure": "₦32.2tn",
    "revenueTarget": "₦34.33tn"
  },
  "indicators": [
    { "title": "Inflation", "value": "15.06%", "period": "Feb 2026", "bars": [], "source": "NBS, 16 Mar 2026" }
  ],
  "revenueTrajectory": { "quarters": [], "collected": [], "target": [] },
  "priorities": [],
  "projects": [
    {
      "id": "NGA-UNF-2025",
      "name": "Outstanding unfunded 2025 capital",
      "agency": "2026 Appropriation (third reading)",
      "approved": "₦5.71tn",
      "progress": null,
      "expected": "2026 appropriation",
      "status": "Appropriated"
    }
  ]
}
```

`GET /api/v1/fiscal/revenue?fiscalYear=2026` returns the calculated pool, the three tiers, the two printed receipts, and the 36 states. The 36 amounts add to 8,434,240.

`POST /api/v1/budgets/recommend` takes `{ question, budget, horizon, strategy }`. The six sector amounts add to `budget`.

`POST /api/chat` with `{ "query": "How much was spent on education in Ikeja?" }` returns:

```json
{ "answer": "No spending records are loaded." }
```

The query must be 3 to 500 characters.

`POST /api/allocate` with `{ "revenue_drop_percentage": 15 }` returns the sentence, `cut` (naira), and `capitalUntouched: true`.

`GET /api/v1/scenarios?revenueDrop=15&horizon=5` returns `growth` 0.0407, capital ₦32.2tn, the empty-overhead sentence, and `years[]`.

Bad input is `{ "error": "..." }` with status 400. A whole year or a place with no rows is 404.

## Exact API sentences

Numbers and names can change. The rest of each line stays the same.

| When | Exact words |
| --- | --- |
| Bad JSON body | `Send a JSON object.` |
| Question length | `Question must be 8 to 500 characters.` |
| Budget | `Budget must be a whole number from 1 to 1000000000. The unit is million naira.` |
| Horizon | `Horizon must be a whole number from 1 to 30.` |
| Strategy | `Strategy must be needs, growth, or balance.` |
| Chat length | `Query must be 3 to 500 characters.` |
| Year | `Year must be a whole number.` |
| Overview miss | `No figures for that query.` |
| Revenue miss | `No revenue for that year.` |
| Drop | `Drop must be a number from 0 to 100.` |
| Empty spend file | `No spending records are loaded.` |
| Two places (if rows exist) | `Name one place: Alimosho or Ikeja.` |
| Missing sector or place (if rows exist) | `Name a sector and a place.` |
| Known pair, no hit (if rows exist) | `No education spending in Ikeja for 2026.` |
| 15% cut, empty overhead | `No overhead records are loaded, so the cut is ₦0. Capital stays the same.` |
| Health and education | `Health and education get more. Roads and power get less.` |
| Underserved | `States with less money need closer checks on spending.` |
| No named sector | `The needs split leaves less for sectors the question did not name.` |
| Risk | `Inflation is 15.06%. Repair costs can rise.` |
| Decision title | `Needs split`, `Growth split`, or `Balance split` |
| Assumption | `The sector amounts add up to the budget.` |
| Assumption | `Inflation comes from the stored figure, not a forecast.` |
| Assumption | `Money already spent on capital projects stays out of this budget.` |

The six stage names are `Read the question`, `Load the baseline`, `Compare sectors`, `Check the limits`, `Split the money`, and `Write the result`.

## How naira is printed

`formatNaira`:

- Divide by 1e12, 1e9, or 1e6 and add `tn`, `bn`, or `m`.
- At 100 or more in that unit, a whole number has no decimals (`₦420bn`). Any other number has one decimal.
- Below 100, two decimals, with a trailing `00` cut to one decimal, so 68.3 trillion stays `₦68.3tn` and 34.33 trillion stays `₦34.33tn`.

Public debt is stored as the text `₦159.27tn`, so the two-decimal print is kept.

`formatGroupedNaira` puts in commas by hand. `millionToNaira` multiplies by 1,000,000.

## Look

The `ITAI` branch UI: forest side bar `#0B3B2C`, paper page, white cards, Tailwind 4. From `lg` up the side bar stays on the left. Below that, a Menu button opens the same links. The map uses GRID3 / geoBoundaries 2022 outlines.

## Hard rules

We do not invent a FAAC amount, a population, a quarter collection, or a percent done.

We do not treat the calculated three-way pool as a FAAC total that FAAC printed.

“Ask the ledger” only filters `line_items`. That table is empty until a cited spend file is added.

A blank year, `1e21`, `1.5`, and any other failed check return 400. A whole year or a place with no rows returns 404. If the inflation row is gone, `recommend()` uses `15.06%`.
