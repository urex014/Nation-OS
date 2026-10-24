# NationOS design and engineering principles

Use this page when adding a screen or an API. The visual system is the one already rendered on `main` and carried by the `ITAI` workspace: forest `#0B3B2C`, emerald `#10754A`, paper `#F8FAF9` / `#f4f3ee`, ink `#18352e`, and white cards. The logo is the mark in `public/logo-mark.svg` (two bars and an emerald chevron). Use `public/logo-full-dark.png` on the forest bar and `public/logo-full.png` on paper. Do not introduce a second palette, font, or component kit.

`main` has no accounts and no roles. The two roles below were added for this hackathon. Where `main` and `ITAI` describe the same fiscal endpoint, follow `main`.

## Visual

- One idea above the fold. The landing page has a single sentence as the value proposition, one primary action (sign in), and a secondary text link.
- Hierarchy comes from size, weight, and space, not from extra colours. Eyebrows are 12px, uppercase, tracked. The title uses the serif already in the theme. Body copy is 16px with relaxed line height.
- Space on an 8px scale: 16, 24, 32, 48, 64, 96. Sections breathe. Cards use the existing `rounded-xl` white surface and stone border.
- Colour contrast meets WCAG AA. Body text is ink or stone-700 on paper. White text sits on `#0B3B2C`. The emerald “OS” highlight is the light emerald only on that forest ground; on paper it switches to emerald-800. Do not convey state by colour alone.
- Mobile first. Sections stack, actions are full width until `sm`, and targets are at least 44px tall. The workspace sidebar collapses behind Menu below `lg`, as it already does.
- Keyboard and screen readers: one `h1` per page, a skip link, real labels, `aria-pressed` on the auth switch, `aria-current` on the active nav item, and `role="alert"` on form errors. Focus uses the existing outline.
- No motion that is required to understand the page. No remote fonts or hero images, so the first paint stays small.
- Tone is civic and calm. Name the publisher and the year. Say when a figure is not Lagos spending. Do not invent a number, a person, or an official seal.

## Engineering

- The UI and the HTTP API are one Next.js app. New backend behaviour goes in `app/api`, not a second server.
- Validate input with zod. Return `{ "error": "..." }` and, for forms, `fieldErrors`. Unexpected failures stay generic.
- Passwords are hashed with bcrypt before they are stored. Compare them on the server. Never return a hash.
- The session is an HMAC-signed token in an `httpOnly`, `SameSite=Lax` cookie. It carries the user id, email, role, name, agency, issued-at time, and a 12-hour expiry. Checking the signature is the whole check. Do not look up a session row. Signing out clears the cookie. A copied cookie stays valid until it expires.
- Authorisation is decided on the server. `proxy.ts` sends anonymous visitors to `/sign-in`, and a role that asks for another desk to `/forbidden`. Desk pages check the role again.
- Share user, role, and path types from `lib/auth/types.ts`. Client components may import that module. They must not import the database.
- Secrets live in the environment. `.env.example` lists the names. Production refuses to sign sessions without `NATIONOS_SESSION_SECRET` of at least 32 characters. Do not commit a real secret.
- Demo accounts are constants in `lib/auth/demo-users.ts`, with bcrypt cost 10, so sign-in does not write a file. New password hashes use cost 12. New citizens, plan runs, decisions, and audit rows go to Postgres (`DATABASE_URL` or `POSTGRES_URL`; `db/schema.sql`, created on first use). Without that URL, those writes return 503. Nothing is saved on the computer or in the function's memory. The cookie stays the same.
- The `main` contract is preserved at `GET /api/v1/fiscal/overview`, `GET /api/v1/fiscal/revenue`, `POST /api/v1/budgets/recommend`, `GET|POST /api/v1/decisions`, `GET /api/v1/scenarios`, `POST /api/allocate`, and `POST /api/chat` with `{ "query" }`. The existing workspace still posts `{ "message" }` to `/api/chat`. Keep both shapes.

## Roles

| Role         | Lands on    | Who                                | Registration                                     |
| ------------ | ----------- | ---------------------------------- | ------------------------------------------------ |
| `government` | `/overview` | Lagos budget and finance officials | Seeded only. Sign-up must never grant this role. |
| `citizen`    | `/overview` | Members of the public              | Seeded, and the only role sign-up can create.    |

Both roles may read `/overview`, `/revenue`, `/decisions`, and `/sources`. Only `government` may open `/budget` and `/scenarios`, or post a plan, allocation, scenario, or decision. The tax slider lives on `/budget`. It simulates from published Lagos IGR, labels the result a projection, and cites the source. It does not invent a tax rate or a Lagos appropriation. Citizens do not see that slider. `/dashboard/government` and `/dashboard/citizen` redirect to `/overview`.

## Advice and deploy

- Nation AI uses the Vercel AI SDK. When `XAI_API_KEY` is set, the model is the direct xAI id `grok-4.20-non-reasoning` (`XAI_MODEL` overrides it). With no direct key, the gateway model is `spacexai/grok-4.20-non-reasoning` (`AI_MODEL` overrides that id). The catalog does not list `xai/grok-4-fast`. The panel is in memory only. Citizens get the same UI with read-only tools.
- The gateway is used only when `XAI_API_KEY` is unset. On that path Vercel signs in with the `x-vercel-oidc-token` request header when Project Settings → Security → OIDC is on. That header is not an environment variable you add. Locally use `AI_GATEWAY_API_KEY`, or `vercel env pull`.
- The model may state a number only after a tool read it from the repository. After the reply, any number that is not in those tool results is removed. A `{ "query" }` body stays on the ledger path and never calls the model.
- The role comes from the session. A government seat may run the simulation tool. A citizen seat, and a visitor with no session, get read-only tools. If no key is set, or the model call fails, the existing rule-based answer is used and the screen says so.
- On Vercel the published figures stay in the read-only SQLite file built during deploy. Sessions stay in the signed cookie. Accounts, plans, decisions, and the audit trail go to Postgres. With no database URL, those writes return 503. Demo sign-in still works. The AI Gateway call forwards the request's `x-vercel-oidc-token` and stops after `AI_TIMEOUT_MS` (12 seconds unless you set it).
