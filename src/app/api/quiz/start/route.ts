import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import type { RequiredDataFromCollectionSlug, Where } from 'payload'
import configPromise from '@payload-config'
import { shuffle, sanitiseQuestion, isPremium } from '@/lib/quiz'

const FREE_PRACTICE_QUESTIONS = 10
const FREE_MOCK_QUESTIONS = 20
// Premium plays the whole paper (bounded to the fetch limit for safety).
const PREMIUM_MAX_QUESTIONS = 200

/**
 * POST /api/quiz/start  Body: { examId, subjectId? }
 * Creates an adaptive practice session for an exam (optionally a subject) and
 * returns the first question. Requires login.
 */
export async function POST(req: NextRequest) {
  try {
    const payload = await getPayload({ config: configPromise })
    const { user } = await payload.auth({ headers: req.headers })
    if (!user) return NextResponse.json({ error: 'You must be logged in.' }, { status: 401 })

    const body = await req.json().catch(() => ({}))
    const { examId, subjectId, topicId, mode, year } = body as {
      examId?: number | string
      subjectId?: number | string
      topicId?: number | string
      mode?: 'practice' | 'mock'
      year?: number | string
    }
    if (!examId) return NextResponse.json({ error: 'examId is required.' }, { status: 400 })
    const isMock = mode === 'mock'
    const pastYear = year ? Number(year) : null

    // Abandon any existing active session for this user + exam.
    const existing = await payload.find({
      collection: 'quiz-sessions',
      where: { and: [{ user: { equals: user.id } }, { exam: { equals: String(examId) } }, { status: { equals: 'active' } }] },
      limit: 5,
    })
    for (const s of existing.docs) {
      await payload.update({ collection: 'quiz-sessions', id: s.id, data: { status: 'abandoned' } })
    }

    const baseClauses: Where[] = [
      { exam: { equals: examId } },
      { status: { equals: 'published' } },
      { questionType: { equals: 'mcq' } },
      { passage: { exists: false } }, // comprehension questions are served via the passage flow

      ...(subjectId ? [{ subject: { equals: subjectId } } as Where] : []),
      ...(topicId ? [{ topicRef: { equals: topicId } } as Where] : []),
      // Past-questions mode → only that year; practice → only simulated (no year).
      ...(pastYear ? [{ year: { equals: pastYear } } as Where] : [{ year: { exists: false } } as Where]),
    ]

    const pool = await payload.find({ collection: 'questions', where: { and: baseClauses }, limit: PREMIUM_MAX_QUESTIONS, depth: 0 })
    if (pool.docs.length === 0) {
      return NextResponse.json({ error: 'No questions available for this exam yet. Please check back soon.' }, { status: 503 })
    }

    // Premium students sit the full paper; free students get a sampler.
    const premium = isPremium(user as { plan?: string; subscriptionExpiresAt?: string })
    const cap = premium ? PREMIUM_MAX_QUESTIONS : isMock ? FREE_MOCK_QUESTIONS : FREE_PRACTICE_QUESTIONS
    const totalQuestions = Math.min(pool.docs.length, cap)
    const timeLimitMinutes = isMock ? Math.ceil(totalQuestions * 1.2) : 0
    const easy = pool.docs.filter((q) => String(q.difficulty) === '1')
    const first = shuffle(easy.length ? easy : pool.docs)[0]!
    // Re-fetch with depth 1 so the question image (upload relationship) is populated.
    const firstFull = await payload.findByID({ collection: 'questions', id: first.id, depth: 1 }).catch(() => first)

    const session = await payload.create({
      collection: 'quiz-sessions',
      data: {
        user: user.id,
        exam: String(examId),
        subject: subjectId ? Number(subjectId) : undefined,
        topicRef: topicId ? Number(topicId) : undefined,
        pastYear: pastYear ?? undefined,
        mode: isMock ? 'mock' : 'practice',
        status: 'active',
        totalQuestions,
        timeLimitMinutes,
        currentDifficulty: 1,
        correctStreak: 0,
        startedAt: new Date().toISOString(),
        score: 0,
        maxScore: 0,
        answers: [],
        askedQuestionIds: [first.id],
      } as unknown as RequiredDataFromCollectionSlug<'quiz-sessions'>,
    })

    return NextResponse.json({
      sessionId: session.id,
      firstQuestion: sanitiseQuestion(firstFull as unknown as Record<string, unknown>),
      totalQuestions,
      currentQuestion: 1,
      mode: isMock ? 'mock' : 'practice',
      timeLimitMinutes,
    })
  } catch (err) {
    console.error('quiz/start error:', err)
    return NextResponse.json({ error: 'Server error. Please try again.' }, { status: 500 })
  }
}
