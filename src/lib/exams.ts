/**
 * Exam taxonomy for Prepady.
 *
 * Subjects are admin-managed (a Payload collection) because each exam has many
 * and they evolve; the EXAM list itself is fixed and drives selects across the
 * app (questions, sessions, the exam picker).
 */

export const EXAMS = [
  { value: 'waec', label: 'WAEC (SSCE)' },
  { value: 'neco', label: 'NECO' },
  { value: 'jamb', label: 'JAMB (UTME)' },
  { value: 'post-utme', label: 'Post-UTME' },
  { value: 'igcse', label: 'IGCSE' },
  { value: 'a-level', label: 'A-Level' },
] as const

export type ExamValue = (typeof EXAMS)[number]['value']

export const EXAM_LABELS: Record<string, string> = Object.fromEntries(
  EXAMS.map((e) => [e.value, e.label]),
)

/** Difficulty levels used by the adaptive engine. */
export const DIFFICULTIES = [
  { value: '1', label: '1 — Easy' },
  { value: '2', label: '2 — Medium' },
  { value: '3', label: '3 — Hard' },
] as const
