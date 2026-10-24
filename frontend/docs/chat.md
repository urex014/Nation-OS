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

This implementation is **local and rule-based**, not a connected language model. It needs neither a key nor Ollama. Topic aliases and state names select repository queries; JavaScript formats the returned observations and computes explicit comparisons. No user-generated SQL is run.

Files:

| File                                     | Responsibility                                                            |
| ---------------------------------------- | ------------------------------------------------------------------------- |
| components/nigeria/intelligence-chat.jsx | Transcript, composer, suggested questions, sources and expandable planner |
| lib/nigeria/chat-topics.mjs              | Supported topic aliases and example prompts                               |
| lib/nigeria/chat.mjs                     | Validation, retrieval, context resolution and response assembly           |
| app/api/chat/route.js                    | Shared HTTP boundary and local response handler                           |
| tests/chat.mjs                           | Retrieval accuracy, context, missing data and API checks                  |

The chat cannot reason arbitrarily about every phrasing. Adding an LLM later requires a separate server-side provider adapter and grounding/validation of any claimed numbers. The current UI deliberately identifies its actual mode.

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
  mode: "local-data",
  paragraphs: string[],
  context: {scope, year, topic},
  sources: sourceMetadata[],
  table?: {columns: string[], rows: string[][]},
  result?: validatedPlanResult
}
```

Errors use `{error: string}`, HTTP 400 for invalid questions/context/configuration, plus shared HTTP origin/size/content-type errors. Messages must contain 1–2,000 characters.

No database table or migration is added. Chat calculations do not create saved decisions or plan runs. Conversation state is local React memory and clears on navigation/reload or New conversation. To retain reasoning, calculate and save through the decision builder. Existing saved decisions remain in SQLite.

## Evidence safeguards

National metrics are never assigned to individual states. Missing years remain missing. State revenue excludes federal transfers, and federal appropriation is not actual spending. Ranking collections cannot establish governance quality or causal explanations.

Requests for unsupported citizen, banking, business, transport or food-price datasets explicitly report the gap. Suggestions about investigating compliance, tax bases or outcomes are labelled investigation steps, not proven policy recommendations. Model answers retain the existing limitations on predicting GDP, jobs or service outcomes.

Source links go to the application's source register, which preserves publisher URLs, periods, terms and checksums. Text is rendered as React text rather than raw HTML.
