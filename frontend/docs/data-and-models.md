# Data, Units and Modelling Principles

This document explains the data structures, financial conventions, and modelling assumptions underpinning NationOS.

## Demonstration Environment Notice

All current data reflects the fictional Republic of Aderin baseline (24.6 million synthetic population across 36 states and 1 capital territory). This environment serves as a demonstration and testing harness while establishing typed contracts for production deployment with real Nigerian fiscal data.

## Financial Representation and Currency

- Demonstration Currency: Aderin Naira (`A₦` / `AND`), denominated in millions (`A₦M`).
- Production Currency Target: Nigerian Naira (`₦` / `NGN`), denominated in millions or billions.
- Mathematical Precision: Authoritative monetary records use decimal strings or integer minor units to eliminate floating-point rounding errors.

## Fiscal Concepts: Statutory Sharing vs. Expenditure Planning

NationOS makes a fundamental institutional distinction between two stages of public finance:

1. Statutory Revenue Sharing (`/revenue`):
   - Federally collected revenues (VAT, CIT, Customs, Royalties) form the distributable federation pool.
   - Vertical allocation distributes funds between Federal, State, and Local Government tiers according to statutory percentages.
   - Horizontal sharing formulas apportion the subnational allocation among states based on statutory weights (Equality, Population, Landmass, Internal Revenue Generation, Social Development).
   - AI cannot alter statutory allocation rules; simulations are strictly labeled as hypothetical scenarios.

2. Discretionary Budget Planning (`/budget`):
   - Government analysts configure total available budget envelopes across essential developmental pillars: Education, Healthcare, Transport, Food, Energy, and Water.
   - Sector ceilings and minimum commitments are adjusted interactively.
   - Multi-year projections evaluate fiscal impacts, recurrent maintenance burdens, and delivery constraints.

## Deterministic Modelling vs. LLM Generation

- Zero Numerical Hallucination: The LLM acts solely as a natural-language interpreter and qualitative summarizer.
- Programmatic Execution: All budget sums, variance checks, deficit trajectories, and sensitivity cases are computed deterministically by verified calculation engines (`planning-engine.cjs`, `economy-engine.cjs`).

## Macroeconomic Sensitivity and Shocks

The Scenario Lab (`/scenarios`) evaluates capital proposals under four standardized macroeconomic stress shocks:

- Revenue Contraction: Simulates a 15% drop in federation receipts.
- Inflation Shock: Simulates a 4 percentage point increase in capital procurement costs.
- Procurement Slippage: Simulates a 20 percentage point drop in implementation efficiency.
- Maintenance Burden: Evaluates asset depreciation under zero recurrent maintenance outlays.
