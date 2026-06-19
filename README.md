# Prepady

**AI-powered adaptive exam prep for WAEC, NECO, JAMB, Post-UTME, IGCSE & A-Level.**

Prepady is the "EduCore — Adaptive Learning Engine" product: adaptive practice tests, a real past-questions bank, and an AI layer that explains every question. Built on the same proven stack as Myedupady (Next.js 15 + Payload CMS 3 + Postgres), with Claude added as the AI tutor.

---

## Status — MVP foundation scaffolded

This repo is the **foundation**, bootstrapped from the battle-tested Myedupady stack. What's in place:

- ✅ Next.js 15 + Payload CMS 3 + Postgres app skeleton, build scripts, admin panel
- ✅ Data model: `Users` (with freemium subscription + AI metering), `Subjects`, `Questions` (MCQ + theory, past-question bank), `QuizSessions`, `Media`
- ✅ Exam taxonomy (WAEC/NECO/JAMB/Post-UTME/IGCSE/A-Level) and adaptive quiz helpers
- ✅ **AI "Explain this to me"** — `lib/ai.ts` + `POST /api/ai/explain`, gated by the freemium paywall
- ✅ Landing page

**Not yet built** (next steps — see Roadmap): the student-facing CBT quiz UI, signup/login pages, the dashboard, the Paystack subscription flow, and the first DB migration. These all have direct, working references in the `edupady` sibling repo to lift from.

---

## Architecture

| Layer | Choice | Notes |
|---|---|---|
| Framework | Next.js 15 (App Router, TS) | Same as edupady |
| CMS / Admin / Auth | Payload CMS 3 | `/admin`; built-in auth |
| Database | Postgres (Neon/Supabase) | Migrations via Payload |
| Styling | Tailwind + shadcn/ui | Primitives lifted from edupady |
| Payments | Paystack | NGN subscriptions (Phase 1) |
| **AI** | **Claude (`@anthropic-ai/sdk`)** | Explain / step-by-step / essay marking |
| Offline | PWA + service worker | Phase 2 |

### The three EduCore pillars → where they live
- **Adaptive tests** → `QuizSessions` + `lib/quiz.ts` (adaptive difficulty, streaks) + the question bank. ~70% lifted from the proven Myedupady engine.
- **Video + NERDC curriculum** → Phase 2 (Subject → Topic → Concept → {video, notes, questions}).
- **AI explanation layer** → `lib/ai.ts` + `/api/ai/explain` (built); essay marking + topic follow-ups in Phase 3.

---

## AI model choice = cost control (the revenue lever)

AI calls cost money per use, so model choice is deliberate and per-feature (env-configurable in `lib/ai.ts`):

| Feature | Default model | ~Cost / action | Why |
|---|---|---|---|
| "Explain this" / step-by-step | **Haiku 4.5** ($1/$5 per 1M) | ~$0.0025 (**~₦4**) | High volume, must be cheap |
| Hard maths / tough explanations | Sonnet 4.6 ($3/$15) | ~$0.01 | Optional upgrade |
| Essay / theory marking (Phase 3) | Sonnet 4.6 (Opus 4.8 for premium) | ~$0.025–0.05 (**~₦40–80**) | High value; meter it |

A paying student doing ~50 explanations + 5 essays/month ≈ **$0.25–0.40 (~₦400–650)** in AI cost — comfortably under a **₦1,500–3,000/month** subscription **provided** the expensive actions (essay marking, unlimited AI) sit behind the paid tier and daily caps. Free tier is metered at `FREE_DAILY_AI_LIMIT` (5/day) in `lib/quiz.ts`.

> Bump quality any time by setting `AI_EXPLAIN_MODEL=claude-opus-4-8` etc. — it's a config decision, not a code change.

## Revenue model — freemium subscription
- **Free:** daily adaptive practice + limited daily AI + past-question samples (acquisition).
- **Premium:** unlimited AI, full timed CBT mocks, essay marking, full past-question bank. Monthly / termly / JAMB-season bundles, priced in NGN.
- Later channel: **school/B2B** seat licences (Phase 2+).

---

## Getting started

```bash
pnpm install
cp .env.example .env.local        # fill in DATABASE_URI, PAYLOAD_SECRET, ANTHROPIC_API_KEY
pnpm generate:importmap           # regenerate the Payload admin import map for this config
pnpm migrate:create initial       # generate the first migration (over a :5432 connection)
pnpm migrate                      # apply it  (⚠ use a SESSION pooler / :5432, not :6543)
pnpm dev                          # http://localhost:3000  ·  admin at /admin
pnpm generate:types               # regenerate payload-types.ts after schema changes
```

> **Migration gotcha (inherited from edupady):** Payload `migrate` hangs over a Supabase **transaction pooler (:6543)**. Run migrations over the **session pooler / direct connection (:5432)**; the runtime app can stay on :6543.

---

## Roadmap

**Phase 1 — MVP (fastest to revenue)**
- [x] App skeleton, data model, AI explain endpoint
- [ ] First DB migration + seed a starter question bank
- [ ] Signup / login pages (lift from edupady auth)
- [ ] CBT quiz UI: pre-screen → adaptive practice + timed JAMB mock (lift `QuizFlow`/`QuizEngine` from edupady) with the "Explain this" button wired to `/api/ai/explain`
- [ ] `/api/quiz/start` + `/api/quiz/answer` (adapt edupady routes to the exam/subject model)
- [ ] Student dashboard (progress, gap detection by topic)
- [ ] Paystack subscription init + webhook → flip `plan`/`subscriptionExpiresAt`

**Phase 2 — Content & reach**
- [ ] NERDC curriculum (Subject → Topic → Concept), concept videos, downloadable notes
- [ ] PWA offline support
- [ ] Cloud media storage (Cloudinary/S3)

**Phase 3 — AI depth**
- [ ] AI essay/theory marking against the marking scheme (`AI_MARKING_MODEL`)
- [ ] Per-topic AI tutor (ask follow-up questions)

---

## Out of scope (content, not code)
Question banks, NERDC curriculum, concept videos, and marking schemes are **content** the client produces — same boundary as edupady. The code provides the structures and AI; the teaching content is loaded via `/admin`.
