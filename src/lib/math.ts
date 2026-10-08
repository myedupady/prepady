/**
 * Split text containing LaTeX into renderable segments.
 *
 * Recognises display math ($$...$$) and inline math ($...$). Everything else is
 * plain text. Pure and unit-tested; the <MathText> component renders the output.
 * Escaped dollars (\$) are treated as literal text.
 */

export type MathSegment =
  | { type: 'text'; value: string }
  | { type: 'inline'; value: string }
  | { type: 'display'; value: string }

// $$...$$ (display) OR $...$ (inline, single line, non-empty, not an escaped \$).
const MATH_RE = /\$\$([\s\S]+?)\$\$|(?<!\\)\$([^$\n]+?)(?<!\\)\$/g

export function parseMathSegments(input: string): MathSegment[] {
  if (!input) return []
  const segments: MathSegment[] = []
  let lastIndex = 0
  let m: RegExpExecArray | null

  MATH_RE.lastIndex = 0
  while ((m = MATH_RE.exec(input)) !== null) {
    if (m.index > lastIndex) {
      segments.push({ type: 'text', value: input.slice(lastIndex, m.index) })
    }
    if (m[1] !== undefined) {
      segments.push({ type: 'display', value: m[1].trim() })
    } else if (m[2] !== undefined) {
      segments.push({ type: 'inline', value: m[2].trim() })
    }
    lastIndex = MATH_RE.lastIndex
  }
  if (lastIndex < input.length) {
    segments.push({ type: 'text', value: input.slice(lastIndex) })
  }
  // Unescape literal dollars in text segments.
  return segments.map((s) => (s.type === 'text' ? { ...s, value: s.value.replace(/\\\$/g, '$') } : s))
}

/** True when the text contains any LaTeX math delimiters worth rendering. */
export function hasMath(input: string): boolean {
  return parseMathSegments(input).some((s) => s.type !== 'text')
}
