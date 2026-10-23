# Data, units and modelling

Everything describes fictional Aderin, not surveyed Nigerian data or validated forecasts.

## Seed sources

| Definition                     | Maintained source              | Derived data                      |
| ------------------------------ | ------------------------------ | --------------------------------- |
| Six zones                      | data/country/zones.json        | Loaded directly                   |
| State hierarchy and population | data/country/states/           | Joined by lib/country-data.mjs    |
| Sector baselines               | data/country/sectors/          | Joined in stable state order      |
| Citizen ranges/probabilities   | data/citizens/                 | Joined by data/citizen-states.cjs |
| Economy                        | lib/domain/economy-engine.cjs  | Calculated assumptions            |
| Firms and banks                | lib/domain/commerce-engine.cjs | Generated records                 |

JSON shards are now canonical maintained inputs. There is no build-time VM or source generation step. When changing state populations or sector baselines, update the citizen shards consistently and run all invariants before using the data.

## Population and geography

Six zone totals sum to 24.6 million. Unequal settlement weights and largest-remainder allocation preserve exact integer zone totals.

There are 36 states and one capital territory. Stable IDs identify records; names are presentation labels.

The map clips illustrative Voronoi-style cells to an invented outline. State areas do not encode population.

## Citizen engine

prepare assigns offsets/counts. citizen validates a zero-based national index, resolves its state range and generates a record.

Index zero becomes AD-C-00000001. Generator and population-allocation versions identify the rules.

Attributes include age, name, state, settlement, household, income, education, employment, religion, language, accessibility, housing and service access.

Up to four consecutive records share a household group and household-level attributes. This is not a calibrated family or age-cohort structure.

The index-mixing function is reproducible, not cryptographic randomness. Names can repeat; IDs cannot.

Changing population allocation can move IDs between state ranges. Preserve version metadata and old exports.

Religion is inspectable fictional data. It does not determine scores, policy ranking or benefit allocation.

## Monthly experiments

The default dataset contains 37 jurisdictions times 24 months: 888 rows.

CSV columns are stateId,month,basket,freight,rainfall. Plain unquoted fields are supported; the size limit is 1 MB. Basket price is Aderin naira, freight is an index and rainfall is millimetres.

Imports validate the header, known IDs, numeric values and unique state/month pairs. The forecast requires at least nine consecutive monthly records for the selected state. Imports stay in page memory and disappear when leaving the page.

The OLS trend uses month index as its only predictor. It evaluates the last three observations as a holdout, then refits on all observations.

Rainfall and freight are inspectable columns, not additional regression predictors.

Fuel sensitivity multiplies the trend by (1 + fuelShock / 100 x 0.25). The 0.25 coefficient is an illustrative assumption, not an estimated causal effect. Future basket prices are floored at zero.

## Unified sector workflow

Food and the other five sectors now create inputs for the same five-/ten-year service model. Separate legacy short-horizon calculations are no longer used by the UI. Previously saved short-horizon records remain available for export in Decision memory.

Population in scope is not the number guaranteed to benefit. Rates and journey times do not establish service quality.

## Long-term input

```json
{
  "years": 5,
  "scope": "all",
  "growth": 2,
  "delivery": 80,
  "maintenance": 20,
  "budgets": {
    "food": 120,
    "education": 160,
    "transport": 180,
    "health": 160,
    "energy": 140,
    "water": 140
  }
}
```

Amounts are millions of **real 2026 currency per year**, not total programme costs.

Each year calculates population growth, baseline drift, investment per projected resident, delivery-scaled gain, remaining capacity and retention of past improvement.

The no-additional-investment path stays separate from the proposed path.

Sensitivity paths vary delivery by 20 percentage points within 0-100. They are not confidence intervals.

State-scoped investment affects only that jurisdiction. Country-wide summaries still include other states.

Migration, age transitions, causal sector spillovers, GDP returns and new jobs are not simulated.

## Economy and fiscal projection

The baseline specifies GDP, annual revenue/spending, debt, trade, resource receipts and an existing investment envelope.

State output uses assumed productivity/population weights within fixed zone shares. Revenue, spending and debt have separate weights; state plus federal totals reconcile nationally.

The long-term fiscal model uses the consolidated national budget, even for a state-scoped service proposal.

The planning envelope is already included in baseline spending. Only costs above it add borrowing.

Annual deficits accumulate into debt. GDP/revenue growth and financing charges are assumptions, not estimated intervention returns.

Future values use real 2026 currency. The displayed inflation assumption is not added to constant-price paths.

## Firms and banks

The register contains 24,600 deterministic firms. It excludes informal businesses and is not the entire labour market.

Domestic control means above 50% domestic ownership; foreign control means below 50%; exactly 50% is joint.

Operating location, incorporation, ultimate ownership and market reach are separate attributes.

Turnover is revenue before costs, not GDP, profit or a monetary stock.

Eight depository banks have synthetic branch networks and balanced accounts. The monetary authority is described separately.

## National monetary stocks

| Measure           | Identity                           | A₦ millions |
| ----------------- | ---------------------------------- | ----------- |
| Currency issued   | Public cash + vault cash           | 60,000      |
| Public cash       | Currency outside banks             | 48,000      |
| Vault cash        | Banks' currency holdings           | 12,000      |
| Included deposits | Overnight + eligible short-term    | 280,000     |
| Narrow money      | Public cash + overnight deposits   | 228,000     |
| Extended money    | Narrow money + short-term deposits | 328,000     |
| Monetary base     | Issued currency + reserve balances | 84,000      |

These overlap. Do not add them together or add GDP/budgets to produce total national money.

There are no state money-supply estimates, bank-stress dynamics or money-creation model.

## Comparison scores

The displayed overall score gives six service indicators equal weight. The engine supports custom weights, while the current UI uses the documented equal weights and allows selection of an individual ranking metric.

Higher-is-better: min(100, baseline / target x 100).

Lower-is-better: min(100, target / baseline x 100); zero scores 100.

Ties share ranks. GDP, religion and raw population do not contribute. The population-weighted mean is a separate descriptive statistic.

Improvement priorities use weighted target shortfalls. Stronger same-zone peers with comparable population are preferred when available.

A peer is a benchmark, not evidence that its policies will transfer successfully.

## Evidence integrity

Preserve engine/dataset versions, input config, results, source context and human reasoning with saved proposals.

The analyst uses canonical records; imported CSV experiments do not replace them.

Provider source checks establish that a record was supplied, not that a claim is true.

Synthetic holdout accuracy is not real-world validation. Measured outcomes must remain separate from projections.
