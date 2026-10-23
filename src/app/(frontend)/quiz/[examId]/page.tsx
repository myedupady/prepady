import { redirect, notFound } from 'next/navigation'
import { relName } from '@/lib/utils'
import { getAuthContext } from '@/lib/auth'
import { QuizRunner } from './QuizRunner'
import { SubjectPicker, type SubjectGroup } from './SubjectPicker'
import { PastYearPicker, type YearSubject } from './PastYearPicker'

export const dynamic = 'force-dynamic'

export default async function ExamQuizPage({
  params,
  searchParams,
}: {
  params: Promise<{ examId: string }>
  searchParams: Promise<{ subject?: string; topic?: string; all?: string; mock?: string; year?: string; type?: string }>
}) {
  const { examId } = await params
  const sp = await searchParams
  const isMock = sp.mock === '1'
  const pastYear = sp.year && /^\d{4}$/.test(sp.year) ? sp.year : null
  const paperType = sp.type && /^[A-F]$/.test(sp.type) ? sp.type : null

  // Gate: must be logged in (strict — same check the API routes use).
  const { payload, user } = await getAuthContext()
  if (!user) redirect(`/login?redirect=/quiz/${examId}`)

  const exam = await payload.findByID({ collection: 'exams', id: examId, depth: 0 }).catch(() => null)
  if (!exam) notFound()
  const e = exam as { code?: string; name?: string; country?: string }
  const examName = e.code ?? 'Exam'
  const u = user as { name?: string; referralCode?: string }
  const userName = u.name ?? null
  const shareCode = u.referralCode ?? null

  // ── Past-questions (by year) ──────────────────────────────────────────────
  // Exam → Year → Subject: a year alone shows its subjects so each paper is
  // attempted on its own. A subject (or explicit "all") starts the session.
  if (pastYear) {
    if (sp.subject || sp.all) {
      let subjectName: string | null = null
      if (sp.subject) {
        const subj = await payload.findByID({ collection: 'subjects', id: sp.subject, depth: 0 }).catch(() => null)
        subjectName = (subj as { name?: string } | null)?.name ?? null
      }
      return (
        <QuizRunner
          examId={examId}
          examName={examName}
          country={e.country ?? ''}
          subjectId={sp.all ? null : sp.subject ?? null}
          topicId={null}
          year={pastYear}
          variant={paperType}
          userName={userName}
          shareCode={shareCode}
          label={`Past questions · ${pastYear}${subjectName ? ` · ${subjectName}` : sp.all ? ' · All subjects' : ''}${paperType ? ` · Type ${paperType}` : ''}`}
        />
      )
    }

    // Choose a subject for this year.
    const yrRes = await payload
      .find({
        collection: 'questions',
        where: {
          and: [
            { exam: { equals: examId } },
            { status: { equals: 'published' } },
            { questionType: { equals: 'mcq' } },
            { passage: { exists: false } },
            { year: { equals: Number(pastYear) } },
          ],
        },
        limit: 2000,
        depth: 1,
        overrideAccess: true,
      })
      .catch(() => ({ docs: [] as Array<Record<string, unknown>> }))

    // Distinct JAMB paper types present for this year (e.g. A, B). When types
    // exist the student picks one first (default A) so option orders don't mix.
    const variants = [...new Set(yrRes.docs.map((q) => String(q.variant ?? '')).filter(Boolean))].sort()
    const selectedType = paperType ?? (variants.length ? variants[0] : null)

    const bySubj = new Map<number, YearSubject>()
    for (const q of yrRes.docs) {
      if (selectedType && String(q.variant ?? '') !== selectedType) continue
      const subj = q.subject as { id?: number } | number | null
      const subjId = typeof subj === 'object' && subj ? subj.id : typeof subj === 'number' ? subj : undefined
      if (!subjId) continue
      const name = relName(q.subject) ?? `Subject ${subjId}`
      const g = bySubj.get(subjId) ?? { id: subjId, name, count: 0 }
      g.count++
      bySubj.set(subjId, g)
    }
    const yearSubjects = [...bySubj.values()].sort((a, b) => a.name.localeCompare(b.name))

    return (
      <PastYearPicker
        examId={examId}
        examName={examName}
        country={e.country ?? ''}
        year={Number(pastYear)}
        subjects={yearSubjects}
        totalCount={yearSubjects.reduce((n, s) => n + s.count, 0)}
        variants={variants}
        selectedType={selectedType}
      />
    )
  }

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
        userName={userName}
        shareCode={shareCode}
      />
    )
  }

  // ── Otherwise show the subject/topic picker ────────────────────────────────
  const [mcqRes, theoryRes, passagesRes] = await Promise.all([
    payload
      .find({
        collection: 'questions',
        where: {
          and: [
            { exam: { equals: examId } },
            { status: { equals: 'published' } },
            { questionType: { equals: 'mcq' } },
            { passage: { exists: false } }, // comprehension questions live in their own flow
          ],
        },
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
    payload
      .count({
        collection: 'passages',
        where: { and: [{ exam: { equals: examId } }, { status: { equals: 'published' } }] },
        overrideAccess: true,
      })
      .catch(() => ({ totalDocs: 0 })),
  ])

  // Aggregate by subject → topic (simulated questions only), and collect the
  // distinct years available as past-question papers.
  const bySubject = new Map<number, SubjectGroup>()
  const yearMap = new Map<number, number>()
  for (const q of mcqRes.docs) {
    const qYear = typeof q.year === 'number' ? q.year : null
    if (qYear) {
      yearMap.set(qYear, (yearMap.get(qYear) ?? 0) + 1)
      continue // past question → shown under "Past questions", not practice
    }
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
  const years = [...yearMap.entries()].map(([year, count]) => ({ year, count })).sort((a, b) => b.year - a.year)

  return (
    <SubjectPicker
      examId={examId}
      examName={examName}
      country={e.country ?? ''}
      subjects={subjects}
      years={years}
      theoryCount={(theoryRes as { totalDocs?: number }).totalDocs ?? 0}
      passagesCount={(passagesRes as { totalDocs?: number }).totalDocs ?? 0}
    />
  )
}
