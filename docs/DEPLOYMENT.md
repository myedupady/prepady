# Prepady — Deployment (Vercel)

_Last updated: 2026-10-08_

How Prepady goes live on Vercel, how the database schema is managed, and the
env/config checklist. Pairs with [SECURITY.md](./SECURITY.md) (bot protection)
and [AI-ARCHITECTURE.md](./AI-ARCHITECTURE.md).

---

## Database schema: dev push vs. production migrations

- **Development** auto-syncs the schema to the DB on startup (`push: true`) for
  fast iteration. This is why local scripts can be slow to boot — Payload
  introspects + diffs the schema each time.
- **Production** does **not** push. It applies the committed **migration files**
  in `src/migrations/`. The adapter is configured with
  `push: process.env.NODE_ENV !== 'production'` (see `src/payload.config.ts`).

### Working with migrations

```bash
pnpm migrate:create <name>   # generate a migration from the current schema (over a :5432 session pooler)
pnpm migrate                 # apply pending migrations
pnpm migrate:status          # (if needed) inspect state
```

After any schema change (new field/collection), run `pnpm migrate:create <name>`,
commit the generated file in `src/migrations/`, and it will apply on the next deploy.

> ⚠️ Run migrations over a **session pooler / direct connection (:5432)**, not the
> transaction pooler (:6543), which hangs on DDL.

### Recommended: a fresh production database

Use a **separate database for production** (a new Supabase/Neon project), not the
dev DB. On first deploy, `pnpm migrate` builds the entire schema from the baseline
migration on that clean DB — no drift, no surprises. Then seed the catalogue:

```bash
DATABASE_URI=<prod> pnpm migrate
DATABASE_URI=<prod> pnpm seed        # regions, exams, subjects, topics, sample questions
```

---

## Vercel setup

1. **Import the GitHub repo** into Vercel.
2. **Build command** — run migrations before building:
   ```
   pnpm migrate && pnpm build
   ```
   (Set this in Vercel → Settings → Build & Development Settings, or add a
   `vercel-build` script.)
3. **Environment variables** (Vercel → Settings → Environment Variables) — copy
   from `.env.example`. Required:
   - `DATABASE_URI` (production DB), `PAYLOAD_SECRET`, `NEXT_PUBLIC_SERVER_URL` (your prod URL)
   - `ANTHROPIC_API_KEY` (+ the `AI_*` settings)
   - `RESEND_API_KEY`, `RESEND_FROM_EMAIL`
   - `CLOUDINARY_*`, `NEXT_PUBLIC_GOOGLE_CLIENT_ID` (if used)
   - Bot protection (recommended): create **Vercel KV** → injects
     `UPSTASH_REDIS_REST_URL/TOKEN`; add **Turnstile** keys; see SECURITY.md.
4. **Admin import map** — if you add admin UI components, run
   `pnpm generate:importmap` and commit before deploying.
5. **Firewall** — add the rate-limit rules from SECURITY.md once deployed.

---

## Post-deploy checklist

- [ ] `pnpm migrate` ran in the build (check the Vercel build log).
- [ ] First admin user created at `/admin` (the first signup is auto-promoted to admin).
- [ ] Theme/exams visible (seed ran against the prod DB).
- [ ] AI works: answer a question → "Explain this to me"; spend shows in `/admin → AI Controls & Usage`.
- [ ] Firewall rate-limit rules added; Vercel KV connected.
- [ ] (Before public launch) Turnstile keys set; `AI_REQUIRE_VERIFIED_EMAIL=true`.
