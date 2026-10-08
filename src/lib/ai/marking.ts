/**
 * Deterministic marking helpers — pure, provider-agnostic, and unit-tested.
 *
 * The model proposes a score + feedback via a forced tool call; this module is
 * the guardrail that validates and clamps that proposal into a safe, consistent
 * `MarkResult`. The verdict is DERIVED from the score here (not trusted from the
 * model) so the label can never contradict the number shown to the student.
 */

import { AIError, type MarkResult } from './types'

/** JSON-schema for the forced `submit_marking` tool call. */
export const MARK_TOOL_NAME = 'submit_marking'

export const MARK_TOOL_SCHEMA = {
  type: 'object' as const,
  properties: {
    score: {
      type: 'integer',
      description: 'Marks awarded, an integer from 0 to the maximum marks inclusive.',
    },
    strengths: {
      type: 'array',
      items: { type: 'string' },
      description: 'Concrete scheme points the student earned. Empty if none.',
    },
    improvements: {
      type: 'array',
      items: { type: 'string' },
      description: 'Concrete scheme points the student missed or got wrong. Empty if none.',
    },
    summary: {
      type: 'string',
      description: 'A 1–2 sentence overall summary addressed to the student.',
    },
  },
  required: ['score', 'strengths', 'improvements', 'summary'],
  additionalProperties: false,
}

/** Derive a stable verdict band from the achieved fraction. */
export function deriveVerdict(score: number, maxMarks: number): MarkResult['verdict'] {
  const pct = maxMarks > 0 ? score / maxMarks : 0
  if (pct >= 0.85) return 'excellent'
  if (pct >= 0.6) return 'good'
  if (pct >= 0.4) return 'fair'
  return 'weak'
}

function toStringArray(v: unknown, cap = 6): string[] {
  if (!Array.isArray(v)) return []
  return v
    .map((x) => (typeof x === 'string' ? x.trim() : ''))
    .filter(Boolean)
    .slice(0, cap)
}

/**
 * Validate + clamp a raw tool-call payload into a safe MarkResult.
 * Throws AIError('invalid_output') when the payload is unusable.
 */
export function parseMarkResult(raw: unknown, maxMarks: number): MarkResult {
  if (!raw || typeof raw !== 'object') {
    throw new AIError('Marking model returned no structured result.', 'invalid_output')
  }
  const r = raw as Record<string, unknown>

  const rawScore = Number(r.score)
  if (!Number.isFinite(rawScore)) {
    throw new AIError('Marking model returned a non-numeric score.', 'invalid_output')
  }
  // Clamp to [0, maxMarks] and round to an integer — never trust the model's range.
  const score = Math.max(0, Math.min(maxMarks, Math.round(rawScore)))

  const summary = typeof r.summary === 'string' ? r.summary.trim() : ''

  return {
    score,
    maxMarks,
    verdict: deriveVerdict(score, maxMarks),
    strengths: toStringArray(r.strengths),
    improvements: toStringArray(r.improvements),
    summary: summary || 'Your answer has been marked against the scheme.',
  }
}
