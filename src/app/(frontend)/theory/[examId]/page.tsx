import { cookies } from 'next/headers'
import { redirect, notFound } from 'next/navigation'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { isPremium } from '@/lib/quiz'
import { relName } from '@/lib/utils'
import { TheoryRunner, type TheoryQuestion } from './TheoryRunner'

export const dynamic = 'force-dynamic'

/**
 * Theory / essay practice for an exam. Loads published theory questions
 * server-side and passes only the safe fields to the client (never the marking
 * scheme). Marking happens via POST /api/ai/mark, which is premium-gated.
 */
export default async function TheoryPracticePage({ params }: { params: Promise<{ examId: string }> }) {
  const { examId } = await params

  const token = (await cookies()).get('payload-token')?.value
  let userId: number | null = null
  if (token) {
    try {
      const decoded = JSON.parse(Buffer.from(token.split('.')[1]!, 'base64url').toString()) as { id?: number; exp?: number }
      if (decoded.id && (!decoded.exp || decoded.exp > Date.now() / 1000)) userId = decoded.id
    } catch {
      /* malformed */
    }
  }
  if (!userId) redirect(`/login?redirect=/theory/${examId}`)

  const payload = await getPayload({ config: configPromise })
  const exam = await payload.findByID({ collection: 'exams', id: examId, depth: 0 }).catch(() => null)
  if (!exam) notFound()
  const e = exam as { code?: string; name?: string; country?: string }

  const user = await payload.findByID({ collection: 'users', id: userId, overrideAccess: true }).catch(() => null)
  if (!user) redirect(`/login?redirect=/theory/${examId}`)
  const premium = isPremium(user as { plan?: string; subscriptionExpiresAt?: string })

  const res = await payload
    .find({
      collection: 'questions',
      where: {
        and: [
          { exam: { equals: examId } },
          { status: { equals: 'published' } },
          { questionType: { equals: 'theory' } },
        ],
      },
      limit: 100,
      depth: 1,
      overrideAccess: true,
    })
    .catch(() => ({ docs: [] as Array<Record<string, unknown>> }))

  // Only safe fields reach the client — no markingScheme.
  const questions: TheoryQuestion[] = res.docs.map((q) => ({
    id: q.id as number,
    questionText: String(q.questionText ?? ''),
    topic: relName(q.topicRef) ?? ((q.topic as string) ?? null),
    maxMarks: Number(q.maxMarks) || 1,
  }))

  return (
    <TheoryRunner
      examId={examId}
      examName={e.code ?? 'Exam'}
      country={e.country ?? ''}
      premium={premium}
      questions={questions}
    />
  )
}
