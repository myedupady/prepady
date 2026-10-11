import { cookies } from 'next/headers'
import { redirect, notFound } from 'next/navigation'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { relName } from '@/lib/utils'
import { QuizRunner } from './QuizRunner'
import { SubjectPicker, type SubjectGroup } from './SubjectPicker'

export const dynamic = 'force-dynamic'

export default async function ExamQuizPage({
  params,
  searchParams,
}: {
  params: Promise<{ examId: string }>
  searchParams: Promise<{ subject?: string; topic?: string; all?: string; mock?: string }>
}) {
  const { examId } = await params
  const sp = await searchParams
  const isMock = sp.mock === '1'

  // Gate: must be logged in.
  const token = (await cookies()).get('payload-token')?.value
  let authed = false
  if (token) {
    try {
      const decoded = JSON.parse(Buffer.from(token.split('.')[1]!, 'base64url').toString()) as { id?: number; exp?: number }
      authed = !!decoded.id && (!decoded.exp || decoded.exp > Date.now() / 1000)
    } catch {
      /* malformed */
    }
  }
  if (!authed) redirect(`/login?redirect=/quiz/${examId}`)

  const payload = await getPayload({ config: configPromise })
  const exam = await payload.findByID({ collection: 'exams', id: examId, depth: 0 }).catch(() => null)
  if (!exam) notFound()
  const e = exam as { code?: string; name?: string; country?: string }
  const examName = e.code ?? 'Exam'

  // ── Run a session when a subject/topic, "all", or mock is chosen ───────────
  if (sp.subject || sp.all || isMock) {
    let subjectName: string | null = null
    let topicName: string | null = null
    if (sp.subject) {
      const subj = await payload.findByID({ collection: 'subjects', id: sp.subject, depth: 0 }).catch(() => null)
      subjectName = (subj as { name?: string } | null)?.name ?? null
    }
    if (sp.topic) {
      const top = await payload.findByID({ collection: 'topics', id: sp.topic, depth: 0 }).catch(() => null)
      topicName = (top as { name?: string } | null)?.name ?? null
    }
    const label = isMock ? 'Timed mock' : topicName || subjectName || 'All subjects'
    return (
      <QuizRunner
        examId={examId}
        examName={examName}
        country={e.country ?? ''}
        subjectId={isMock ? null : sp.subject ?? null}
        topicId={isMock ? null : sp.topic ?? null}
        label={label}
        mode={isMock ? 'mock' : 'practice'}
      />
    )
  }

  // ── Otherwise show the subject/topic picker ────────────────────────────────
  const [mcqRes, theoryRes] = await Promise.all([
    payload
      .find({
        collection: 'questions',
        where: { and: [{ exam: { equals: examId } }, { status: { equals: 'published' } }, { questionType: { equals: 'mcq' } }] },
        limit: 2000,
        depth: 1,
        overrideAccess: true,
      })
      .catch(() => ({ docs: [] as Array<Record<string, unknown>> })),
    payload
      .count({
        collection: 'questions',
        where: { and: [{ exam: { equals: examId } }, { status: { equals: 'published' } }, { questionType: { equals: 'theory' } }] },
        overrideAccess: true,
      })
      .catch(() => ({ totalDocs: 0 })),
  ])

  // Aggregate by subject → topic.
  const bySubject = new Map<number, SubjectGroup>()
  for (const q of mcqRes.docs) {
    const subj = q.subject as { id?: number } | number | null
    const subjId = typeof subj === 'object' && subj ? subj.id : typeof subj === 'number' ? subj : undefined
    if (!subjId) continue
    const subjName = relName(q.subject) ?? `Subject ${subjId}`
    let group = bySubject.get(subjId)
    if (!group) {
      group = { id: subjId, name: subjName, count: 0, topics: [] }
      bySubject.set(subjId, group)
    }
    group.count++

    const topic = q.topicRef as { id?: number } | number | null
    const topicId = typeof topic === 'object' && topic ? topic.id : typeof topic === 'number' ? topic : undefined
    if (topicId) {
      const topicName = relName(q.topicRef) ?? `Topic ${topicId}`
      let t = group.topics.find((x) => x.id === topicId)
      if (!t) {
        t = { id: topicId, name: topicName, count: 0 }
        group.topics.push(t)
      }
      t.count++
    }
  }

  const subjects = [...bySubject.values()].sort((a, b) => a.name.localeCompare(b.name))
  for (const s of subjects) s.topics.sort((a, b) => a.name.localeCompare(b.name))

  return (
    <SubjectPicker
      examId={examId}
      examName={examName}
      country={e.country ?? ''}
      subjects={subjects}
      theoryCount={(theoryRes as { totalDocs?: number }).totalDocs ?? 0}
    />
  )
}
