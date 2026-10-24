# Project Intelligence conversation

Project Intelligence (`/budget`) is a conversational entry point to the imported Nigerian data. It preserves the green/white workspace styling and keeps the existing investment planner under an expandable decision builder.

## What it answers

- National indicators: population, GDP, growth, inflation, unemployment, electricity, education, water, mortality, health expenditure and resource rents.
- State/FCT revenue: individual observations, highest/lowest nominal collections, comparisons and historical trends over 2019–2025.
- The imported 2025 approved federal budget headline.
- Conditional five/ten-year modelling using the current investment draft, with formulas and assumptions available for inspection.

Example: “Compare Lagos and Rivers revenue”, then “What about Kano?” or “And in 2020?”. Naming Nigeria explicitly resets geography to national scope. New standalone questions reset reporting-year context; follow-ups preserve it.

Questions such as “How would the next 5 years look like?” also run the current investment draft. Five/ten in words are supported. The answer is explicitly conditional on the form's budget and assumptions, not a general prediction of Nigeria's future.

Suggested questions provide reliable starting points. Unsupported questions return a capability explanation or data gap, rather than an invented answer.

## How responses work

With no AI credentials, the answer is **local and rule-based**. Topic aliases and state names select repository queries. JavaScript formats the observations. No user-generated SQL is run.

When `XAI_API_KEY` is set, the same route calls api.x.ai directly with `@ai-sdk/xai`. The direct model id is `grok-4.20-non-reasoning` unless `XAI_MODEL` is set. The body may be `{ "message" }` or `{ "question" }`. The AI Gateway is used only when `XAI_API_KEY` is absent: `AI_GATEWAY_API_KEY` is set, or the app is running on Vercel. The gateway model is `spacexai/grok-4.20-non-reasoning` (fast, tool-calling). `AI_MODEL` overrides that gateway id. The live catalog has no `xai/grok-4-fast`. On that path the gateway uses the `x-vercel-oidc-token` request header, which is present when Project Settings → Security → OIDC is enabled. That token is not a project environment variable. Locally, use the gateway key or `vercel env pull`.

The model must call a tool. Tools read national indicators, one state's revenue, a two-state comparison, the federal headline, and the cited ledger (`getBudget`, `getFaac`, `getFiscalSnapshot`: 2026 signed and third-reading budgets, FAAC, debt, inflation, GDP and project lines). A government session may also calculate, allocate, check one project amount, or run a tax or plan projection. A citizen session, or no session, does not receive the government tools. The role comes from the session cookie, not the body. The Nation AI panel sends the last 10 turns, with tool formulas shortened, plus the budget page settings. An untouched planner default is not treated as the person's budget.

After the reply, a number is kept only when the same amount is in a tool result or in the person's own words. `54.99bn` does not match `54.99tn`. A year is kept only when that year appears as a year, or the person typed it. Numbers written as words are read too. The phrase `A figure was removed because it was not in the tool results` still marks a removal. The badge reads `AI · numbers checked`, `AI · a number was removed`, `From the data · AI isn't set up`, or `From the data · AI hit an error`. The JSON field is `aiStatus`: `ok`, `not_configured`, or `error`. If the model call fails, the rule-based answer is returned. The server log records a short reason with tokens and keys removed. It does not include the question.

`{ "query" }` still returns `{ "answer" }` from the ledger and never calls the model. `stream: true` on a `{ "message" }` request returns the already-checked text as `text/plain`, with `X-NationOS-Mode`. Message chat is limited to 30 requests per 15 minutes in this process.

Files:

| File                                     | Responsibility                                                            |
| ---------------------------------------- | ------------------------------------------------------------------------- |
| components/nigeria/intelligence-chat.jsx | Transcript, composer, suggested questions, sources and expandable planner |
| lib/nigeria/chat-topics.mjs              | Supported topic aliases and example prompts                               |
| lib/nigeria/chat.mjs                     | Rule-based retrieval, context, and response assembly                      |
| lib/ai/                                  | Gateway model, tools, number check, and fallback                          |
| app/api/chat/route.js                    | `{ "message" }` and `{ "query" }` boundary                                |
| tests/chat.mjs, tests/ai.mjs             | Retrieval, mocked tool calls, and the number check                        |

The rule-based chat cannot cover every phrasing. The AI path covers more wording, but it still may only repeat numbers the tools returned. The screen badge names which path answered.

## API contract

POST `/api/chat`, application/json, same write-origin/16 KB limits as other routes:

```json
{
  "message": "Compare Lagos and Rivers revenue",
  "context": null
}
```

Optional `context` contains only `scope` (known ISO ID or all), `year` (integer or null) and `topic` (known indicator code, revenue, plan or null). Return the previous response's context for follow-ups. The server validates it; it does not trust a transcript's assertions as evidence.

Optional `config` is the existing complete planning DTO. It is used only when asking to model/simulate/calculate a plan, draft, budget or investment. All model inputs pass the existing planning validator. “5” or “10” in that request selects the horizon. An explicit state name selects geography; other budget changes must be made in the visible form rather than inferred from ambiguous text.

Responses:

```text
{
  mode: "local-data" | "ai" | "ai-checked",
  paragraphs: string[],
  context: {scope, year, topic} | null,
  sources: sourceMetadata[],
  table?: {columns: string[], rows: string[][]},
  result?: validatedPlanResult
}
```

`local-data` is the rule-based engine. `ai` means every number in the reply was in a tool result. `ai-checked` means at least one unsupported number was removed.

Errors use `{error: string}`, HTTP 400 for invalid questions/context/configuration, plus shared HTTP origin/size/content-type errors. Messages must contain 1–2,000 characters.

Chat does not create a saved decision by itself. The conversation stays in React memory and clears when you leave the page or start a new one. To keep a reason, save it from the decision builder. Those records go to Postgres.

## Evidence safeguards

National metrics are never assigned to individual states. Missing years remain missing. State revenue excludes federal transfers, and federal appropriation is not actual spending. Ranking collections cannot establish governance quality or causal explanations.

Requests for unsupported citizen, banking, business, transport or food-price datasets explicitly report the gap. Suggestions about investigating compliance, tax bases or outcomes are labelled investigation steps, not proven policy recommendations. Model answers retain the existing limitations on predicting GDP, jobs or service outcomes.

Source links go to the application's source register, which preserves publisher URLs, periods, terms and checksums. Text is rendered as React text rather than raw HTML.
