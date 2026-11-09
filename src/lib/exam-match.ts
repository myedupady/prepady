import type { Where } from 'payload'

/**
 * A question "belongs to" an exam when it's the primary `exam` OR when the exam
 * is listed in `extraExams` (multi-board questions). Use this everywhere the
 * quiz engine filters questions by exam, so one question can serve many boards.
 */
export function examMatch(examId: number | string): Where {
  return { or: [{ exam: { equals: examId } }, { extraExams: { equals: examId } }] }
}
