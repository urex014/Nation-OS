# Data sources, units and model definitions

## Public observations

| Dataset               | Publisher and source                                                                                                           | Period                      | Imported coverage                         |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------ | --------------------------- | ----------------------------------------- |
| State IGR             | [NBS workbook catalog](https://microdata.nigerianstat.gov.ng/index.php/catalog/170/related-materials)                          | 2019–2025                   | 37 jurisdictions × 7 years                |
| National indicators   | [World Bank Nigeria](https://data.worldbank.org/country/nigeria)                                                               | 2015–2025                   | 11 indicators × 11 years, including nulls |
| State boundaries      | [geoBoundaries ADM1](https://www.geoboundaries.org/api/current/gbOpen/NGA/ADM1/)                                               | 2022 represented boundaries | 36 states and FCT                         |
| Federal appropriation | [State House budget signing remarks](https://statehouse.gov.ng/remarks-by-president-tinubu-at-the-signing-of-the-2025-budget/) | 2025                        | Approved headline: ₦54.99tn               |

Raw source artifacts are preserved in `data/nigeria/raw/`. Their SHA-256 digests, publisher URLs, retrieval/processing time and terms are recorded in `normalized/sources.json`. The World Bank import records the API's update date in the source note.

The normalizer currently records the processing timestamp as `retrievedAt`; it is not a signed proof of the download time. Raw source bytes and checksums allow independent comparison.

NBS factual values are attributed to NBS; the repository does not claim a new open licence over the publisher's workbook. GeoBoundaries/GRID3 attribution and CC BY 4.0 terms remain visible. Consult original publisher terms before redistributing original artifacts.

## State revenue

The NBS ZIP contains `IGR_DATA_2019_2025.xlsx`. Python's standard-library ZIP/XML parser reads cached Excel cell values without running spreadsheet macros or formulas.

- The 2019–2021 sheet contains tax, other revenue and total columns for each year.
- Later sheets contain PAYE, direct assessment, road taxes, stamp duties, capital gains, withholding, other taxes, LGA revenue, total tax, MDA revenue and total IGR.
- Blank/dash cells become null, never invented zeros.
- Decimal naira amounts convert to integer kobo with half-up rounding.
- Every normalized observation retains its source name, jurisdiction ISO ID and source ID.
- Name matching explicitly normalizes NASSARAWA to Nasarawa and FCT aliases to NG-FC.
- Duplicate state/year rows and incomplete jurisdiction/year coverage fail normalization.

Imported totals reconcile tax plus other revenue exactly at kobo precision for this snapshot. `reconciliationKobo` exposes any future difference; it should be reviewed rather than silently overwritten.

IGR excludes federal transfers. It is neither total state income nor government spending. Rank and combined-share values are derived from the selected year's nominal IGR, not population-adjusted performance scores.

The app does not infer why one state collects more. Economies, tax bases, administration, population, inflation and reporting differences may matter; additional data is needed to assess them.

## National indicator dictionary

| Code              | Meaning                       | Unit                    |
| ----------------- | ----------------------------- | ----------------------- |
| SP.POP.TOTL       | Population estimate           | People                  |
| NY.GDP.MKTP.CD    | GDP at current prices         | Current US dollars      |
| NY.GDP.MKTP.KD.ZG | Annual real GDP growth        | Percent                 |
| FP.CPI.TOTL.ZG    | Annual consumer inflation     | Percent                 |
| SL.UEM.TOTL.ZS    | Modelled ILO unemployment     | Percent of labour force |
| EG.ELC.ACCS.ZS    | Electricity access            | Percent of population   |
| SE.PRM.ENRR       | Primary gross enrolment       | Gross percent           |
| SH.H2O.BASW.ZS    | At least basic drinking water | Percent of population   |
| SH.DYN.MORT       | Under-five mortality          | Per 1,000 live births   |
| SH.XPD.CHEX.GD.ZS | Current health expenditure    | Percent of GDP          |
| NY.GDP.TOTL.RT.ZS | Natural-resource rents        | Percent of GDP          |

The overview selects the latest non-null year independently for each code. APIs expose the available non-null series plus the latest value. SQLite preserves all 121 input rows, including nulls.

Gross enrolment can exceed 100% and is not school attendance. Electricity access is not reliability. Resource rents are not reserves, mineral deposits or government receipts. GDP is economic output, not government cash. The modelled ILO unemployment series may differ from NBS series because of definitions.

National figures are never allocated equally across states. Current comparable state population/GDP are absent.

## Geography

The 37 actual simplified ADM1 geometries are stored in SQLite. SVG uses an equirectangular display transformation, not a legal/survey map projection. The darker map shading groups states by nominal IGR rank. It does not represent population, territorial importance or governance quality.

## Planning arithmetic

Model version: `ng-budget-arithmetic-v1`.

Inputs are the first-year annual investment envelope B, horizon 5/10, start year, sector allocations, annual budget growth g, annual inflation p, assumed IGR growth r, maintenance share m and delivery share d. Percentage inputs become fractions in formulas.

For index t = 0 through horizon − 1:

```text
nominal budget(t) = round(B × (1 + g)^t)
price index(t) = (1 + p)^t
constant-price budget(t) = round(nominal budget(t) / price index(t))
maintenance(t) = round(nominal budget(t) × m)
delivery-adjusted capital(t) = round((nominal budget(t) − maintenance(t)) × d)
constant-price capital(t) = round(delivery-adjusted capital(t) / price index(t))
projected IGR(year) = round(observed IGR × (1 + r)^(year − observation year))
investment / IGR = nominal budget / projected IGR × 100
```

Rounding is to whole naira. Constant prices use the first planning year as the price base. IGR growth compounds from the observation year, which can precede the start year. A ratio over 100% flags a funding question; it is not a calculated deficit.

First-year sector allocations must sum exactly to B. Later sector proportions are held constant as the total changes. Equal, social-services and infrastructure preference presets use declared weights and largest-remainder rounding. These are user-selected priorities, not estimated policy effectiveness.

Default numbers are editable illustrative assumptions. They are not fitted to the historical indicators. Past inflation is shown in the overview; future inflation must be explicitly chosen by the planner.

## Sensitivity cases

The Scenario Lab varies one assumption at a time:

1. Inputs as entered.
2. Delivery minus 20 percentage points, floored at zero.
3. Inflation plus 5 points, capped at 100%.
4. Budget growth plus 5 points, capped at 25%.

All retain the same initial allocation. At a bound, a case can match the original assumption. Cases are not confidence intervals and have no assigned probabilities.

## What outputs cannot establish

The model does not calculate jobs, GDP effects, attendance, disease reduction, journey-time improvement, household benefits or construction completion. Delivery-adjusted capital is a monetary proxy. Allocation weights cannot demonstrate that a state or policy is “best”.

A defensible sector outcome model requires observed costs, intervention definitions, causal/calibration evidence, implementation constraints and validation against outcomes. Until then the app exposes the evidence gap and an explicit review roadmap.
