import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { explainQuestion } from '@/lib/ai'
import { isPremium, FREE_DAILY_AI_LIMIT } from '@/lib/quiz'

/**
 * POST /api/ai/explain
 * Body: { questionId: string, givenAnswer?: string }
 * Returns: { explanation }  — or 403 { requiresUpgrade: true } when a free user
 * has spent their daily allowance.
 */
export async function POST(req: NextRequest) {
  try {
    const payload = await getPayload({ config: configPromise })

    // ── Auth ────────────────────────────────────────────────────────────
    const { user } = await payload.auth({ headers: req.headers })
    if (!user) {
      return NextResponse.json({ error: 'You must be logged in.' }, { status: 401 })
    }

    const body = await req.json().catch(() => ({}))
    const { questionId, givenAnswer } = body as { questionId?: string; givenAnswer?: string }
    if (!questionId) {
      return NextResponse.json({ error: 'questionId is required.' }, { status: 400 })
    }

    // ── Freemium gate ─────────────────────────────────────────────────────
    const premium = isPremium(user as { plan?: string; subscriptionExpiresAt?: string })
    if (!premium) {
      // Reset the daily counter if we've rolled into a new day.
      const now = new Date()
      const resetAt = (user as { aiUsesResetAt?: string }).aiUsesResetAt
      const isNewDay =
        !resetAt || new Date(resetAt).toDateString() !== now.toDateString()
      const usedToday = isNewDay ? 0 : ((user as { aiUsesToday?: number }).aiUsesToday ?? 0)

      if (usedToday >= FREE_DAILY_AI_LIMIT) {
        return NextResponse.json(
          {
            error: `You've used your ${FREE_DAILY_AI_LIMIT} free AI explanations for today.`,
            requiresUpgrade: true,
          },
          { status: 403 },
        )
      }

      // Record the use (best-effort — overrideAccess so the field-level lock
      // on aiUsesToday doesn't block the system update).
      await payload
        .update({
          collection: 'users',
          id: user.id,
          overrideAccess: true,
          data: {
            aiUsesToday: usedToday + 1,
            aiUsesResetAt: now.toISOString(),
          } as Record<string, unknown>,
        })
        .catch(() => {})
    }

    // ── Load the question ──────────────────────────────────────────────────
    const question = await payload
      .findByID({ collection: 'questions', id: questionId, depth: 1 })
      .catch(() => null)
    if (!question) {
      return NextResponse.json({ error: 'Question not found.' }, { status: 404 })
    }

    const subject =
      typeof question.subject === 'object' && question.subject
        ? (question.subject as { name?: string }).name
        : null
    const examDoc =
      typeof question.exam === 'object' && question.exam
        ? (question.exam as { code?: string; name?: string })
        : null
    const examLabel = examDoc?.code ?? examDoc?.name ?? 'this exam'
    const options = Array.isArray(question.options)
      ? (question.options as Array<{ text?: string }>).map((o) => o.text ?? '').filter(Boolean)
      : []

    // ── Generate the explanation ───────────────────────────────────────────
    const explanation = await explainQuestion({
      exam: examLabel,
      subject,
      topic: (question as { topic?: string }).topic ?? null,
      questionText: String(question.questionText),
      options,
      correctAnswer: (question as { correctAnswer?: string }).correctAnswer ?? null,
      givenAnswer: givenAnswer ?? null,
    })

    return NextResponse.json({ explanation })
  } catch (err) {
    console.error('ai/explain error:', err)
    return NextResponse.json(
      { error: 'Could not generate an explanation right now. Please try again.' },
      { status: 500 },
    )
  }
}
