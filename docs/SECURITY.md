# Prepady — Bot & Abuse Protection

_Last updated: 2026-10-07 · Hosting: Vercel_

Defense-in-depth so bots can't burn server time, the database, email, or AI.
Three layers: **edge** (stops traffic before it reaches us), **app** (backstop in
code), and **AI** (already bounded by design).

---

## The AI is already bot-proof

Worst-case AI spend from any traffic is a few dollars, by design:
- AI endpoints **require login**; stored explanations are a **free DB read** (no model call).
- Live calls are **per-user metered** (5/day free) and **marking is premium-only + capped** (20/day).
- A **monthly budget breaker** (`AI_MONTHLY_BUDGET_USD`, default $5) hard-stops live calls.
- Your **API credit with auto-reload OFF** is an absolute ceiling.

So the real exposure is the **frontend/DB/email/sign-up**, which the layers below cover.

---

## Layer 1 — App level (in code, already built)

| Protection | Where | Notes |
|---|---|---|
| `robots.txt` | `src/app/robots.ts` | Crawlers index only marketing pages; app/api/admin disallowed. |
| Theme caching | `src/app/(frontend)/layout.tsx` | 5-min cache — page floods don't hit the DB each time. |
| Login lockout | `src/collections/Users.ts` | Payload `maxLoginAttempts: 10`, `lockTime: 10m`. |
| Per-IP rate limiting | `src/middleware.ts` + `src/lib/rate-limit.ts` | 10/min on auth, 30/min on AI (POST only). |
| CAPTCHA | signup + forgot-password | Cloudflare Turnstile (Layer 2). |
| Email verification | gates **live AI** | Optional via `AI_REQUIRE_VERIFIED_EMAIL`. |

**Rate-limit backend.** The limiter uses **Upstash Redis (Vercel KV)** when its env
vars are set, else an in-memory fallback. On Vercel's serverless, in-memory counters
are per-instance, so **set up KV in production** (below) for the app-level limiter to
be authoritative — or rely on the Vercel Firewall (Layer 3), which is better still.

---

## Layer 2 — Turnstile CAPTCHA + email verification

### Cloudflare Turnstile (free)
1. Create a free Cloudflare account → **Turnstile** → add a site (your domain +
   `localhost` for dev). You get a **Site key** and a **Secret key**.
2. Set env vars (Vercel project → Settings → Environment Variables, and `.env.local`):
   ```
   NEXT_PUBLIC_TURNSTILE_SITE_KEY=0x4AAAA...
   TURNSTILE_SECRET_KEY=0x4AAAA...
   ```
3. That's it — the widget appears on **signup** and **forgot-password**, and the
   server verifies the token. Leaving the keys blank disables CAPTCHA (dev default).

### Email verification (gates AI only)
- On signup, a "confirm your email" message is sent (via Resend). The link hits
  `/verify` → `/api/auth/verify-email`, which sets `emailVerified`.
- To **enforce** it, set `AI_REQUIRE_VERIFIED_EMAIL=true`. Then unverified non-admin
  users can't use **live** AI (follow-ups, marking, on-demand generation) — stored
  explanations stay free. Login is **not** blocked, so sign-up stays low-friction.
- Admins are always exempt. Existing users: toggle `emailVerified` in `/admin`, or
  leave the flag `false` until you're ready to enforce.

---

## Layer 3 — Vercel edge (the real wall) — **set this up on deploy**

App-level limits are a backstop; the authoritative defense stops bots **before**
they reach your functions, DB, or AI.

### 1. Vercel Firewall rate limits (recommended)
Vercel project → **Firewall** → add **Rate Limit** rules:

| Path | Limit | Action |
|---|---|---|
| `/api/auth/*` and `/api/users/login` | ~10 / min per IP | Deny / challenge |
| `/api/ai/*` | ~30 / min per IP | Deny |
| `/api/*` (catch-all, looser) | ~100 / min per IP | Challenge |

Also enable **Attack Challenge Mode** if you ever see a flood — it challenges all
traffic without code changes.

### 2. Vercel KV (Upstash) for the app limiter
Vercel project → **Storage** → **KV** (Upstash Redis) → create → connect to the
project. Vercel injects `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN`
(and `KV_*`) automatically; the limiter picks them up with no code change.

### 3. Optional: Cloudflare in front
For heavier protection, put the domain behind **Cloudflare (free)**: WAF, bot
fight mode, and global rate limiting at the edge. Use **either** Cloudflare **or**
Vercel Firewall as the primary — no need for both at MVP.

### 4. Vercel built-ins (on by default)
Vercel provides baseline **DDoS mitigation** automatically; no setup needed.

---

## Environment variables summary

```
# Rate limiting (production)
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
# CAPTCHA
NEXT_PUBLIC_TURNSTILE_SITE_KEY=
TURNSTILE_SECRET_KEY=
# Email-verification gate for AI
AI_REQUIRE_VERIFIED_EMAIL=false
# AI spend guardrails
AI_MONTHLY_BUDGET_USD=5
AI_PAUSED=false
```

---

## Recommended rollout

1. **Now (done in code):** robots, theme cache, login lockout, app rate-limiter.
2. **On first Vercel deploy:** add Firewall rate-limit rules + create Vercel KV.
3. **Before public launch:** add Turnstile keys; flip `AI_REQUIRE_VERIFIED_EMAIL=true`.
4. **If attacked:** Vercel Attack Challenge Mode, and/or move DNS behind Cloudflare.
