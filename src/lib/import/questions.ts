/**
 * Pure validation + mapping of one import row (from CSV/JSON) into a normalised
 * question shape. No database access — the importer script resolves
 * exam/subject/topic names to IDs and performs the upsert. Unit-tested.
 *
 * Expected columns (headers, case-insensitive):
 *   type, exam, subject, topic, difficulty, year, question,
 *   optiona..optione, correct, marking_scheme, max_marks,
 *   explanation, video_url, image, status, source_ref
 */

export interface ParsedQuestionRow {
  type: 'mcq' | 'theory'
  examCode: string
  subjectName: string
  topicName: string
  difficulty: '1' | '2' | '3'
  year?: number
  questionText: string
  options: string[]
  correctAnswer?: string
  markingScheme?: string
  maxMarks: number
  explanation?: string
  videoSolutionUrl?: string
  image?: string
  status: 'draft' | 'published'
  sourceRef?: string
}

export interface RowResult {
  parsed?: ParsedQuestionRow
  errors: string[]
}

const DIFFICULTY_MAP: Record<string, '1' | '2' | '3'> = {
  '1': '1', '2': '2', '3': '3',
  easy: '1', medium: '2', hard: '3',
}

function get(row: Record<string, string>, key: string): string {
  return (row[key] ?? '').trim()
}

export function parseQuestionRow(row: Record<string, string>): RowResult {
  const errors: string[] = []

  const type = get(row, 'type').toLowerCase()
  if (type !== 'mcq' && type !== 'theory') errors.push(`type must be "mcq" or "theory" (got "${get(row, 'type')}")`)

  const examCode = get(row, 'exam')
  if (!examCode) errors.push('exam is required')

  const subjectName = get(row, 'subject')
  if (!subjectName) errors.push('subject is required')

  const topicName = get(row, 'topic')
  if (!topicName) errors.push('topic is required')

  const questionText = get(row, 'question')
  if (!questionText) errors.push('question is required')

  const rawDiff = get(row, 'difficulty').toLowerCase()
  const difficulty = DIFFICULTY_MAP[rawDiff] ?? (rawDiff ? undefined : '2')
  if (!difficulty) errors.push(`difficulty must be 1/2/3 or easy/medium/hard (got "${get(row, 'difficulty')}")`)

  const yearStr = get(row, 'year')
  let year: number | undefined
  if (yearStr) {
    const y = Number(yearStr)
    if (!Number.isInteger(y) || y < 1900 || y > 2100) errors.push(`year "${yearStr}" is not a valid year`)
    else year = y
  }

  const maxMarksStr = get(row, 'max_marks')
  let maxMarks = 1
  if (maxMarksStr) {
    const m = Number(maxMarksStr)
    if (!Number.isFinite(m) || m < 1) errors.push(`max_marks "${maxMarksStr}" must be a number >= 1`)
    else maxMarks = Math.round(m)
  }

  const statusRaw = get(row, 'status').toLowerCase()
  const status: 'draft' | 'published' = statusRaw === 'published' ? 'published' : 'draft'
  if (statusRaw && statusRaw !== 'published' && statusRaw !== 'draft') {
    errors.push(`status must be "draft" or "published" (got "${get(row, 'status')}")`)
  }

  // ── Type-specific ──────────────────────────────────────────────────────────
  const options: string[] = []
  let correctAnswer: string | undefined
  let markingScheme: string | undefined

  if (type === 'mcq') {
    for (const letter of ['a', 'b', 'c', 'd', 'e']) {
      const v = get(row, `option${letter}`)
      if (v) options.push(v)
    }
    if (options.length < 2) errors.push('MCQ needs at least 2 options (optionA, optionB, …)')

    const correctRaw = get(row, 'correct').toUpperCase()
    if (!correctRaw) {
      errors.push('MCQ needs a "correct" option letter (A–E)')
    } else if (!/^[A-E]$/.test(correctRaw)) {
      errors.push(`"correct" must be a single letter A–E (got "${get(row, 'correct')}")`)
    } else {
      const idx = correctRaw.charCodeAt(0) - 65
      if (idx >= options.length) errors.push(`"correct" is ${correctRaw} but there is no option ${correctRaw}`)
      else correctAnswer = options[idx]
    }
  } else if (type === 'theory') {
    markingScheme = get(row, 'marking_scheme')
    if (!markingScheme) errors.push('theory question needs a marking_scheme')
  }

  if (errors.length > 0) return { errors }

  return {
    errors: [],
    parsed: {
      type: type as 'mcq' | 'theory',
      examCode,
      subjectName,
      topicName,
      difficulty: difficulty as '1' | '2' | '3',
      year,
      questionText,
      options,
      correctAnswer,
      markingScheme,
      maxMarks,
      explanation: get(row, 'explanation') || undefined,
      videoSolutionUrl: get(row, 'video_url') || undefined,
      image: get(row, 'image') || undefined,
      status,
      sourceRef: get(row, 'source_ref') || undefined,
    },
  }
}
