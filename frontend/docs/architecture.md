# Architecture and developer walkthrough

## Runtime

This is one Next.js App Router application. React renders the interface; Tailwind supplies styling. Next route handlers are the backend, and Node 24's synchronous SQLite library stores observations and decisions.

There is no second server to launch. The optional Python script only converts an NBS Excel workbook into portable normalized files. It never handles HTTP traffic.

## Read path

1. A server page calls a repository function in `lib/nigeria/repository.mjs`.
2. The repository requests a cached SQLite connection.
3. On first access, `database.mjs` creates the directory, applies `schema.sql`, enables foreign keys/WAL and imports observations if the source register is empty.
4. SQL selects the requested data and preserves units, missing values and reporting years.
5. The server passes serializable objects to a page component.
6. Interactive filters request JSON from the matching API route.

The overview is dynamic, so its values come from SQLite at request time rather than an old build-time snapshot. Client components never import database modules. Source metadata is also read from SQLite.

## Write path

1. A form sends JSON through `lib/nigeria/client.mjs`.
2. `http.mjs` checks content type, origin and the streamed 16 KB size limit.
3. Planning validation checks the horizon, numerical bounds, scope and exact allocation sum.
4. The pure planning model calculates a result using the database's observed IGR context.
5. The server stores a run, or atomically creates a run, decision and audit event.
6. A response updates the form; errors are displayed alongside it.

Client-supplied calculated outputs are ignored. Creating a decision recomputes its authoritative result on the server.

## Modules

| File              | Responsibility                                                       |
| ----------------- | -------------------------------------------------------------------- |
| `database.mjs`    | Connection caching, SQLite configuration and lazy initialization     |
| `schema.sql`      | Tables, checks, foreign keys and indexes                             |
| `import-data.mjs` | Transactional non-destructive source import                          |
| `repository.mjs`  | Read queries, geography validation, observation transformations      |
| `geography.mjs`   | Real GeoJSON rings to SVG paths                                      |
| `constants.mjs`   | Units, explanations, sectors, preference weights and review statuses |
| `planning.mjs`    | Input validation, exact allocation and transparent projections       |
| `scenarios.mjs`   | Four one-variable sensitivity cases                                  |
| `decisions.mjs`   | Immutable run snapshots, decision storage and revision-safe reviews  |
| `http.mjs`        | Shared native Request/Response boundary                              |
| `client.mjs`      | Browser fetch/error/timeout handling                                 |
| `format.mjs`      | Display formatting; never database arithmetic                        |

## React boundaries

`WorkspaceShell` supplies navigation and responsive framing. `DraftProvider` retains only the unsaved planner configuration in React memory.

The overview owns selected-map-state interaction. Revenue owns comparison inputs and results. Planner owns editable assumptions and server-run results. Scenario Lab uses the shared draft but stores its own comparison response. Decision Records retrieves and reviews persisted snapshots.

`PlanResult` is shared between calculated runs, scenarios and saved decisions so they expose the same formulas and limitations. UI helpers keep repeated card, form and source-link styling consistent.

A page reload clears an unsaved draft. Calculated runs and saved decisions survive reloads. Navigating away from an unsaved result does not create a decision automatically.

## Database lifecycle

Each Node worker has a connection cache keyed by the resolved database path. WAL permits reads while short transactions write; a five-second busy timeout reduces transient lock failures. Transactions keep decision creation and audit events together.

SQLite supports a single local workspace here. Synchronous queries are intentionally small (259 revenue rows), but this design is unsuitable for large concurrent analytics or person-level datasets. Use a network database and access-control layer for multi-user deployment.

`CREATE TABLE IF NOT EXISTS` supports fresh installs; it is not an automatic migration system for arbitrary schema changes. Add explicit numbered migrations and backups before altering a deployed schema.

## Rebuild boundaries

Only Nigeria modules are active. The separate Python backend, fabricated country data and Supabase integration have been removed. Local recovery data is ignored, not loaded by the app or checked into the frontend data pipeline.

The rebuild deliberately does not manufacture causal intervention effects. Add a domain model only after defining its inputs, calibration evidence, validation procedure and output limitations.
