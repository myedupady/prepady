import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { isPremiumPlus, PREMIUM_PLUS_DAILY_LIMIT, dailyUsage } from '@/lib/quiz'
import { tutorAsk } from '@/lib/ai/premium-plus'
import { isAIError } from '@/lib/ai'

/**
 * POST /api/ai/ask  Body: { question }
 * Premium Plus "Voice Ask" (and typed ask) — a free-form tutor question. The
 * voice is transcribed in the browser; this endpoint answers the text.
 */
export async function POST(req: NextRequest) {
  try {
    const payload = await getPayload({ config: configPromise })
    const { user } = await payload.auth({ headers: req.headers })
    if (!user) return NextResponse.json({ error: 'You must be logged in.' }, { status: 401 })
    if (!isPremiumPlus(user as { plan?: string; subscriptionExpiresAt?: string })) {
      return NextResponse.json({ error: 'Voice Ask is a Premium Plus feature.', requiresUpgrade: true }, { status: 403 })
    }

    const body = await req.json().catch(() => ({}))
    const question = String((body as { question?: string }).question ?? '').trim()
    if (!question) return NextResponse.json({ error: 'Ask a question first.' }, { status: 400 })

    const now = new Date()
    const u = user as { voiceUsesResetAt?: string; voiceUsesToday?: number }
    const { isNewDay, usedToday } = dailyUsage(u.voiceUsesResetAt, u.voiceUsesToday, now)
    if (usedToday >= PREMIUM_PLUS_DAILY_LIMIT) {
      return NextResponse.json({ error: `You've used your ${PREMIUM_PLUS_DAILY_LIMIT} Voice Ask uses for today.` }, { status: 429 })
    }

    try {
      const { text } = await tutorAsk(payload, { question })
      await payload
        .update({ collection: 'users', id: user.id, overrideAccess: true, data: { voiceUsesToday: (isNewDay ? 0 : usedToday) + 1, voiceUsesResetAt: now.toISOString() } as Record<string, unknown> })
        .catch(() => {})
      return NextResponse.json({ answer: text })
    } catch (err) {
      if (isAIError(err)) return NextResponse.json({ error: aiMsg(err.code), aiUnavailable: true }, { status: 503 })
      throw err
    }
  } catch (err) {
    console.error('ai/ask error:', err)
    return NextResponse.json({ error: 'Could not answer that right now. Please try again.' }, { status: 500 })
  }
}

function aiMsg(code: string): string {
  if (code === 'not_configured') return 'The AI tutor is not available yet.'
  if (code === 'paused') return 'The AI tutor is temporarily paused. Please try again later.'
  if (code === 'budget_exceeded') return 'The AI tutor has reached its limit for this month.'
  return 'Could not answer that right now. Please try again.'
}
