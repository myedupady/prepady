import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import type { RequiredDataFromCollectionSlug, Where } from 'payload'
import configPromise from '@payload-config'
import { shuffle, sanitiseQuestion, updateDifficulty, isCorrectAnswer, type Difficulty } from '@/lib/quiz'
import { relName } from '@/lib/utils'

/**
 * POST /api/quiz/answer  Body: { sessionId, questionId, givenAnswer }
 * Grades the answer, advances adaptive difficulty, returns the next question
 * (or completes the session) plus running stats.
 */
export async function POST(req: NextRequest) {
  try {
    const payload = await getPayload({ config: configPromise })
    const { user } = await payload.auth({ headers: req.headers })
    if (!user) return NextResponse.json({ error: 'Unauthorised.' }, { status: 401 })

    const body = await req.json().catch(() => ({}))
    const { sessionId, questionId, givenAnswer } = body as {
      sessionId?: string
      questionId?: string
      givenAnswer?: string
    }
    if (!sessionId || !questionId || givenAnswer === undefined) {
      return NextResponse.json({ error: 'sessionId, questionId and givenAnswer are required.' }, { status: 400 })
    }

    const session = await payload.findByID({ collection: 'quiz-sessions', id: sessionId }).catch(() => null)
    if (!session) return NextResponse.json({ error: 'Session not found.' }, { status: 404 })
    if (String((session.user as { id?: unknown })?.id ?? session.user) !== String(user.id)) {
      return NextResponse.json({ error: 'Forbidden.' }, { status: 403 })
    }
    if (session.status !== 'active') {
      return NextResponse.json({ error: 'This session is already complete.' }, { status: 409 })
    }

    const question = await payload.findByID({ collection: 'questions', id: questionId, depth: 1 }).catch(() => null)
    if (!question) return NextResponse.json({ error: 'Question not found.' }, { status: 404 })
    const subjectName = relName(question.subject)
    const topicName = relName(question.topicRef)
    const videoUrl = (question as { videoSolutionUrl?: string }).videoSolutionUrl || null

    const isCorrect = isCorrectAnswer(givenAnswer, String(question.correctAnswer ?? ''))
    const points = (question.maxMarks as number) ?? 1
    const earned = isCorrect ? points : 0

    const currentDiff = ((session.currentDifficulty as number) ?? 1) as Difficulty
    const { difficulty: newDiff, correctStreak: newStreak } = updateDifficulty(
      isCorrect,
      currentDiff,
      (session.correctStreak as number) ?? 0,
    )

    const existingAnswers = (session.answers as unknown[]) ?? []
    const answered = existingAnswers.length + 1
    const totalQuestions = (session.totalQuestions as number) ?? 10
    const newScore = ((session.score as number) ?? 0) + earned
    const newMax = ((session.maxScore as number) ?? 0) + points
    const asked: Array<number | string> = Array.isArray(session.askedQuestionIds)
      ? (session.askedQuestionIds as Array<number | string>)
      : []
    asked.push(questionId)

    const isComplete = answered >= totalQuestions
    let nextQuestion: ReturnType<typeof sanitiseQuestion> | null = null

    if (!isComplete) {
      const subjectClause: Where[] =
        session.subject != null
          ? [{ subject: { equals: (session.subject as { id?: number })?.id ?? session.subject } } as Where]
          : []
      const tryDiffs: Difficulty[] = [newDiff]
      if (newDiff > 1) tryDiffs.push((newDiff - 1) as Difficulty)
      if (newDiff < 3) tryDiffs.push((newDiff + 1) as Difficulty)

      for (const diff of tryDiffs) {
        const candidates = await payload.find({
          collection: 'questions',
          where: {
            and: [
              { exam: { equals: session.exam } },
              { status: { equals: 'published' } },
              { questionType: { equals: 'mcq' } },
              { difficulty: { equals: String(diff) } },
              ...subjectClause,
            ],
          },
          limit: 50,
        })
        const fresh = candidates.docs.filter((q) => !asked.includes(q.id))
        if (fresh.length) {
          const picked = shuffle(fresh)[0]!
          asked.push(picked.id)
          nextQuestion = sanitiseQuestion(picked as unknown as Record<string, unknown>)
          break
        }
      }
      // Fallback: any unasked MCQ for this exam.
      if (!nextQuestion) {
        const fallback = await payload.find({
          collection: 'questions',
          where: { and: [{ exam: { equals: session.exam } }, { status: { equals: 'published' } }, { questionType: { equals: 'mcq' } }] },
          limit: 100,
        })
        const fresh = fallback.docs.filter((q) => !asked.includes(q.id))
        if (fresh.length) {
          const picked = shuffle(fresh)[0]!
          asked.push(picked.id)
          nextQuestion = sanitiseQuestion(picked as unknown as Record<string, unknown>)
        }
      }
    }

    const done = isComplete || !nextQuestion
    await payload.update({
      collection: 'quiz-sessions',
      id: sessionId,
      data: {
        status: done ? 'completed' : 'active',
        currentDifficulty: newDiff,
        correctStreak: newStreak,
        score: newScore,
        maxScore: newMax,
        completedAt: done ? new Date().toISOString() : undefined,
        askedQuestionIds: asked,
        answers: [
          ...existingAnswers,
          {
            question: questionId,
            givenAnswer,
            isCorrect,
            pointsEarned: earned,
            subjectName,
            topicName,
            answeredAt: new Date().toISOString(),
          },
        ],
      } as unknown as RequiredDataFromCollectionSlug<'quiz-sessions'>,
    })

    return NextResponse.json({
      isCorrect,
      correctAnswer: question.correctAnswer,
      explanation: (question.explanation as string) ?? null,
      videoUrl,
      nextQuestion,
      isComplete: done,
      stats: {
        questionsAnswered: answered,
        totalQuestions,
        score: newScore,
        maxScore: newMax,
        percentage: newMax > 0 ? Math.round((newScore / newMax) * 100) : 0,
      },
    })
  } catch (err) {
    console.error('quiz/answer error:', err)
    return NextResponse.json({ error: 'Server error. Please try again.' }, { status: 500 })
  }
}
