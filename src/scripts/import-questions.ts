/**
 * Bulk-import questions from a CSV or JSON file (Tier A ingestion).
 *
 *   pnpm import:questions -- path/to/questions.csv
 *   pnpm import:questions -- path/to/questions.json --dry-run
 *   pnpm import:questions -- path/to/questions.csv --publish      # publish instead of draft
 *
 * - CSV/JSON columns: see src/lib/import/questions.ts (and templates/questions-template.csv).
 * - Exams must already exist (fixed catalogue); subjects and topics are created on demand.
 * - Idempotent: rows are matched on `source_ref` (preferred) or exam + question text,
 *   and updated rather than duplicated.
 * - Imported as draft unless the row says `published` or --publish is passed.
 * - Diagrams: the `image` column is reported but NOT auto-attached — attach in /admin.
 */
import fs from 'fs'
import path from 'path'
import { getPayload } from 'payload'
import type { Where, RequiredDataFromCollectionSlug } from 'payload'
import configPromise from '@payload-config'
import { csvToObjects } from '@/lib/csv'
import { parseQuestionRow, type ParsedQuestionRow } from '@/lib/import/questions'

function parseArgs(argv: string[]): { file?: string; dryRun: boolean; publish: boolean } {
  let file: string | undefined
  let dryRun = false
  let publish = false
  for (const t of argv) {
    if (t === '--dry-run') dryRun = true
    else if (t === '--publish') publish = true
    else if (!t.startsWith('--')) file = t
  }
  return { file, dryRun, publish }
}

function normaliseRow(obj: Record<string, unknown>): Record<string, string> {
  const out: Record<string, string> = {}
  for (const [k, v] of Object.entries(obj)) {
    out[k.trim().toLowerCase()] = v == null ? '' : String(v)
  }
  return out
}

async function run() {
  const { file, dryRun, publish } = parseArgs(process.argv.slice(2))
  if (!file) {
    console.error('Usage: pnpm import:questions -- <file.csv|file.json> [--dry-run] [--publish]')
    process.exit(1)
  }
  const abs = path.resolve(file)
  if (!fs.existsSync(abs)) {
    console.error(`✗ File not found: ${abs}`)
    process.exit(1)
  }

  const raw = fs.readFileSync(abs, 'utf8')
  let rows: Record<string, string>[]
  if (abs.toLowerCase().endsWith('.json')) {
    const data = JSON.parse(raw)
    if (!Array.isArray(data)) {
      console.error('✗ JSON must be an array of row objects.')
      process.exit(1)
    }
    rows = data.map(normaliseRow)
  } else {
    rows = csvToObjects(raw)
  }
  console.log(`Read ${rows.length} row(s) from ${path.basename(abs)}.`)

  // ── Validate all rows first ─────────────────────────────────────────────────
  const valid: ParsedQuestionRow[] = []
  let invalid = 0
  rows.forEach((row, i) => {
    const { parsed, errors } = parseQuestionRow(row)
    if (parsed) valid.push(parsed)
    else {
      invalid++
      console.error(`  ✗ Row ${i + 2}: ${errors.join('; ')}`) // +2: header row + 1-indexing
    }
  })
  console.log(`\n${valid.length} valid, ${invalid} invalid.`)
  if (valid.some((v) => v.image)) {
    console.log('  ℹ Some rows reference an image — diagrams are not auto-attached; add them in /admin after import.')
  }

  if (dryRun) {
    console.log('\n--dry-run: nothing written. ✅')
    process.exit(invalid > 0 ? 1 : 0)
  }
  if (valid.length === 0) {
    console.log('Nothing to import.')
    process.exit(invalid > 0 ? 1 : 0)
  }

  const payload = await getPayload({ config: configPromise })

  // Resolution caches.
  const examByCode = new Map<string, number | null>()
  const subjectByName = new Map<string, number>()
  const topicByKey = new Map<string, number>()

  async function resolveExam(code: string): Promise<number | null> {
    if (examByCode.has(code)) return examByCode.get(code)!
    const res = await payload.find({ collection: 'exams', where: { code: { equals: code } }, limit: 1, depth: 0 })
    const id = (res.docs[0]?.id as number) ?? null
    examByCode.set(code, id)
    return id
  }
  async function resolveSubject(name: string): Promise<number> {
    if (subjectByName.has(name)) return subjectByName.get(name)!
    const res = await payload.find({ collection: 'subjects', where: { name: { equals: name } }, limit: 1, depth: 0 })
    let id = res.docs[0]?.id as number | undefined
    if (!id)
      id = (
        await payload.create({
          collection: 'subjects',
          data: { name } as unknown as RequiredDataFromCollectionSlug<'subjects'>,
        })
      ).id as number
    subjectByName.set(name, id)
    return id
  }
  async function resolveTopic(subjectId: number, name: string): Promise<number> {
    const key = `${subjectId}|${name}`
    if (topicByKey.has(key)) return topicByKey.get(key)!
    const res = await payload.find({
      collection: 'topics',
      where: { and: [{ name: { equals: name } }, { subject: { equals: subjectId } }] },
      limit: 1,
      depth: 0,
    })
    let id = res.docs[0]?.id as number | undefined
    if (!id) id = (await payload.create({ collection: 'topics', data: { name, subject: subjectId } })).id as number
    topicByKey.set(key, id)
    return id
  }

  let created = 0
  let updated = 0
  let skipped = 0

  for (const [i, v] of valid.entries()) {
    const examId = await resolveExam(v.examCode)
    if (!examId) {
      skipped++
      console.error(`  ✗ Row ${i + 2}: unknown exam code "${v.examCode}" (create the exam in /admin first).`)
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
      ...(v.type === 'mcq'
        ? { options: v.options.map((t) => ({ text: t })), correctAnswer: v.correctAnswer }
        : { markingScheme: v.markingScheme }),
      ...(v.explanation ? { explanation: v.explanation } : {}),
      ...(v.videoSolutionUrl ? { videoSolutionUrl: v.videoSolutionUrl } : {}),
      ...(v.sourceRef ? { sourceRef: v.sourceRef } : {}),
    }

    // Idempotent match: source_ref preferred, else exam + exact question text.
    const where: Where = v.sourceRef
      ? { sourceRef: { equals: v.sourceRef } }
      : { and: [{ exam: { equals: examId } }, { questionText: { equals: v.questionText } }] }
    const existing = await payload.find({ collection: 'questions', where, limit: 1, depth: 0 })

    const questionData = data as unknown as RequiredDataFromCollectionSlug<'questions'>
    if (existing.docs[0]) {
      await payload.update({ collection: 'questions', id: existing.docs[0].id, data: questionData })
      updated++
    } else {
      await payload.create({ collection: 'questions', data: questionData })
      created++
    }
  }

  console.log(`\nDone. ${created} created, ${updated} updated, ${skipped} skipped. ✅`)
  console.log(publish ? 'Imported as PUBLISHED — AI explanations will auto-generate for MCQs without one.' : 'Imported as DRAFT — review and publish in /admin.')
  process.exit(skipped > 0 || invalid > 0 ? 1 : 0)
}

run().catch((err) => {
  console.error('import:questions failed:', err)
  process.exit(1)
})
