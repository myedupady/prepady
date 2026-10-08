import type { CollectionAfterChangeHook } from 'payload'
import { generateExplanation, getControls, isAIConfigured } from '@/lib/ai'

/**
 * After a question is saved: if it's a published MCQ with no explanation yet,
 * generate one and store it — so every student thereafter sees it for free.
 *
 * Runs fire-and-forget (not awaited) so the admin's Save returns immediately;
 * the explanation appears on the next load. A context flag prevents the write-back
 * from re-triggering this hook.
 */
export const generateExplanationOnPublish: CollectionAfterChangeHook = ({ doc, req, context }) => {
  // Guard: don't recurse on our own write-back.
  if (context?.triggeredByAIGen) return doc

  const status = doc?.status
  const questionType = doc?.questionType
  const hasExplanation = typeof doc?.explanation === 'string' && doc.explanation.trim().length > 0
  const correctAnswer = typeof doc?.correctAnswer === 'string' ? doc.correctAnswer : ''

  // Only published MCQs that lack an explanation and have a correct answer.
  if (status !== 'published' || questionType !== 'mcq' || hasExplanation || !correctAnswer) {
    return doc
  }
  if (!isAIConfigured()) return doc

  const payload = req.payload
  const questionId = doc.id

  void (async () => {
    try {
      const controls = await getControls(payload)
      if (!controls.autoGenerateExplanations || controls.paused) return

      // Resolve human-readable exam/subject/topic labels (relationships are IDs here).
      const [exam, subject, topic] = await Promise.all([
        payload.findByID({ collection: 'exams', id: doc.exam, depth: 0 }).catch(() => null),
        payload.findByID({ collection: 'subjects', id: doc.subject, depth: 0 }).catch(() => null),
        doc.topicRef ? payload.findByID({ collection: 'topics', id: doc.topicRef, depth: 0 }).catch(() => null) : null,
      ])
      const topicName = (topic as { name?: string } | null)?.name ?? (typeof doc.topic === 'string' ? doc.topic : null)

      const options = Array.isArray(doc.options)
        ? (doc.options as Array<{ text?: string }>).map((o) => o.text ?? '').filter(Boolean)
        : []

      const { text, model } = await generateExplanation(
        payload,
        {
          exam: (exam as { code?: string; name?: string } | null)?.code ?? 'this exam',
          subject: (subject as { name?: string } | null)?.name ?? null,
          topic: topicName,
          questionText: String(doc.questionText ?? ''),
          options,
          correctAnswer,
        },
        { meterKind: 'autogen' },
      )

      if (!text) return
      await payload.update({
        collection: 'questions',
        id: questionId,
        overrideAccess: true,
        context: { triggeredByAIGen: true },
        data: { explanation: text, explanationGeneratedBy: `ai:${model}` },
      })
      payload.logger?.info?.(`[ai] auto-generated explanation for question ${questionId} (${model})`)
    } catch (err) {
      payload.logger?.warn?.(`[ai] auto-generate explanation failed for question ${questionId}: ${String(err)}`)
    }
  })()

  return doc
}
