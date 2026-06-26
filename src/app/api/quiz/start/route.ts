import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import type { RequiredDataFromCollectionSlug, Where } from 'payload'
import configPromise from '@payload-config'
import { shuffle, sanitiseQuestion } from '@/lib/quiz'

const SESSION_QUESTIONS = 10

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
    const { examId, subjectId } = body as { examId?: number | string; subjectId?: number | string }
    if (!examId) return NextResponse.json({ error: 'examId is required.' }, { status: 400 })

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
      ...(subjectId ? [{ subject: { equals: subjectId } } as Where] : []),
    ]

    const pool = await payload.find({ collection: 'questions', where: { and: baseClauses }, limit: 200, depth: 0 })
    if (pool.docs.length === 0) {
      return NextResponse.json({ error: 'No questions available for this exam yet. Please check back soon.' }, { status: 503 })
    }

    const totalQuestions = Math.min(pool.docs.length, SESSION_QUESTIONS)
    const easy = pool.docs.filter((q) => String(q.difficulty) === '1')
    const first = shuffle(easy.length ? easy : pool.docs)[0]!

    const session = await payload.create({
      collection: 'quiz-sessions',
      data: {
        user: user.id,
        exam: String(examId),
        subject: subjectId ? Number(subjectId) : undefined,
        mode: 'practice',
        status: 'active',
        totalQuestions,
        timeLimitMinutes: 0,
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
      firstQuestion: sanitiseQuestion(first as unknown as Record<string, unknown>),
      totalQuestions,
      currentQuestion: 1,
    })
  } catch (err) {
    console.error('quiz/start error:', err)
    return NextResponse.json({ error: 'Server error. Please try again.' }, { status: 500 })
  }
}
