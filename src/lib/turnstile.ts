/**
 * Server-side Cloudflare Turnstile verification.
 *
 * Turnstile is a free, privacy-friendly CAPTCHA alternative. When
 * TURNSTILE_SECRET_KEY is NOT set, verification is SKIPPED (returns success) so
 * dev and pre-launch flows keep working; set the key (and the public site key)
 * to enforce it. See docs/SECURITY.md.
 */

const SECRET = process.env.TURNSTILE_SECRET_KEY

export interface TurnstileResult {
  success: boolean
  /** True when verification was skipped because no secret is configured. */
  skipped?: boolean
}

export async function verifyTurnstile(token: string | undefined, ip?: string): Promise<TurnstileResult> {
  if (!SECRET) return { success: true, skipped: true }
  if (!token) return { success: false }
  try {
    const body = new URLSearchParams({ secret: SECRET, response: token })
    if (ip) body.set('remoteip', ip)
    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
      cache: 'no-store',
    })
    const data = (await res.json()) as { success: boolean }
    return { success: !!data.success }
  } catch {
    // Don't hard-fail on a Cloudflare outage — but this is a CAPTCHA, so treat
    // an error as a failure to be safe against abuse during the outage window.
    return { success: false }
  }
}

/** Whether CAPTCHA is enforced (both keys present). The client reads the public key. */
export const isTurnstileEnabled = !!SECRET
