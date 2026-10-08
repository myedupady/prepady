import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { isPremium, PREMIUM_MARK_DAILY_LIMIT, dailyUsage, needsEmailVerification } from '@/lib/quiz'
import { markEssay, isAIError } from '@/lib/ai'
import { relName } from '@/lib/utils'

/**
 * POST /api/ai/mark   Body: { questionId, answer }
 *
 * Marks a theory/essay answer against its marking scheme (Tier 3).
 * Premium-only, and capped per day (PREMIUM_MARK_DAILY_LIMIT) as an abuse guard.
 * The grade is produced by a schema-validated, temperature-0 tool call and then
 * clamped server-side — the model can never return an out-of-range score.
 */
export async function POST(req: NextRequest) {
  try {
    const payload = await getPayload({ config: configPromise })

    const { user } = await payload.auth({ headers: req.headers })
    if (!user) return NextResponse.json({ error: 'You must be logged in.' }, { status: 401 })

    const body = await req.json().catch(() => ({}))
    const { questionId, answer } = body as { questionId?: string; answer?: string }
    if (!questionId) return NextResponse.json({ error: 'questionId is required.' }, { status: 400 })
    const studentAnswer = (answer ?? '').trim()
    if (studentAnswer.length < 2) {
      return NextResponse.json({ error: 'Please write an answer before submitting.' }, { status: 400 })
    }

    // ── Email-verification gate (when enabled) ────────────────────────────────
    if (needsEmailVerification(user as { emailVerified?: boolean; role?: string })) {
      return NextResponse.json(
        { error: 'Please confirm your email to use AI marking.', requiresVerification: true },
        { status: 403 },
      )
    }

    // ── Premium gate ──────────────────────────────────────────────────────────
    const premium = isPremium(user as { plan?: string; subscriptionExpiresAt?: string })
    if (!premium) {
      return NextResponse.json(
        { error: 'AI essay marking is a Premium feature.', requiresUpgrade: true },
        { status: 403 },
      )
    }

    // ── Daily cap (abuse guard) ──────────────────────────────────────────────
    const now = new Date()
    const u = user as { markUsesResetAt?: string; markUsesToday?: number }
    const { isNewDay, usedToday } = dailyUsage(u.markUsesResetAt, u.markUsesToday, now)
    if (usedToday >= PREMIUM_MARK_DAILY_LIMIT) {
      return NextResponse.json(
        { error: `You've reached today's limit of ${PREMIUM_MARK_DAILY_LIMIT} marked essays.`, rateLimited: true },
        { status: 429 },
      )
    }

    // ── Load the theory question + scheme ────────────────────────────────────
    const question = await payload.findByID({ collection: 'questions', id: questionId, depth: 1 }).catch(() => null)
    if (!question) return NextResponse.json({ error: 'Question not found.' }, { status: 404 })
    if ((question as { questionType?: string }).questionType !== 'theory') {
      return NextResponse.json({ error: 'This question is not a theory question.' }, { status: 400 })
    }
    const markingScheme = typeof question.markingScheme === 'string' ? question.markingScheme.trim() : ''
    if (!markingScheme) {
      return NextResponse.json({ error: 'This question has no marking scheme yet. Please try another.' }, { status: 503 })
    }

    const subject =
      typeof question.subject === 'object' && question.subject ? (question.subject as { name?: string }).name ?? null : null
    const examDoc = typeof question.exam === 'object' && question.exam ? (question.exam as { code?: string; name?: string }) : null
    const maxMarks = Number((question as { maxMarks?: number }).maxMarks) || 1

    try {
      const { result } = await markEssay(payload, {
        exam: examDoc?.code ?? examDoc?.name ?? 'this exam',
        subject,
        topic: relName(question.topicRef) ?? (typeof question.topic === 'string' ? question.topic : null),
        questionText: String(question.questionText),
        markingScheme,
        maxMarks,
        answer: studentAnswer,
      })

      // Count the successful mark against the daily cap.
      await payload
        .update({
          collection: 'users',
          id: user.id,
          overrideAccess: true,
          data: { markUsesToday: (isNewDay ? 0 : usedToday) + 1, markUsesResetAt: now.toISOString() } as Record<string, unknown>,
        })
        .catch(() => {})

      return NextResponse.json({ result })
    } catch (err) {
      if (isAIError(err)) {
        const msg =
          err.code === 'budget_exceeded'
            ? 'AI marking has reached its limit for this month. Please try again next month.'
            : err.code === 'paused'
              ? 'AI marking is temporarily paused. Please try again later.'
              : err.code === 'invalid_output'
                ? 'The marker could not grade this answer. Please try again.'
                : 'AI marking is not available right now.'
        return NextResponse.json({ error: msg, aiUnavailable: true }, { status: 503 })
      }
      throw err
    }
  } catch (err) {
    console.error('ai/mark error:', err)
    return NextResponse.json({ error: 'Could not mark your answer right now. Please try again.' }, { status: 500 })
  }
}
