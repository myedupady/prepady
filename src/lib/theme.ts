/**
 * PREPADY THEME REGISTER (programmatic mirror)
 * ============================================================================
 * RUNTIME source of truth: src/app/(frontend)/globals.css (CSS vars), mapped to
 * Tailwind utilities in tailwind.config.ts. Use Tailwind classes in components
 * — bg-ink-900, text-gold-500, bg-card, border-border, etc.
 *
 * This mirrors those values for JS-only contexts (charts, <canvas>, OG images,
 * emails). HSL channel triplets, identical to globals.css — change a colour
 * there and update it here too.
 *
 * Premium "warm" scheme (TopHat-inspired):
 *   cream  → warm canvas        [background]
 *   ink    → warm near-black     [primary buttons, text, dark sections]
 *   gold   → amber accent        [CTAs, highlights]
 *   region pastels → one per region (see REGION_TONES), for exam category chips.
 */

/** Ink — warm near-blacks (primary + dark sections + text). */
export const INK = {
  50: '38 24% 95%', 100: '36 18% 88%', 200: '34 14% 78%', 300: '33 12% 64%',
  400: '33 11% 49%', 500: '32 13% 37%', 600: '31 15% 27%', 700: '30 17% 19%',
  800: '30 19% 14%', 900: '30 21% 10%', 950: '28 24% 6%',
} as const

/** Gold — amber accent. */
export const GOLD = {
  50: '42 80% 94%', 100: '41 85% 86%', 200: '40 88% 76%', 300: '38 90% 67%',
  400: '36 90% 60%', 500: '34 86% 52%', 600: '30 82% 45%', 700: '27 78% 38%',
  800: '25 70% 31%', 900: '24 64% 25%', 950: '24 66% 14%',
} as const

/** Core semantic surfaces (light mode; see globals.css `.dark` for dark). */
export const SURFACES = {
  background: '41 38% 94%', // cream
  foreground: '30 21% 10%', // ink
  card: '44 46% 98%',
  primary: '30 21% 10%', // ink
  primaryForeground: '41 38% 96%',
  border: '40 27% 85%',
  ring: '36 88% 55%', // gold
} as const

/**
 * One pastel tone per region (Tailwind built-in scales). Exam chips are coloured
 * by their region — these literal class strings are the canonical mapping
 * (kept in sync with REGIONS in src/lib/exams.ts).
 */
export const REGION_TONES: Record<string, { pill: string; dot: string }> = {
  'west-africa': { pill: 'bg-rose-100 text-rose-700', dot: 'bg-rose-500' },
  'east-africa': { pill: 'bg-emerald-100 text-emerald-700', dot: 'bg-emerald-500' },
  'southern-africa': { pill: 'bg-violet-100 text-violet-700', dot: 'bg-violet-500' },
  'north-africa': { pill: 'bg-amber-100 text-amber-800', dot: 'bg-amber-500' },
  francophone: { pill: 'bg-blue-100 text-blue-700', dot: 'bg-blue-500' },
  'island-nations': { pill: 'bg-sky-100 text-sky-700', dot: 'bg-sky-500' },
}

/** Resolve a CSS variable to a usable colour string, e.g. cssVar('--ink-900'). */
export const cssVar = (name: string) => `hsl(var(${name}))`
export const ink = (shade: keyof typeof INK) => cssVar(`--ink-${shade}`)
export const gold = (shade: keyof typeof GOLD) => cssVar(`--gold-${shade}`)
/** Static hsl() string (theme-independent) — for OG images / emails. */
export const hsl = (triplet: string) => `hsl(${triplet})`

/**
 * Usage cheat-sheet (Tailwind classes):
 *   Primary action   → bg-ink-900 text-primary-foreground  (or <Button>)
 *   Accent / CTA      → bg-gold-400 text-ink-950  (variant="accent")
 *   Canvas / surfaces → bg-background (cream) / bg-card / bg-muted
 *   Dark sections     → bg-ink-950 text-ink-300
 *   Body text         → text-foreground ; secondary → text-muted-foreground
 *   Exam/region chip  → REGION_TONES[regionValue].pill
 *   States            → text-success / text-warning / text-destructive
 */
const theme = { INK, GOLD, SURFACES, REGION_TONES, cssVar, ink, gold, hsl }
export default theme
