# Contributing to NationOS

Work directly from `frontend/`. All commands and relative paths below assume this directory.

## Core Rules

1. Module Size: Every maintained file must have at most 300 physical lines, enforced by `npm run check:lines`.
2. Architecture Focus: The frontend maintains exactly five primary navigation pages: Overview (`/`), Revenue (`/revenue`), Budget Planner (`/budget`), Scenario Lab (`/scenarios`), and Decision Records (`/decisions`).
3. Mathematical Determinism: Never approximate numerical totals with generative LLM text. Financial sums must compute deterministically via domain calculation engines.
4. Editorial Standards: Do not use em dashes in user-facing copy or documentation. Use hyphens, colons, or parentheses.

## Verification Suite

Before submitting any code changes, execute the verification suite:

```bash
npm run format:check   # Checks Prettier formatting
npm run check:lines    # Verifies all files stay within 300 physical lines
npm run lint           # Verifies ESLint compliance
npm run check          # Runs full domain invariant test suite
npm run test:ui        # Runs JSDOM component test suite
npm run build          # Compiles production Next.js build
npm run check:http     # Verifies live HTTP route status (requires running server)
```

## Adding or Modifying Features

1. Compose UI features using modular components in `components/<feature>/`.
2. Centralize external communication in `lib/api/client.mjs` with mock fallbacks in `lib/api/fiscal-adapter.mjs`.
3. Keep pure numerical functions in `lib/domain/`.
4. Ensure all newly added routes are documented in `README.md` and registered in `tests/http.mjs`.
