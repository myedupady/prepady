import { NextResponse, type NextRequest } from 'next/server'
import { rateLimit, clientIp } from '@/lib/rate-limit'

/**
 * Per-IP rate limiting on the sensitive, cost-bearing endpoints: auth (login,
 * signup, password reset) and the AI routes. This is app-level defense-in-depth;
 * the authoritative wall on Vercel is the Firewall (see docs/SECURITY.md).
 *
 * Only POSTs are limited (reads are cheap and gated elsewhere). Limits are
 * generous enough never to hit a real user but tight enough to stop scripted abuse.
 */
export const config = {
  matcher: ['/api/users/:path*', '/api/auth/:path*', '/api/ai/:path*'],
}

interface Rule {
  test: (path: string) => boolean
  limit: number
  windowSec: number
  bucket: string
}

const RULES: Rule[] = [
  // Auth: login / signup / forgot-password — strict (bot account creation, brute force, email abuse).
  { test: (p) => p === '/api/users/login' || p.startsWith('/api/auth/'), limit: 10, windowSec: 60, bucket: 'auth' },
  // Payload user create (fallback signup path) — strict.
  { test: (p) => p === '/api/users', limit: 10, windowSec: 60, bucket: 'auth' },
  // AI endpoints — per-IP ceiling on top of the per-user daily caps.
  { test: (p) => p.startsWith('/api/ai/'), limit: 30, windowSec: 60, bucket: 'ai' },
]

export async function middleware(req: NextRequest) {
  if (req.method !== 'POST') return NextResponse.next()

  const path = req.nextUrl.pathname
  const rule = RULES.find((r) => r.test(path))
  if (!rule) return NextResponse.next()

  const ip = clientIp(req)
  const { success, limit, remaining, reset } = await rateLimit(`${rule.bucket}:${ip}`, rule.limit, rule.windowSec)

  if (!success) {
    return NextResponse.json(
      { error: 'Too many requests. Please slow down and try again shortly.' },
      {
        status: 429,
        headers: {
          'Retry-After': String(reset),
          'X-RateLimit-Limit': String(limit),
          'X-RateLimit-Remaining': String(remaining),
        },
      },
    )
  }
  return NextResponse.next()
}
