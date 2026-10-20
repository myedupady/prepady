import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { isCorrectAnswer } from '@/lib/quiz'

/**
 * POST /api/comprehension/grade
 * Body: { passageId, answers: [{ questionId, givenAnswer }] }
 * Grades a comprehension passage's MCQs in one batch and returns each question's
 * correct answer + explanation plus the overall score. Requires login.
 */
export async function POST(req: NextRequest) {
  try {
    const payload = await getPayload({ config: configPromise })
    const { user } = await payload.auth({ headers: req.headers })
    if (!user) return NextResponse.json({ error: 'You must be logged in.' }, { status: 401 })

    const body = await req.json().catch(() => ({}))
    const { passageId, answers } = body as {
      passageId?: number | string
      answers?: Array<{ questionId?: number | string; givenAnswer?: string }>
    }
    if (!passageId || !Array.isArray(answers)) {
      return NextResponse.json({ error: 'passageId and answers are required.' }, { status: 400 })
    }

    // Load the passage's published MCQs (source of truth — never trust the client
    // for correct answers or which questions belong to the passage).
    const qRes = await payload.find({
      collection: 'questions',
      where: {
        and: [
          { passage: { equals: passageId } },
          { status: { equals: 'published' } },
          { questionType: { equals: 'mcq' } },
        ],
      },
      limit: 100,
      depth: 0,
      overrideAccess: true,
    })
    if (qRes.docs.length === 0) {
      return NextResponse.json({ error: 'No questions found for this passage.' }, { status: 404 })
    }

    const givenById = new Map<string, string>()
    for (const a of answers) {
      if (a.questionId != null) givenById.set(String(a.questionId), String(a.givenAnswer ?? ''))
    }

    let score = 0
    const results = qRes.docs.map((q) => {
      const correctAnswer = String(q.correctAnswer ?? '')
      const given = givenById.get(String(q.id)) ?? ''
      const isCorrect = given !== '' && isCorrectAnswer(given, correctAnswer)
      if (isCorrect) score++
      return {
        id: q.id as number,
        correctAnswer,
        explanation: (q.explanation as string) ?? null,
        isCorrect,
      }
    })

    const total = results.length
    return NextResponse.json({
      results,
      score,
      total,
      percentage: total > 0 ? Math.round((score / total) * 100) : 0,
    })
  } catch (err) {
    console.error('comprehension/grade error:', err)
    return NextResponse.json({ error: 'Server error. Please try again.' }, { status: 500 })
  }
}
