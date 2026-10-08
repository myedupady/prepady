import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { isPremium, FREE_DAILY_AI_LIMIT, dailyUsage, needsEmailVerification } from '@/lib/quiz'
import { answerFollowUp, generateExplanation, isAIError } from '@/lib/ai'
import { relName } from '@/lib/utils'

const VERIFY_MSG = 'Please confirm your email to use the AI tutor. Check your inbox for the link.'

/**
 * POST /api/ai/explain
 * Body:
 *   { questionId, givenAnswer? }                      → return the explanation (Tier 0/1)
 *   { questionId, mode: 'followup', message, ... }    → live follow-up answer (Tier 2)
 *
 * Tier 0/1 (default): if the question already has a stored explanation it is
 * returned FREE and unmetered. If not, one is generated once, stored on the
 * question (so everyone after gets it free), and returned.
 *
 * Tier 2 (mode:'followup'): a live, conversational answer to the student's
 * follow-up. Metered for free users (FREE_DAILY_AI_LIMIT/day); unlimited for premium.
 */
export async function POST(req: NextRequest) {
  try {
    const payload = await getPayload({ config: configPromise })

    const { user } = await payload.auth({ headers: req.headers })
    if (!user) return NextResponse.json({ error: 'You must be logged in.' }, { status: 401 })

    const body = await req.json().catch(() => ({}))
    const { questionId, givenAnswer, mode, message } = body as {
      questionId?: string
      givenAnswer?: string
      mode?: 'followup'
      message?: string
    }
    if (!questionId) return NextResponse.json({ error: 'questionId is required.' }, { status: 400 })

    const question = await payload.findByID({ collection: 'questions', id: questionId, depth: 1 }).catch(() => null)
    if (!question) return NextResponse.json({ error: 'Question not found.' }, { status: 404 })

    const subject =
      typeof question.subject === 'object' && question.subject
        ? (question.subject as { name?: string }).name ?? null
        : null
    const examDoc = typeof question.exam === 'object' && question.exam ? (question.exam as { code?: string; name?: string }) : null
    const examLabel = examDoc?.code ?? examDoc?.name ?? 'this exam'
    const options = Array.isArray(question.options)
      ? (question.options as Array<{ text?: string }>).map((o) => o.text ?? '').filter(Boolean)
      : []
    const storedExplanation = typeof question.explanation === 'string' ? question.explanation.trim() : ''
    const correctAnswer = (question as { correctAnswer?: string }).correctAnswer ?? null
    const topic = relName(question.topicRef) ?? (typeof question.topic === 'string' ? question.topic : null)
    const baseInput = { exam: examLabel, subject, topic, questionText: String(question.questionText), options, correctAnswer }

    // ── Tier 2: live follow-up ───────────────────────────────────────────────
    if (mode === 'followup') {
      const q = (message ?? '').trim()
      if (!q) return NextResponse.json({ error: 'A follow-up message is required.' }, { status: 400 })

      if (needsEmailVerification(user as { emailVerified?: boolean; role?: string })) {
        return NextResponse.json({ error: VERIFY_MSG, requiresVerification: true }, { status: 403 })
      }

      const premium = isPremium(user as { plan?: string; subscriptionExpiresAt?: string })
      if (!premium) {
        const now = new Date()
        const u = user as { aiUsesResetAt?: string; aiUsesToday?: number }
        const { isNewDay, usedToday } = dailyUsage(u.aiUsesResetAt, u.aiUsesToday, now)
        if (usedToday >= FREE_DAILY_AI_LIMIT) {
          return NextResponse.json(
            { error: `You've used your ${FREE_DAILY_AI_LIMIT} free AI follow-ups for today.`, requiresUpgrade: true },
            { status: 403 },
          )
        }
        await payload
          .update({
            collection: 'users',
            id: user.id,
            overrideAccess: true,
            data: { aiUsesToday: (isNewDay ? 0 : usedToday) + 1, aiUsesResetAt: now.toISOString() } as Record<string, unknown>,
          })
          .catch(() => {})
      }

      try {
        const { text } = await answerFollowUp(payload, {
          ...baseInput,
          givenAnswer: givenAnswer ?? null,
          priorExplanation: storedExplanation || 'No prior explanation was shown.',
          message: q,
        })
        return NextResponse.json({ explanation: text, source: 'followup' })
      } catch (err) {
        if (isAIError(err)) {
          return NextResponse.json({ error: aiErrorMessage(err.code), aiUnavailable: true }, { status: 503 })
        }
        throw err
      }
    }

    // ── Tier 0: stored explanation (free, unmetered) ─────────────────────────
    if (storedExplanation) {
      return NextResponse.json({ explanation: storedExplanation, source: 'stored' })
    }

    // ── Tier 1: generate once, store, serve (free to the student) ────────────
    if (needsEmailVerification(user as { emailVerified?: boolean; role?: string })) {
      return NextResponse.json({ error: VERIFY_MSG, requiresVerification: true }, { status: 403 })
    }
    try {
      const { text, model } = await generateExplanation(
        payload,
        { ...baseInput, givenAnswer: givenAnswer ?? null },
        { meterKind: 'explain' },
      )
      if (text) {
        await payload
          .update({
            collection: 'questions',
            id: questionId,
            overrideAccess: true,
            context: { triggeredByAIGen: true },
            data: { explanation: text, explanationGeneratedBy: `ai:${model}` },
          })
          .catch(() => {})
      }
      return NextResponse.json({ explanation: text, source: 'generated' })
    } catch (err) {
      if (isAIError(err)) {
        return NextResponse.json({ error: aiErrorMessage(err.code), aiUnavailable: true }, { status: 503 })
      }
      throw err
    }
  } catch (err) {
    console.error('ai/explain error:', err)
    return NextResponse.json({ error: 'Could not generate an explanation right now. Please try again.' }, { status: 500 })
  }
}

function aiErrorMessage(code: string): string {
  switch (code) {
    case 'not_configured':
      return 'The AI tutor is not available yet.'
    case 'paused':
      return 'The AI tutor is temporarily paused. Please try again later.'
    case 'budget_exceeded':
      return 'The AI tutor has reached its limit for this month. Please try again next month.'
    default:
      return 'Could not generate an explanation right now. Please try again.'
  }
}
