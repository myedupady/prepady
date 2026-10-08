/**
 * Fixed-window rate limiter, edge-compatible, with two backends:
 *
 *   1. Upstash Redis (Vercel KV) when UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN
 *      are set — authoritative across all serverless instances. This is what you
 *      want in production on Vercel.
 *   2. In-memory Map fallback otherwise — works in dev and single-instance, but on
 *      serverless each instance has its own counter, so it only softens bursts.
 *      Authoritative edge rate-limiting on Vercel is the Firewall's job
 *      (see docs/SECURITY.md); this is defense-in-depth, not the primary wall.
 *
 * Uses the Upstash REST API via fetch (no SDK dependency).
 */

export interface RateLimitResult {
  success: boolean
  limit: number
  remaining: number
  /** Seconds until the window resets. */
  reset: number
}

const UPSTASH_URL = process.env.UPSTASH_REDIS_REST_URL
const UPSTASH_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN

// In-memory fallback store (per instance).
const memory = new Map<string, { count: number; expires: number }>()

async function upstash(command: (string | number)[]): Promise<unknown> {
  const res = await fetch(`${UPSTASH_URL}/${command.map((c) => encodeURIComponent(String(c))).join('/')}`, {
    headers: { Authorization: `Bearer ${UPSTASH_TOKEN}` },
    cache: 'no-store',
  })
  if (!res.ok) throw new Error(`upstash ${res.status}`)
  const json = (await res.json()) as { result: unknown }
  return json.result
}

/**
 * Allow up to `limit` requests per `windowSec` for `identifier`.
 * Fails OPEN (allows the request) if the backend errors — never blocks real
 * users because of an infrastructure hiccup.
 */
export async function rateLimit(
  identifier: string,
  limit: number,
  windowSec: number,
): Promise<RateLimitResult> {
  const now = Math.floor(Date.now() / 1000)
  const window = Math.floor(now / windowSec)
  const key = `rl:${identifier}:${window}`
  const resetIn = windowSec - (now % windowSec)

  // ── Upstash backend ───────────────────────────────────────────────────────
  if (UPSTASH_URL && UPSTASH_TOKEN) {
    try {
      const count = Number(await upstash(['incr', key]))
      if (count === 1) await upstash(['expire', key, windowSec])
      return { success: count <= limit, limit, remaining: Math.max(0, limit - count), reset: resetIn }
    } catch {
      return { success: true, limit, remaining: limit, reset: resetIn } // fail open
    }
  }

  // ── In-memory fallback ────────────────────────────────────────────────────
  const entry = memory.get(key)
  const nowMs = Date.now()
  if (!entry || entry.expires < nowMs) {
    memory.set(key, { count: 1, expires: nowMs + windowSec * 1000 })
    // Opportunistic cleanup to bound the map.
    if (memory.size > 5000) for (const [k, v] of memory) if (v.expires < nowMs) memory.delete(k)
    return { success: true, limit, remaining: limit - 1, reset: resetIn }
  }
  entry.count++
  return { success: entry.count <= limit, limit, remaining: Math.max(0, limit - entry.count), reset: resetIn }
}

/** Best-effort client IP from standard proxy headers (Vercel sets x-forwarded-for). */
export function clientIp(req: Request): string {
  const xff = req.headers.get('x-forwarded-for')
  if (xff) return xff.split(',')[0].trim()
  return req.headers.get('x-real-ip') ?? '0.0.0.0'
}
