# Prepady — AI Architecture

_Last updated: 2026-10-05_

This document describes how the AI tutor works, why it is built this way, what it
costs, and how to operate and extend it. It is the reference for the code under
`src/lib/ai/`, the AI API routes, the auto-generation hook, and the CLI.

---

## 1. The governing principle: architecture beats model choice

An explanation for a question is **the same for every student**. The question
bank is **finite and shared**. So the explanation is a property of the *question*,
not of the *user*: generate it **once**, store it on the question, and serve it
for free forever.

This single decision turns the highest-volume AI feature ("Explain this to me")
from _a cost on every click_ into _a one-time cost of a few dollars for the whole
bank_. At Prepady's volume the **provider you pick barely moves the bill** — the
tiering does. (The provider is still abstracted so it can be swapped; see §5.)

---

## 2. The cost tiers

| Tier | Feature | When the model runs | Marginal cost per use | Gating |
|---|---|---|---|---|
| **0 — Deterministic** | MCQ grading; serving a stored explanation | Never | **$0** | none |
| **1 — Batch pre-gen** | Fill missing explanations for the bank | Admin-triggered / on publish, offline | **~$0.001 once**, then $0 | budget + pause |
| **2 — Live cheap** | Conversational follow-up ("explain differently") | Student asks | ~₦2–3 | 5/day free · unlimited premium |
| **3 — Live premium** | Essay / theory marking vs scheme | Premium student submits | ~₦10–15 | premium only · 20/day cap |

**99% of "Explain this" clicks are Tier 0** — a stored string, zero latency, zero
cost. The model only runs in Tier 1 (once, offline) and Tiers 2–3 (genuinely
dynamic, metered).

---

## 3. End-to-end flows

### Admin → user (the explanation bridge)

```
Admin publishes an MCQ in /admin
        │  (no explanation typed)
        ▼
afterChange hook: generateExplanationOnPublish   ── src/collections/hooks/generateExplanation.ts
        │  fire-and-forget; respects AI Controls (autogen on? paused? budget? key?)
        ▼
orchestrator.generateExplanation()               ── src/lib/ai/index.ts
        │  provider.explain() → Claude Haiku 4.5 (cacheable system prompt)
        ▼
question.explanation stored + explanationGeneratedBy="ai:<model>"
        ▼
Student clicks "Explain this to me" → GET stored explanation  ──  FREE, unmetered
```

Bulk backfill for an existing bank uses the same orchestrator via the CLI:
`pnpm ai:explain` (see §7).

### Student live paths

- **Follow-up (Tier 2):** `POST /api/ai/explain` with `mode:"followup"` + `message`.
  Metered against `users.aiUsesToday` (5/day free; unlimited premium).
- **Essay marking (Tier 3):** `POST /api/ai/mark` with `{questionId, answer}`.
  Premium-only; capped at `PREMIUM_MARK_DAILY_LIMIT` (20/day) via
  `users.markUsesToday`. The grade is a forced, schema-validated tool call at
  `temperature: 0`, then **clamped server-side** to `[0, maxMarks]`.

---

## 4. Guardrails (determinism & safety)

1. **AI never grades MCQs.** Correct/incorrect comes from `question.correctAnswer`
   (`isCorrectAnswer` in `src/lib/quiz.ts`). The model only *explains* a verdict
   already decided by data.
2. **Structured marking only.** Essay marks come through the `submit_marking`
   tool (`src/lib/ai/marking.ts`) with a JSON schema, `temperature: 0`. The
   result is validated and the score clamped/rounded — the model cannot return an
   out-of-range or free-form grade. The **verdict band is derived from the score**,
   so the label can never contradict the number.
3. **Prompt caching.** Stable system prompts are sent as cacheable blocks, so
   repeated calls pay the 0.1× cache-read rate on the system prompt.
4. **Hard caps.** `max_tokens` per call type (500 explain/followup, 1024 mark);
   per-user daily limits; minimum answer length on marking.
5. **Budget circuit-breaker.** `AI_MONTHLY_BUDGET_USD` (editable in admin). Once
   this month's measured spend reaches it, live calls throw `budget_exceeded`
   and the UI degrades to stored content.
6. **Kill switch.** `paused` in AI Controls disables all live calls instantly.
7. **Graceful degradation.** Missing key / paused / over-budget never crash a
   page — stored explanations keep serving; live endpoints return `503` with
   `aiUnavailable:true`.
8. **Prompt-injection resistance.** The follow-up system prompt instructs the
   tutor to stay on the question and ignore attempts to change its instructions.
9. **Anti-cheat.** `sanitiseQuestion` strips `correctAnswer`/`explanation` from
   quiz payloads; the theory page never sends `markingScheme` to the client.

---

## 5. Providers & models

All providers implement one interface (`AIProvider` in `src/lib/ai/types.ts`):
`explain`, `followUp`, `mark`, plus `isConfigured()`. Selection is by
`AI_PROVIDER` / the admin control, resolved in `resolveProvider()`.

| Use | Default model | Env var | Rationale |
|---|---|---|---|
| Explain / auto-gen | `claude-haiku-4-5` | `AI_EXPLAIN_MODEL` | Cheapest capable; $1/$5 per MTok |
| Follow-up | `claude-haiku-4-5` | `AI_FOLLOWUP_MODEL` | Same tier, conversational |
| Marking | `claude-sonnet-4-5` | `AI_MARKING_MODEL` | Judgment task; consider `claude-sonnet-5-5` ($2/$10) if available to your org — better **and** cheaper |

**Provider comparison (why Anthropic now):** at Prepady's volume the bill is a few
dollars either way, so we optimise for integration + quality + guardrails, where
Claude is strong (first-class tool use, prompt caching). **Gemini** is stubbed as
the "spend literally nothing" option — Gemini 2.5 Flash-Lite has a genuine free
tier — and finishing it is a config swap (see §9). **OpenAI** is competitive but
adds a vendor with no edge here. **Grok** has the weakest structured-output
ecosystem. **Meta/Llama** self-hosting costs _more_ at low volume (idle GPU) than
a few dollars of API — revisit only at large scale.

Prices live in one table: `src/lib/ai/pricing.ts`. Every cost figure (budget
breaker, CLI estimate, admin counters) is derived from it.

---

## 6. Unit economics (worked)

Haiku 4.5 = $1/MTok in, $5/MTok out. One explanation ≈ 450 in / 300 out tokens.

- **Per explanation (generated once):** ≈ **$0.0019** (~₦3). With the system
  prompt cached, less.
- **Whole bank (e.g. 5,000 MCQs, one-time):** ≈ **$5 total.** Then unlimited free
  serving to every student forever.
- **Follow-up (Tier 2):** ~₦2–3, free-capped at 5/day.
- **Essay marking (Tier 3, Sonnet):** ≈ $0.008 (~₦13). A premium student marking
  20 essays/month ≈ **₦260** against a ₦1,500–3,000 sub.

**Net:** the free tier can cost ≈ **$0/month**; premium stays ~10× margin-positive.

---

## 7. Operating it

### Environment (`.env.local`)
```
AI_PROVIDER=anthropic
ANTHROPIC_API_KEY=sk-ant-...
AI_EXPLAIN_MODEL=claude-haiku-4-5
AI_FOLLOWUP_MODEL=claude-haiku-4-5
AI_MARKING_MODEL=claude-sonnet-4-5
AI_AUTOGEN_ON_PUBLISH=true
AI_MONTHLY_BUDGET_USD=25
AI_PAUSED=false
GOOGLE_API_KEY=            # only when finishing the Gemini provider
```

### Admin panel — **Settings → AI Controls & Usage**
- Toggle auto-generation, set the monthly budget, flip the pause switch, choose
  the provider.
- Watch this month's spend and per-feature call counts (updated after each call).

### CLI — backfill explanations
```bash
pnpm ai:explain                 # fill every published MCQ missing an explanation
pnpm ai:explain -- --dry-run    # preview count + estimated cost, change nothing
pnpm ai:explain -- --exam JAMB  # one exam (by code)
pnpm ai:explain -- --limit 50   # cap how many
pnpm ai:explain -- --force      # regenerate even where one exists
pnpm ai:explain -- --concurrency 6
```
Always start with `--dry-run` to see the cost estimate. The CLI honours the
budget and pause switch and meters spend into AI Controls.

### Bulk / cheapest generation (large backfills)
For thousands of questions at once, the Anthropic **Batch API** is 50% cheaper
(submit → poll → retrieve, async up to 24h). The current CLI generates
synchronously with a concurrency pool, which is simpler and ample for an
incrementally grown bank; wire Batch into `generateExplanation` if a large
one-shot backfill is needed.

---

## 8. Testing

Pure logic is unit-tested with Node's built-in runner via `tsx` (no extra deps):

```bash
pnpm test:ai
```

Covers: cost estimation & caching math, mark parsing/clamping/verdict derivation,
prompt builders, and the operational guards (not-configured / paused / budget /
provider resolution). The live provider calls are intentionally **not** hit in CI
— they are exercised by the smoke test below once a key is present.

### Manual smoke test (after adding `ANTHROPIC_API_KEY`)
1. `pnpm dev`, sign in, open a quiz, answer a question, click **Explain this to me**
   → first view generates+stores; refresh/other users get it instantly (free).
2. In `/admin`, publish a new MCQ with no explanation → within a moment the
   `explanation` field fills and `explanationGeneratedBy` shows `ai:<model>`.
3. As a **premium** user, open `/theory/<examId>`, answer a theory question with a
   `markingScheme`, submit → a clamped score + strengths/improvements appear.
4. In **AI Controls**, flip **Pause** → live calls return a graceful "temporarily
   paused" message; stored explanations still serve.

---

## 9. Extending to Gemini (free-tier path)

`src/lib/ai/providers/gemini.ts` is a stub behind the shared interface. To finish:
1. `pnpm add @google/genai`
2. Implement `explain` / `followUp` / `mark` with
   `new GoogleGenAI({apiKey}).models.generateContent`, mapping
   `usageMetadata.{promptTokenCount, candidatesTokenCount, cachedContentTokenCount}`
   into `TokenUsage`, and a `responseSchema` for `mark()`.
3. Make `isConfigured()` return `!!process.env.GOOGLE_API_KEY`.
4. Set `AI_PROVIDER=gemini` and `AI_EXPLAIN_MODEL=gemini-2.5-flash-lite`.

Nothing in the routes, hook, or CLI changes — they call the orchestrator, which
calls the selected provider.

---

## 10. File map

| Path | Role |
|---|---|
| `src/lib/ai/types.ts` | Provider interface, inputs/outputs, typed errors |
| `src/lib/ai/pricing.ts` | Model price table + cost estimator (single source of truth) |
| `src/lib/ai/prompts.ts` | System prompts + user-message builders |
| `src/lib/ai/marking.ts` | Mark tool schema, validation, clamping, verdict derivation |
| `src/lib/ai/usage.ts` | AI Controls global read/write, budget check, metering |
| `src/lib/ai/providers/anthropic.ts` | Claude implementation (caching, tool-use marking) |
| `src/lib/ai/providers/gemini.ts` | Gemini stub (interface parity) |
| `src/lib/ai/index.ts` | Orchestrator: provider selection, guards, metering |
| `src/lib/ai/__tests__/` | Unit tests (`pnpm test:ai`) |
| `src/globals/AIControls.ts` | Admin controls + live usage counters |
| `src/collections/hooks/generateExplanation.ts` | Auto-generate on publish |
| `src/app/api/ai/explain/route.ts` | Tier 0/1 stored/generate + Tier 2 follow-up |
| `src/app/api/ai/mark/route.ts` | Tier 3 essay marking |
| `src/app/(frontend)/theory/[examId]/` | Student theory practice UI |
| `src/scripts/ai-explain.ts` | CLI backfill (`pnpm ai:explain`) |
