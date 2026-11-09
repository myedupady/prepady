import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { isPremiumPlus, PREMIUM_PLUS_DAILY_LIMIT, dailyUsage } from '@/lib/quiz'
import { solveImage, type SnapMediaType } from '@/lib/ai/premium-plus'
import { isAIError } from '@/lib/ai'

const ALLOWED: SnapMediaType[] = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
const MAX_BASE64 = 3_800_000 // ~2.8MB image; the client downscales before sending

/**
 * POST /api/ai/snap  Body: { imageBase64, mediaType, note? }
 * Premium Plus "Snap & Solve" — photo a question, get the worked solution.
 */
export async function POST(req: NextRequest) {
  try {
    const payload = await getPayload({ config: configPromise })
    const { user } = await payload.auth({ headers: req.headers })
    if (!user) return NextResponse.json({ error: 'You must be logged in.' }, { status: 401 })
    if (!isPremiumPlus(user as { plan?: string; subscriptionExpiresAt?: string })) {
      return NextResponse.json({ error: 'Snap & Solve is a Premium Plus feature.', requiresUpgrade: true }, { status: 403 })
    }

    const body = await req.json().catch(() => ({}))
    const { imageBase64, mediaType, note } = body as { imageBase64?: string; mediaType?: string; note?: string }
    if (!imageBase64 || !mediaType) return NextResponse.json({ error: 'An image is required.' }, { status: 400 })
    if (!ALLOWED.includes(mediaType as SnapMediaType)) return NextResponse.json({ error: 'Unsupported image type.' }, { status: 400 })
    if (imageBase64.length > MAX_BASE64) return NextResponse.json({ error: 'That image is too large — try a tighter crop.' }, { status: 413 })

    // Daily cap (abuse guard).
    const now = new Date()
    const u = user as { snapUsesResetAt?: string; snapUsesToday?: number }
    const { isNewDay, usedToday } = dailyUsage(u.snapUsesResetAt, u.snapUsesToday, now)
    if (usedToday >= PREMIUM_PLUS_DAILY_LIMIT) {
      return NextResponse.json({ error: `You've used your ${PREMIUM_PLUS_DAILY_LIMIT} Snap & Solve uses for today.` }, { status: 429 })
    }

    try {
      const { text } = await solveImage(payload, { imageBase64, mediaType: mediaType as SnapMediaType, note })
      await payload
        .update({ collection: 'users', id: user.id, overrideAccess: true, data: { snapUsesToday: (isNewDay ? 0 : usedToday) + 1, snapUsesResetAt: now.toISOString() } as Record<string, unknown> })
        .catch(() => {})
      return NextResponse.json({ solution: text })
    } catch (err) {
      if (isAIError(err)) return NextResponse.json({ error: aiMsg(err.code), aiUnavailable: true }, { status: 503 })
      throw err
    }
  } catch (err) {
    console.error('ai/snap error:', err)
    return NextResponse.json({ error: 'Could not solve that right now. Please try again.' }, { status: 500 })
  }
}

function aiMsg(code: string): string {
  if (code === 'not_configured') return 'The AI tutor is not available yet.'
  if (code === 'paused') return 'The AI tutor is temporarily paused. Please try again later.'
  if (code === 'budget_exceeded') return 'The AI tutor has reached its limit for this month.'
  return 'Could not solve that right now. Please try again.'
}
