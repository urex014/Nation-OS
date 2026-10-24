# NationOS

The Nigeria workspace, Next.js API routes, SQLite data, landing page, and role sign-in are in [frontend/](frontend/README.md).

Use Node.js 24, then run `npm ci`, `npm run db:init` and `npm run dev` inside frontend/. Open http://127.0.0.1:4173. The landing page leads to one sign-in page. Each demonstration role opens its own desk.

| Role                | Email                      | Password                |
| ------------------- | -------------------------- | ----------------------- |
| Government official | `government@nationos.demo` | `Government-Demo-2026!` |
| Citizen             | `citizen@nationos.demo`    | `Citizen-Demo-2026!`    |

A plain walkthrough is in [HOW_IT_WORKS.md](HOW_IT_WORKS.md). Design and engineering rules are in [DESIGN_PRINCIPLES.md](DESIGN_PRINCIPLES.md). The fiscal API shape follows `main` (`/api/v1/...`, `/api/allocate`, and `/api/chat` with `{ "query" }`). The workspace UI on this branch follows `ITAI`.

To deploy, set the Vercel root directory to `frontend`. Steps, the session secret, and the Grok gateway settings are in the [frontend README](frontend/README.md#deploy-to-vercel). On Vercel the AI Gateway signs in with the platform OIDC token. No AI key is required in production.

See [backend contracts](frontend/docs/backend-integration.md) and [data sources/model definitions](frontend/docs/data-and-models.md). No separate backend server or Supabase account is required.
