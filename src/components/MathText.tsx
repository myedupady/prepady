import katex from 'katex'
import { parseMathSegments } from '@/lib/math'

/**
 * Render text that may contain LaTeX ($...$ inline, $$...$$ display) produced by
 * the AI tutor or entered by admins. Non-math text keeps its line breaks.
 * KaTeX renders with throwOnError:false, so malformed LaTeX degrades to showing
 * the raw source rather than crashing the page.
 */
export function MathText({ children, className }: { children: string; className?: string }) {
  const segments = parseMathSegments(children ?? '')
  return (
    <span className={className} style={{ whiteSpace: 'pre-line' }}>
      {segments.map((seg, i) => {
        if (seg.type === 'text') return <span key={i}>{seg.value}</span>
        const html = katex.renderToString(seg.value, {
          displayMode: seg.type === 'display',
          throwOnError: false,
          output: 'html',
        })
        return (
          <span
            key={i}
            style={seg.type === 'display' ? { display: 'block', margin: '0.4em 0' } : undefined}
            dangerouslySetInnerHTML={{ __html: html }}
          />
        )
      })}
    </span>
  )
}
