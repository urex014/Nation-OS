# Contributing

Use branch ITAI for changes in this workspace. Do not push unless requested.

1. Work inside frontend/ and use the installed Next/React/Tailwind versions.
2. Read AGENTS.md and the local installed Next documentation before changing framework conventions.
3. Keep maintained source/docs at most 300 lines per file, with readable formatting.
4. Explain data units and non-obvious logic in comments.
5. Keep database access out of client components.
6. Validate API inputs before calling models or SQLite.
7. Preserve missing observations, reporting periods, provenance and existing decision snapshots.
8. Run check, lint, format:check and build.
9. Run check:http with the app running when changing routes.

Do not add fictional observations to fill source gaps. Additional public datasets need a publisher URL, terms, reporting period, reproducible parser and validation. New predictions need an explainable model and calibration evidence.

Source snapshots and model versions are part of persisted records. Do not change what an already-saved result means by recalculating it on read. Use a new run and decision when assumptions change.

Local .recovery/ files exist only to recover the pre-rebuild source. They must never be imported, served or committed.
