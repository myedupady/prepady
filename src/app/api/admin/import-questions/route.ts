import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import type { Where, RequiredDataFromCollectionSlug } from 'payload'
import configPromise from '@payload-config'
import { csvToObjects } from '@/lib/csv'
import { parseQuestionRow } from '@/lib/import/questions'

/**
 * POST /api/admin/import-questions
 * Body: { csv: string, publish?: boolean }
 * In-admin bulk import of questions year-by-year. Admin/editor only. Idempotent
 * (matches on source_ref, else exam + question text). Mirrors the CLI importer.
 */
export async function POST(req: NextRequest) {
  try {
    const payload = await getPayload({ config: configPromise })
    const { user } = await payload.auth({ headers: req.headers })
    if (!user || (user.role !== 'admin' && user.role !== 'editor')) {
      return NextResponse.json({ error: 'Admins only.' }, { status: 403 })
    }

    const body = await req.json().catch(() => ({}))
    const csv = String((body as { csv?: string }).csv ?? '').trim()
    const publish = !!(body as { publish?: boolean }).publish
    if (!csv) return NextResponse.json({ error: 'Paste or upload a CSV first.' }, { status: 400 })

    let rows: Record<string, string>[]
    try {
      rows = csvToObjects(csv)
    } catch (e) {
      return NextResponse.json({ error: `Could not parse the CSV: ${(e as Error).message}` }, { status: 400 })
    }
    if (rows.length === 0) return NextResponse.json({ error: 'No data rows found in the CSV.' }, { status: 400 })
    if (rows.length > 2000) return NextResponse.json({ error: 'Please import at most 2000 rows at a time.' }, { status: 400 })

    // Validate all rows first; report row-level errors.
    const valid: ReturnType<typeof parseQuestionRow>['parsed'][] = []
    const errors: string[] = []
    rows.forEach((row, i) => {
      const { parsed, errors: rowErrors } = parseQuestionRow(row)
      if (parsed) valid.push(parsed)
      else errors.push(`Row ${i + 2}: ${rowErrors.join('; ')}`)
    })

    // Resolution caches.
    const examByCode = new Map<string, number | null>()
    const subjectByName = new Map<string, number>()
    const topicByKey = new Map<string, number>()
    const resolveExam = async (code: string) => {
      if (examByCode.has(code)) return examByCode.get(code)!
      const res = await payload.find({ collection: 'exams', where: { code: { equals: code } }, limit: 1, depth: 0, overrideAccess: true })
      const id = (res.docs[0]?.id as number) ?? null
      examByCode.set(code, id)
      return id
    }
    const resolveSubject = async (name: string) => {
      if (subjectByName.has(name)) return subjectByName.get(name)!
      const res = await payload.find({ collection: 'subjects', where: { name: { equals: name } }, limit: 1, depth: 0, overrideAccess: true })
      let id = res.docs[0]?.id as number | undefined
      if (!id) id = (await payload.create({ collection: 'subjects', data: { name } as unknown as RequiredDataFromCollectionSlug<'subjects'>, overrideAccess: true })).id as number
      subjectByName.set(name, id)
      return id
    }
    const resolveTopic = async (subjectId: number, name: string) => {
      const key = `${subjectId}|${name}`
      if (topicByKey.has(key)) return topicByKey.get(key)!
      const res = await payload.find({ collection: 'topics', where: { and: [{ name: { equals: name } }, { subject: { equals: subjectId } }] }, limit: 1, depth: 0, overrideAccess: true })
      let id = res.docs[0]?.id as number | undefined
      if (!id) id = (await payload.create({ collection: 'topics', data: { name, subject: subjectId }, overrideAccess: true })).id as number
      topicByKey.set(key, id)
      return id
    }

    let created = 0
    let updated = 0
    let skipped = 0
    for (const [i, v] of valid.entries()) {
      if (!v) continue
      const examId = await resolveExam(v.examCode)
      if (!examId) {
        skipped++
        errors.push(`Row ${i + 2}: unknown exam code "${v.examCode}" (create the exam first).`)
        continue
      }
      const subjectId = await resolveSubject(v.subjectName)
      const topicId = await resolveTopic(subjectId, v.topicName)

      const data: Record<string, unknown> = {
        exam: examId,
        subject: subjectId,
        topicRef: topicId,
        topic: v.topicName,
        difficulty: v.difficulty,
        questionType: v.type,
        status: publish ? 'published' : v.status,
        questionText: v.questionText,
        maxMarks: v.maxMarks,
        ...(v.year ? { year: v.year } : {}),
        ...(v.variant ? { variant: v.variant } : {}),
        ...(v.type === 'mcq'
          ? { options: v.options.map((t) => ({ text: t })), correctAnswer: v.correctAnswer }
          : { markingScheme: v.markingScheme }),
        ...(v.explanation ? { explanation: v.explanation } : {}),
        ...(v.videoSolutionUrl ? { videoSolutionUrl: v.videoSolutionUrl } : {}),
        ...(v.sourceRef ? { sourceRef: v.sourceRef } : {}),
      }
      const where: Where = v.sourceRef
        ? { sourceRef: { equals: v.sourceRef } }
        : { and: [{ exam: { equals: examId } }, { questionText: { equals: v.questionText } }] }
      const existing = await payload.find({ collection: 'questions', where, limit: 1, depth: 0, overrideAccess: true })
      const questionData = data as unknown as RequiredDataFromCollectionSlug<'questions'>
      if (existing.docs[0]) {
        await payload.update({ collection: 'questions', id: existing.docs[0].id, data: questionData, overrideAccess: true })
        updated++
      } else {
        await payload.create({ collection: 'questions', data: questionData, overrideAccess: true })
        created++
      }
    }

    return NextResponse.json({
      ok: true,
      total: rows.length,
      created,
      updated,
      skipped,
      invalid: rows.length - valid.filter(Boolean).length,
      errors: errors.slice(0, 50),
      imagesNote: valid.some((v) => v?.image) ? 'Some rows reference an image — attach diagrams in the admin after import.' : null,
    })
  } catch (err) {
    console.error('import-questions error:', err)
    return NextResponse.json({ error: 'Server error during import. Please try again.' }, { status: 500 })
  }
}
