import { redirect, notFound } from 'next/navigation'
import { getAuthContext } from '@/lib/auth'
import { relName } from '@/lib/utils'
import { shuffle } from '@/lib/quiz'
import { ComprehensionRunner, type ComprehensionQuestion } from './ComprehensionRunner'

export const dynamic = 'force-dynamic'

/**
 * A single comprehension passage: shows the passage text and its linked MCQs.
 * Only safe fields reach the client (no correctAnswer / explanation) — grading
 * happens server-side via POST /api/comprehension/grade.
 */
export default async function ComprehensionPassagePage({
  params,
}: {
  params: Promise<{ examId: string; passageId: string }>
}) {
  const { examId, passageId } = await params

  const { payload, user } = await getAuthContext()
  if (!user) redirect(`/login?redirect=/comprehension/${examId}/${passageId}`)

  const passage = await payload.findByID({ collection: 'passages', id: passageId, depth: 1 }).catch(() => null)
  if (!passage || (passage as { status?: string }).status !== 'published') notFound()
  const p = passage as { title?: string; instructions?: string; passage?: string; subject?: unknown; year?: number }

  // Confirm the passage belongs to this exam (defends against mismatched URLs).
  const pExam = (passage as { exam?: { id?: number } | number }).exam
  const pExamId = typeof pExam === 'object' && pExam ? pExam.id : pExam
  if (String(pExamId) !== String(examId)) notFound()

  const res = await payload
    .find({
      collection: 'questions',
      where: {
        and: [
          { passage: { equals: passageId } },
          { status: { equals: 'published' } },
          { questionType: { equals: 'mcq' } },
        ],
      },
      limit: 100,
      depth: 1,
      overrideAccess: true,
    })
    .catch(() => ({ docs: [] as Array<Record<string, unknown>> }))

  if (res.docs.length === 0) notFound()

  const questions: ComprehensionQuestion[] = res.docs.map((q) => ({
    id: q.id as number,
    questionText: String(q.questionText ?? ''),
    // Options are shuffled per render so position doesn't leak the answer.
    options: shuffle(((q.options as Array<{ text?: string }>) ?? []).map((o) => String(o.text ?? ''))),
    questionImageUrl: (q.questionImage as { url?: string } | null)?.url ?? null,
  }))

  return (
    <ComprehensionRunner
      examId={examId}
      passageId={passageId}
      title={p.title ?? 'Comprehension'}
      instructions={p.instructions ?? null}
      passageText={p.passage ?? ''}
      subject={relName(p.subject)}
      year={typeof p.year === 'number' ? p.year : null}
      questions={questions}
    />
  )
}
